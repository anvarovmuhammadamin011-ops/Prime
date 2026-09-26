import { describe, expect, it } from 'vitest'
import { createSqlitePool, translateSqlForSqlite } from '../db/sqlite/driver.js'

function memoryPool() {
  return createSqlitePool({ database: { file: ':memory:' } })
}

describe('sqlite driver', () => {
  it('translates postgres-only syntax', () => {
    expect(translateSqlForSqlite('SELECT now()')).toContain('strftime')
    expect(translateSqlForSqlite("SELECT * FROM users WHERE name ILIKE 'a'")).toContain('LIKE')
    expect(translateSqlForSqlite('SELECT * FROM t WHERE id = $1 FOR UPDATE')).not.toMatch(/FOR UPDATE/i)
    expect(translateSqlForSqlite('SELECT count(*) FILTER (WHERE status = $1)')).toContain('CASE WHEN')
    expect(translateSqlForSqlite('SELECT $1::jsonb')).toBe('SELECT ?')
    expect(translateSqlForSqlite("SELECT * FROM t WHERE start_at < $1 + interval '10 minutes'"))
      .toContain("'+10 minutes'")
  })

  it('converts booleans, dates and undefined into bindable values', async () => {
    const pool = memoryPool()
    await pool.query('CREATE TABLE flags (id TEXT PRIMARY KEY, active INTEGER, at TEXT)')
    await pool.query('INSERT INTO flags (id, active, at) VALUES (?, ?, ?)', ['a', true, new Date('2026-01-02T03:04:05.000Z')])
    const result = await pool.query('SELECT * FROM flags WHERE id = ?', ['a'])
    expect(result.rows[0].active).toBe(1)
    expect(result.rows[0].at).toBe('2026-01-02T03:04:05.000Z')
    await pool.query('INSERT INTO flags (id, active, at) VALUES (?, ?, ?)', ['b', false, undefined])
    const second = await pool.query('SELECT * FROM flags WHERE id = ?', ['b'])
    expect(second.rows[0].active).toBe(0)
    expect(second.rows[0].at).toBeNull()
    await pool.end()
  })

  it('binds placeholders in textual order even when they are out of sequence', async () => {
    const pool = memoryPool()
    await pool.query('CREATE TABLE t (id TEXT PRIMARY KEY, start_at TEXT, end_at TEXT)')
    await pool.query('INSERT INTO t (id, start_at, end_at) VALUES (?, ?, ?)', ['x', '2026-01-01T10:00:00.000Z', '2026-01-01T12:00:00.000Z'])
    const overlap = await pool.query(
      'SELECT id FROM t WHERE start_at < $3 AND end_at > $2 AND id = $1',
      ['x', '2026-01-01T11:00:00.000Z', '2026-01-01T13:00:00.000Z'],
    )
    expect(overlap.rows).toHaveLength(1)
    const noOverlap = await pool.query(
      'SELECT id FROM t WHERE start_at < $3 AND end_at > $2 AND id = $1',
      ['x', '2026-01-01T12:30:00.000Z', '2026-01-01T13:00:00.000Z'],
    )
    expect(noOverlap.rows).toHaveLength(0)
    await pool.end()
  })

  it('expands ANY($n::uuid[]) into an IN list', async () => {
    const pool = memoryPool()
    await pool.query('CREATE TABLE s (id TEXT PRIMARY KEY, status TEXT)')
    await pool.query("INSERT INTO s (id, status) VALUES ('a', 'active')")
    await pool.query("INSERT INTO s (id, status) VALUES ('b', 'done')")
    const result = await pool.query("SELECT id FROM s WHERE id = ANY($1::uuid[]) AND status = 'active'", [['a', 'b']])
    expect(result.rows.map((row) => row.id)).toEqual(['a'])
    await pool.end()
  })

  it('replaces generate_series with a recursive CTE', async () => {
    const pool = memoryPool()
    await pool.query('CREATE TABLE pcs (pc_number INTEGER PRIMARY KEY)')
    await pool.query(
      `INSERT INTO pcs (pc_number)
       SELECT numbers.pc_number FROM generate_series(1, 5) AS numbers(pc_number)`,
    )
    const result = await pool.query('SELECT COUNT(*) AS total FROM pcs')
    expect(Number(result.rows[0].total)).toBe(5)
    await pool.end()
  })

  it('maps constraint failures onto postgres error codes', async () => {
    const pool = memoryPool()
    await pool.query('CREATE TABLE u (id TEXT PRIMARY KEY)')
    await pool.query('INSERT INTO u (id) VALUES (?)', ['dup'])
    await expect(pool.query('INSERT INTO u (id) VALUES (?)', ['dup'])).rejects.toMatchObject({ code: '23505' })
    await expect(
      pool.query('INSERT INTO u (id) VALUES (?)', ['other']).then(() => pool.query('DELETE FROM u WHERE id = ?', ['other'])),
    ).resolves.toBeDefined()
    await pool.end()
  })

  it('rolls back a failed transaction', async () => {
    const pool = memoryPool()
    await pool.query('CREATE TABLE t (id TEXT PRIMARY KEY)')
    const client = await pool.connect()
    await client.query('BEGIN')
    await client.query('INSERT INTO t (id) VALUES (?)', ['inside'])
    await client.query('ROLLBACK')
    const result = await pool.query('SELECT * FROM t')
    expect(result.rows).toHaveLength(0)
    await pool.end()
  })
})
