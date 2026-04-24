import { expect, test, describe } from 'vitest'
import { isBareMode, getAWSRegion, isEnvTruthy } from './envUtils'

describe('envUtils.ts port', () => {
  test('isEnvTruthy parses booleans', () => {
    expect(isEnvTruthy('true')).toBe(true)
    expect(isEnvTruthy('1')).toBe(true)
    expect(isEnvTruthy('false')).toBe(false)
    expect(isEnvTruthy('0')).toBe(false)
  })

  test('getAWSRegion defaults appropriately', () => {
    expect(typeof getAWSRegion()).toBe('string')
  })
})
