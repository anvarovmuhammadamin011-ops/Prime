export const TOURNAMENT_STORAGE = 'prime-tournaments'
export const TOURNAMENT_VERSION = 1

export const fmt = (n) => new Intl.NumberFormat('en-US').format(n)

export const GAMES = [
  { id: 'cs2', name: 'Counter-Strike 2', icon: 'CS2' },
  { id: 'cs16', name: 'Counter-Strike 1.6', icon: 'CS1.6' },
  { id: 'valorant', name: 'Valorant', icon: 'VAL' },
  { id: 'dota2', name: 'Dota 2', icon: 'DOTA' },
  { id: 'lol', name: 'League of Legends', icon: 'LOL' },
  { id: 'fortnite', name: 'Fortnite', icon: 'FN' },
  { id: 'pubg', name: 'PUBG', icon: 'PUBG' },
  { id: 'apex', name: 'Apex Legends', icon: 'APEX' },
  { id: 'rl', name: 'Rocket League', icon: 'RL' },
  { id: 'other', name: 'Boshqa', icon: '???' },
]

export const TOURNAMENT_STATUS = {
  upcoming: 'upcoming',
  registration: 'registration',
  ongoing: 'ongoing',
  finished: 'finished',
}

export const STATUS_LABELS = {
  upcoming: 'Kutilmoqda',
  registration: 'Ro\'yxat ochiq',
  ongoing: 'O\'tmoqda',
  finished: 'Tugadi',
}

export const MATCH_STATUS = {
  pending: 'pending',
  live: 'live',
  completed: 'completed',
}

export const MATCH_STATUS_LABELS = {
  pending: 'Kutilmoqda',
  live: 'Jonliy',
  completed: 'Tugadi',
}

export const ROUND_NAMES = {
  0: '1-tur',
  1: 'Chorak final',
  2: 'Yarim final',
  3: 'Final',
  4: 'Grand Final',
}

export function getRoundName(round, totalRounds) {
  const diff = totalRounds - round
  if (diff === totalRounds) return '1-tur'
  if (diff === totalRounds - 1) return 'Chorak final'
  if (diff === totalRounds - 2) return 'Yarim final'
  if (round === totalRounds) return 'Final'
  return `Tur ${round}`
}

let nextTeamId = 1000
let nextMatchId = 1000

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

export function createTournament(data) {
  return {
    id: generateId(),
    name: data.name || '',
    game: data.game || 'cs2',
    date: data.date || '',
    startTime: data.startTime || '20:00',
    regDeadline: data.regDeadline || '',
    teamSize: data.teamSize || 5,
    maxTeams: data.maxTeams || 16,
    entryFee: data.entryFee || 0,
    prizePool: data.prizePool || 0,
    rules: data.rules || '',
    image: data.image || '',
    branch: data.branch || 'Asosiy filial',
    status: TOURNAMENT_STATUS.upcoming,
    bracketGenerated: false,
    winnerId: null,
    createdAt: new Date().toISOString(),
  }
}

export function createTeam(tournamentId, name, leaderId, leaderName) {
  return {
    id: `team-${nextTeamId++}`,
    tournamentId,
    name,
    leaderId,
    leaderName,
    members: [{ userId: leaderId, name: leaderName, joinedAt: new Date().toISOString() }],
    isReady: false,
    isPaid: false,
    seed: 0,
  }
}

export function createMatch(tournamentId, round, matchIndex, teamA, teamB) {
  return {
    id: `match-${nextMatchId++}`,
    tournamentId,
    round,
    matchIndex,
    teamAId: teamA?.id || null,
    teamBId: teamB?.id || null,
    teamAName: teamA?.name || 'BYE',
    teamBName: teamB?.name || 'BYE',
    scoreA: 0,
    scoreB: 0,
    winnerId: null,
    status: MATCH_STATUS.pending,
    assignedPCs: { teamA: [], teamB: [] },
  }
}

function nextPowerOf2(n) {
  let p = 1
  while (p < n) p <<= 1
  return p
}

export function generateBracket(teams) {
  const totalSlots = nextPowerOf2(teams.length)
  const totalRounds = Math.log2(totalSlots)
  const byesCount = totalSlots - teams.length

  const seeded = teams.map((t, i) => ({ ...t, seed: i + 1 }))

  const sortedTeams = [...seeded].sort((a, b) => a.seed - b.seed)

  const firstRoundMatches = []
  const topSeeds = sortedTeams.slice(0, byesCount)

  let matchIndex = 0
  for (let i = 0; i < byesCount; i++) {
    firstRoundMatches.push(
      createMatch(sortedTeams[0]?.tournamentId, 0, matchIndex++, topSeeds[i], null)
    )
  }

  const remainingTeams = sortedTeams.slice(byesCount)
  for (let i = 0; i < remainingTeams.length; i += 2) {
    const teamA = remainingTeams[i]
    const teamB = remainingTeams[i + 1]
    firstRoundMatches.push(
      createMatch(sortedTeams[0]?.tournamentId, 0, matchIndex++, teamA, teamB)
    )
  }

  const allRounds = [firstRoundMatches]

  let previousMatches = firstRoundMatches
  for (let r = 1; r < totalRounds; r++) {
    const matchesInRound = Math.ceil(previousMatches.length / 2)
    const roundMatches = []
    for (let m = 0; m < matchesInRound; m++) {
      roundMatches.push(
        createMatch(sortedTeams[0]?.tournamentId, r, m, null, null)
      )
    }
    allRounds.push(roundMatches)
    previousMatches = roundMatches
  }

  return allRounds
}

export function advanceWinner(matches, round, matchIndex, winnerTeam) {
  const currentMatch = matches.find(m => m.round === round && m.matchIndex === matchIndex)
  if (!currentMatch) return null

  const nextRound = round + 1
  const nextMatchIndex = Math.floor(matchIndex / 2)
  const nextSlot = matchIndex % 2 === 0 ? 'teamA' : 'teamB'

  return { nextRound, nextMatchIndex, nextSlot, winnerTeam }
}

export function createInitialTournaments() {
  return [
    createTournament({
      name: 'PRIME CS2 CUP #1',
      game: 'cs2',
      date: '2026-09-25',
      startTime: '20:00',
      regDeadline: '2026-09-25T18:00',
      teamSize: 5,
      maxTeams: 16,
      entryFee: 50000,
      prizePool: 2000000,
      rules: 'O\'yinchilar barcha yangilanishlarni o\'rnatishi shart. Cheats/hack ishlatish taqiqlanadi.',
      branch: 'Asosiy filial',
    }),
    createTournament({
      name: 'PRIME CS 1.6 TOURNAMENT',
      game: 'cs16',
      date: '2026-09-28',
      startTime: '19:00',
      regDeadline: '2026-09-28T17:00',
      teamSize: 5,
      maxTeams: 8,
      entryFee: 30000,
      prizePool: 800000,
      rules: 'Classic CS 1.6 qoidalari. de_dust2 map.',
      branch: 'Asosiy filial',
    }),
    createTournament({
      name: 'PRIME VALORANT SHOWDOWN',
      game: 'valorant',
      date: '2026-10-02',
      startTime: '18:00',
      regDeadline: '2026-10-02T16:00',
      teamSize: 5,
      maxTeams: 12,
      entryFee: 0,
      prizePool: 500000,
      rules: 'Bepul turnir. Competitive map rotation.',
      branch: '2- filial',
    }),
  ]
}
