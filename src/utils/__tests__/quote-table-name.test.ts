import { describe, expect, test } from 'vitest'
import { quoteTableName } from '../quote-table-name'

describe('quoteTableName', () => {
  test('quotes table name', () => {
    expect(quoteTableName('users')).toBe('"users"')
  })

  describe('when the table name is already quoted', () => {
    test('does not quote table name', () => {
      expect(quoteTableName('"public"."users"')).toBe('"public"."users"')
    })
  })

  describe('when the table name has dots', () => {
    test('does not quote table name', () => {
      expect(quoteTableName('public.users')).toBe('public.users')
    })
  })
})
