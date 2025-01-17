import { describe, expect, test } from 'vitest'
import { InsertQueryBuilder } from '../insert-query-builder'

describe('InsertQueryBuilder', () => {
  test('SELECT id, name FROM "users" WHERE (id = $1) AND (status = $2)', () => {
    const table = 'users'
    const builder = new InsertQueryBuilder(null!)

    const [sql, params] = builder
      .INSERT_INTO(table)
      .VALUES({
        id: 1,
        name: 'John Doe'
      })
      .toSql()

    expect(sql).toBe('INSERT INTO "users" ("id", "name") VALUES ($1, $2)')
    expect(params).toMatchObject([1, 'John Doe'])
  })
})
