import { describe, expect, test } from 'vitest'
import { merge } from '../merge'

describe('merge', () => {
  describe('when there are no items', () => {
    test('returns empty template', () => {
      const [template, ...params] = merge([])

      expect(template).toMatchObject([])
      expect(params).toMatchObject([])
    })
  })

  describe('when there is one item', () => {
    test('returns the item', () => {
      const [template, ...params] = merge([{
        template: ['Hello'],
        params: []
      }])

      expect(template).toMatchObject(['Hello'])
      expect(params).toMatchObject([])
    })
  })

  describe('when there are two item', () => {
    test('merges the items', () => {
      const [template, ...params] = merge([
        { template: ['Hello', ' ! '], params: [1] },
        { template: ['World', ' ? '], params: [2] }
      ])

      expect(template).toMatchObject(['Hello', ' ! World', ' ? '])
      expect(params).toMatchObject([1, 2])
    })
  })
})
