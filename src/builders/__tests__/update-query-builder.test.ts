import { describe, expect, test } from 'vitest'
import { UpdateQueryBuilder } from '../update-query-builder'

describe('UpdateQueryBuilder', () => {
  test('SELECT id, name FROM "users" WHERE (id = $1) AND (status = $2)', () => {
    const status = 'active'
    const now = new Date()
    const userId = 1
    const builder = new UpdateQueryBuilder(null!)

    const [sql, params] = builder
      .UPDATE`users`
      .SET`status = ${status}`
      .SET`update_date = ${now}`
      .WHERE`id = ${userId}`
      .toSql()

    expect(sql).toBe('UPDATE "users" SET status = $1, update_date = $2 WHERE (id = $3)')
    expect(params).toMatchObject([status, now, userId])
  })
})
