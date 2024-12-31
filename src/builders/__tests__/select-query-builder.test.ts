import { describe, expect, test } from 'vitest'
import { SelectQueryBuilder } from '../select-query-builder'
import { EXISTS, SELECT } from '../../chain'

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

  test('SELECT id, name FROM "users"', () => {
    const builder = new SelectQueryBuilder(null!)

    const [sql, params] = builder
      .SELECT`id`
      .SELECT`name`
      .FROM`users`
      .toSql()

    expect(sql).toBe('SELECT id, name FROM "users"')
    expect(params).toMatchObject([])
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

  test('SELECT id, name FROM "users" WHERE (EXISTS (SELECT id FROM posts WHERE (author_id = users.id))) ORDER BY name ASC', () => {
    const builder = new SelectQueryBuilder(null!)

    const [sql, params] = builder
      .SELECT`id, name`
      .FROM`users`
      .WHERE(EXISTS(SELECT`id`.FROM`posts`.WHERE`author_id = users.id`))
      .ORDER_BY`name ASC`
      .toSql()

    expect(sql).toBe('SELECT id, name FROM "users" WHERE (EXISTS (SELECT id FROM posts WHERE (author_id = users.id))) ORDER BY name ASC')
    expect(params).toMatchObject([])
  })

  test('SELECT id, name FROM "users" WHERE (status = $1) ORDER BY (SELECT COUNT(*) FROM posts WHERE (author_id = users.id) AND (status = $2)) DESC, name ASC', () => {
    const postStatus = 'published'
    const userStatus = 'active'
    const builder = new SelectQueryBuilder(null!)

    const [sql] = builder
      .SELECT`id, name`
      .FROM`users`
      .WHERE`status = ${userStatus}`
      .ORDER_BY`(${
        SELECT`COUNT(*)`.FROM`posts`.WHERE`author_id = users.id`.AND`status = ${postStatus}`
      }) DESC`
      .ORDER_BY`name ASC`
      .toSql()

    expect(sql).toBe('SELECT id, name FROM "users" WHERE (status = $1) ORDER BY (SELECT COUNT(*) FROM posts WHERE (author_id = users.id) AND (status = $2)) DESC, name ASC')
  })
})
