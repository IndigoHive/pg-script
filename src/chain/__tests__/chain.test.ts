import { describe, expect, test } from 'vitest'
import { SELECT } from '../keywords'

describe('chain', () => {
  test('builds sql', () => {
    const userId = 1

    const [sql, params] = SELECT`id, name`.FROM`users`.WHERE`id = ${userId}`.toSql()

    expect(sql).toBe('SELECT id, name FROM users WHERE (id = $1)')
    expect(params).toMatchObject([userId])
  })
})
