import { describe, expect, test } from 'vitest'
import { SelectQueryBuilder } from '../select-query-builder'

describe('SelectQueryBuilder', () => {
  test('SELECT id, name FROM "users" WHERE (id = $1) AND (status = $2)', () => {
    const userId = 1
    const status = 'active'
    const builder = new SelectQueryBuilder(null!)

    const [sql, params] = builder
      .SELECT`id, name`
      .FROM`users`
      .WHERE`id = ${userId}`
      .AND`status = ${status}`
      .toSql()

    expect(sql).toBe('SELECT id, name FROM "users" WHERE (id = $1) AND (status = $2)')
    expect(params).toMatchObject([userId, status])
  })

  test('SELECT id, title FROM "posts" WHERE (status = $1) AND (deleted IS FALSE) LIMIT $2 OFFSET $3', () => {
    const status = 'published'
    const builder = new SelectQueryBuilder(null!)

    const [sql, params] = builder
      .SELECT`id, title`
      .FROM`posts`
      .WHERE`status = ${status}`
      .AND`deleted IS FALSE`
      .LIMIT(10)
      .OFFSET(20)
      .toSql()

    expect(sql).toBe('SELECT id, title FROM "posts" WHERE (status = $1) AND (deleted IS FALSE) LIMIT $2 OFFSET $3')
    expect(params).toMatchObject([status, 10, 20])
  })

  test('SELECT id, title, users.name as "author" FROM "posts" JOIN users ON users.id = posts.author_id WHERE (status = $1) AND (deleted IS FALSE) LIMIT $2 OFFSET $3', () => {
    const status = 'published'
    const builder = new SelectQueryBuilder(null!)

    const [sql, params] = builder
      .SELECT`id, title, users.name as "author"`
      .FROM`posts`
      .JOIN`users ON users.id = posts.author_id`
      .WHERE`status = ${status}`
      .AND`deleted IS FALSE`
      .LIMIT(10)
      .OFFSET(20)
      .toSql()

    expect(sql).toBe('SELECT id, title, users.name as "author" FROM "posts" JOIN users ON users.id = posts.author_id WHERE (status = $1) AND (deleted IS FALSE) LIMIT $2 OFFSET $3')
    expect(params).toMatchObject([status, 10, 20])
  })
})
