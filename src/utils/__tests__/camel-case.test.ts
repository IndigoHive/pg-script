import { camelCase } from '../camel-case'
import { describe, expect, test } from 'vitest'

describe('camelCase', () => {
  test('converts text to camel case', () => {
    expect(camelCase('user_id')).toBe('userId')
    expect(camelCase('userId')).toBe('userId')
  })
})
