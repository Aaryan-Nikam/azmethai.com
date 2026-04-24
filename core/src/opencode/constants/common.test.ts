import { expect, test, describe } from 'vitest'
import { getLocalISODate } from './common'

describe('common.ts port', () => {
  test('getLocalISODate returns string', () => {
    const date = getLocalISODate()
    expect(typeof date).toBe('string')
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
