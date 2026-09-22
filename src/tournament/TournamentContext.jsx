import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  createTournament,
  createTeam,
  generateBracket,
  TOURNAMENT_STORAGE,
  TOURNAMENT_VERSION,
  TOURNAMENT_STATUS,
  MATCH_STATUS,
  createInitialTournaments,
} from '../data/tournaments.js'

const TournamentContext = createContext(null)

export function useTournament() {
  const ctx = useContext(TournamentContext)
  if (!ctx) throw new Error('useTournament must be used within TournamentProvider')
  return ctx
}

function loadState() {
  try {
    const raw = localStorage.getItem(TOURNAMENT_STORAGE)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed.v !== TOURNAMENT_VERSION) return null
    return parsed
  } catch {
    return null
  }
}

function saveState(state) {
  try {
    localStorage.setItem(
      TOURNAMENT_STORAGE,
      JSON.stringify({
        v: TOURNAMENT_VERSION,
        tournaments: state.tournaments,
        teams: state.teams,
        matches: state.matches,
        results: state.results,
      })
    )
  } catch { /* ignore */ }
}

export function TournamentProvider({ children }) {
  const saved = loadState()

  const [tournaments, setTournaments] = useState(saved?.tournaments ?? createInitialTournaments())
  const [teams, setTeams] = useState(saved?.teams ?? [])
  const [matches, setMatches] = useState(saved?.matches ?? [])
  const [results, setResults] = useState(saved?.results ?? {})

  useEffect(() => {
    saveState({ tournaments, teams, matches, results })
  }, [tournaments, teams, matches, results])

  const addTournament = useCallback((data) => {
    const t = createTournament(data)
    setTournaments((prev) => [...prev, t])
    return t
  }, [])

  const updateTournament = useCallback((id, updates) => {
    setTournaments((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)))
  }, [])

  const deleteTournament = useCallback((id) => {
    setTournaments((prev) => prev.filter((t) => t.id !== id))
    setTeams((prev) => prev.filter((t) => t.tournamentId !== id))
    setMatches((prev) => prev.filter((m) => m.tournamentId !== id))
  }, [])

  const openRegistration = useCallback((id) => {
    setTournaments((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: TOURNAMENT_STATUS.registration } : t))
    )
  }, [])

  const closeRegistration = useCallback((id) => {
    setTournaments((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: TOURNAMENT_STATUS.upcoming } : t))
    )
  }, [])

  const startTournament = useCallback((id) => {
    setTournaments((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: TOURNAMENT_STATUS.ongoing } : t))
    )
  }, [])

  const finishTournament = useCallback((id, winnerId) => {
    setTournaments((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: TOURNAMENT_STATUS.finished, winnerId } : t))
    )
  }, [])

  const createTeamForTournament = useCallback((tournamentId, name, userId, userName) => {
    const team = createTeam(tournamentId, name, userId, userName)
    setTeams((prev) => [...prev, team])
    return team
  }, [])

  const addPlayerToTeam = useCallback((teamId, userId, userName) => {
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id !== teamId) return t
        if (t.members.some((m) => m.userId === userId)) return t
        const tournament = tournaments.find((x) => x.id === t.tournamentId)
        const teamSize = tournament?.teamSize || 5
        const newMembers = [...t.members, { userId, name: userName, joinedAt: new Date().toISOString() }]
        return {
          ...t,
          members: newMembers,
          isReady: newMembers.length >= teamSize,
        }
      })
    )
  }, [tournaments])

  const removePlayerFromTeam = useCallback((teamId, userId) => {
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id !== teamId) return t
        if (t.leaderId === userId) return t
        const tournament = tournaments.find((x) => x.id === t.tournamentId)
        const teamSize = tournament?.teamSize || 5
        const newMembers = t.members.filter((m) => m.userId !== userId)
        return { ...t, members: newMembers, isReady: newMembers.length >= teamSize }
      })
    )
  }, [tournaments])

  const markTeamPaid = useCallback((teamId) => {
    setTeams((prev) => prev.map((t) => (t.id === teamId ? { ...t, isPaid: true } : t)))
  }, [])

  const markTeamReady = useCallback((teamId, ready) => {
    setTeams((prev) => prev.map((t) => (t.id === teamId ? { ...t, isReady: ready } : t)))
  }, [])

  const generateTournamentBracket = useCallback((tournamentId) => {
    const tournamentTeams = teams.filter((t) => t.tournamentId === tournamentId)
    if (tournamentTeams.length < 2) return false

    const rounds = generateBracket(tournamentTeams)
    setMatches((prev) => [
      ...prev.filter((m) => m.tournamentId !== tournamentId),
      ...rounds.flat(),
    ])
    setTournaments((prev) =>
      prev.map((t) => (t.id === tournamentId ? { ...t, bracketGenerated: true } : t))
    )
    return true
  }, [teams])

  const updateMatchScore = useCallback((matchId, scoreA, scoreB, winnerId) => {
    setMatches((prev) =>
      prev.map((m) =>
        m.id === matchId
          ? { ...m, scoreA, scoreB, winnerId, status: MATCH_STATUS.completed }
          : m
      )
    )
  }, [])

  const advanceWinnerToNextRound = useCallback((matchId) => {
    setMatches((prev) => {
      const match = prev.find((m) => m.id === matchId)
      if (!match || !match.winnerId) return prev

      const winnerTeam = prev.find(
        (m) => m.tournamentId === match.tournamentId
      )
      const winnerName = match.winnerId === match.teamAId ? match.teamAName : match.teamBName

      const nextRound = match.round + 1
      const nextMatchIndex = Math.floor(match.matchIndex / 2)
      const nextSlot = match.matchIndex % 2 === 0 ? 'teamA' : 'teamB'

      return prev.map((m) => {
        if (m.round === nextRound && m.matchIndex === nextMatchIndex && m.tournamentId === match.tournamentId) {
          if (nextSlot === 'teamA') {
            return { ...m, teamAId: match.winnerId, teamAName: winnerName }
          } else {
            return { ...m, teamBId: match.winnerId, teamBName: winnerName }
          }
        }
        return m
      })
    })
  }, [])

  const assignPCs = useCallback((matchId, teamAPCs, teamBPCs) => {
    setMatches((prev) =>
      prev.map((m) =>
        m.id === matchId
          ? { ...m, assignedPCs: { teamA: teamAPCs, teamB: teamBPCs } }
          : m
      )
    )
  }, [])

  const startMatch = useCallback((matchId) => {
    setMatches((prev) =>
      prev.map((m) => (m.id === matchId ? { ...m, status: MATCH_STATUS.live } : m))
    )
  }, [])

  const getTeamsForTournament = useCallback(
    (tournamentId) => teams.filter((t) => t.tournamentId === tournamentId),
    [teams]
  )

  const getMatchesForTournament = useCallback(
    (tournamentId) => matches.filter((m) => m.tournamentId === tournamentId),
    [matches]
  )

  const getTeamForUser = useCallback(
    (tournamentId, userId) =>
      teams.find((t) => t.tournamentId === tournamentId && t.members.some((m) => m.userId === userId)),
    [teams]
  )

  const getUserTeams = useCallback(
    (userId) => teams.filter((t) => t.members.some((m) => m.userId === userId)),
    [teams]
  )

  const isUserInTournament = useCallback(
    (tournamentId, userId) =>
      teams.some((t) => t.tournamentId === tournamentId && t.members.some((m) => m.userId === userId)),
    [teams]
  )

  const value = {
    tournaments,
    teams,
    matches,
    results,
    addTournament,
    updateTournament,
    deleteTournament,
    openRegistration,
    closeRegistration,
    startTournament,
    finishTournament,
    createTeamForTournament,
    addPlayerToTeam,
    removePlayerFromTeam,
    markTeamPaid,
    markTeamReady,
    generateTournamentBracket,
    updateMatchScore,
    advanceWinnerToNextRound,
    assignPCs,
    startMatch,
    getTeamsForTournament,
    getMatchesForTournament,
    getTeamForUser,
    getUserTeams,
    isUserInTournament,
  }

  return <TournamentContext.Provider value={value}>{children}</TournamentContext.Provider>
}
