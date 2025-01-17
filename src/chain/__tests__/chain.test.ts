import { describe, expect, test } from 'vitest'
import { SELECT } from '../keywords'
import { Chain } from '../chain'

describe('chain', () => {
  test('builds sql', () => {
    const userId = 1

    const [sql, params] = SELECT`id, name`.FROM`users`.WHERE`id = ${userId}`.toSql()

    expect(sql).toBe('SELECT id, name FROM users WHERE (id = $1)')
    expect(params).toMatchObject([userId])
  })

  test('"group by" concatenates correctly', () => {
    const rawColumnName = 'author_id'
    const chainColumnName = Chain.from([rawColumnName])

    const [sql] = SELECT`COUNT(*)`.FROM`books`.JOIN`author ON id = author_id`.GROUP_BY`author_id`.toSql()
    const [sql2] = SELECT`COUNT(*)`.FROM`books`.JOIN`author ON id = author_id`.GROUP_BY([rawColumnName]).toSql()
    const [sql3] = SELECT`COUNT(*)`.FROM`books`.JOIN`author ON id = author_id`.GROUP_BY`${chainColumnName}`.toSql()

    expect(sql).toBe('SELECT COUNT(*) FROM books JOIN author ON id = author_id GROUP BY author_id')
    expect(sql2).toBe('SELECT COUNT(*) FROM books JOIN author ON id = author_id GROUP BY author_id')
    expect(sql3).toBe('SELECT COUNT(*) FROM books JOIN author ON id = author_id GROUP BY author_id')
  })
})
