import { describe, expect, test } from 'vitest'
import { DeleteQueryBuilder } from '../delete-query-builder'

describe('DeleteQueryBuilder', () => {
  test('SELECT id, name FROM "users" WHERE (id = $1) AND (status = $2)', () => {
    const userId = 1
    const builder = new DeleteQueryBuilder(null!)

    const [sql, params] = builder
      .DELETE_FROM`users`
      .WHERE`id = ${userId}`
      .toSql()

    expect(sql).toBe('DELETE FROM "users" WHERE (id = $1)')
    expect(params).toMatchObject([userId])
  })
})
