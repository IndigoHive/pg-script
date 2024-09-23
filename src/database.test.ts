import { Database } from './database'
import { describe, expect, test } from 'vitest'

describe('Database', () => {
  describe('SELECT', () => {
    test('generates SELECT queries', () => {
      const db = new Database(null!)

      const [sql, params] = db
        .SELECT`id, name`
        .FROM`posts`
        .WHERE`status = ${'published'}`
        .AND`deleted IS FALSE`
        .toSql()

      expect(sql).toBe('SELECT id, name FROM "posts" WHERE (status = $1) AND (deleted IS FALSE)')
      expect(params).toEqual(['published'])
    })

    test('generates SELECT queries from objects', () => {
      const db = new Database(null!)

      const [sql, params] = db
        .SELECT`id, name`
        .FROM('posts')
        .WHERE({ status: 'published' })
        .AND({ deleted: false })
        .toSql()

      expect(sql).toBe('SELECT id, name FROM "posts" WHERE ("status" = $1) AND ("deleted" = $2)')
      expect(params).toEqual(['published', false])
    })
  })

  describe('INSERT', () => {
    test('generates INSERT queries', () => {
      const db = new Database(null!)

      const [sql, params] = db
        .INSERT_INTO`posts`
        .VALUES({ title: 'Hello, World!' })
        .RETURNING`id`
        .toSql()

      expect(sql).toBe('INSERT INTO "posts" ("title") VALUES ($1) RETURNING id')
      expect(params).toEqual(['Hello, World!'])
    })
  })

  describe('UPDATE', () => {
    test('generates UPDATE queries', () => {
      const db = new Database(null!)

      const [sql, params] = db
        .UPDATE`posts`
        .SET`title = ${'Hello, world!'}`
        .WHERE`id = ${1}`
        .RETURNING`id`
        .toSql()

      expect(sql).toBe('UPDATE "posts" SET title = $1 WHERE (id = $2) RETURNING id')
      expect(params).toMatchObject(['Hello, world!', 1])
    })

    test('generates UPDATE queries from objects', () => {
      const db = new Database(null!)

      const [sql, params] = db
        .UPDATE`posts`
        .SET({ title: 'Hello, world!', status: undefined })
        .WHERE`id = ${1}`
        .RETURNING`id`
        .toSql()

      expect(sql).toBe('UPDATE "posts" SET "title" = $1 WHERE (id = $2) RETURNING id')
      expect(params).toMatchObject(['Hello, world!', 1])
    })
  })

  describe('DELETE', () => {
    test('generates DELETE queries', () => {
      const db = new Database(null!)

      const [sql, params] = db
        .DELETE_FROM`posts`
        .WHERE`id = ${1}`
        .toSql()

      expect(sql).toBe('DELETE FROM "posts" WHERE (id = $1)')
      expect(params).toEqual([1])
    })
  })
})
