import { describe, expect, it } from 'vitest'
import { bondLockMonth, KILOWALLET_EXPORT_PREFIX, parseKilowalletExport } from './kilowalletExport'

describe('parseKilowalletExport', () => {
  it('parses a v1 export', () => {
    const text = `${KILOWALLET_EXPORT_PREFIX}{"n":"mainnet","x":["zpub0","zpub1","zpub2","zpub3","zpub4"],"b":[[82,1793491200]]}`
    expect(parseKilowalletExport(text)).toEqual({
      network: 'mainnet',
      xpubs: ['zpub0', 'zpub1', 'zpub2', 'zpub3', 'zpub4'],
      bonds: [{ timenumber: 82, locktime: 1793491200 }],
    })
  })

  it('refuses anything else', () => {
    expect(() =>
      parseKilowalletExport('zpub6rFR7y4Q2AijBEqTUquhVz398htDFrtymD9xYYfG1m4wAcvPhXNfE3EfH1r1ADqtfSdV'),
    ).toThrow()
    expect(() => parseKilowalletExport(`${KILOWALLET_EXPORT_PREFIX}{"n":"mainnet","x":[1],"b":[]}`)).toThrow()
    expect(() => parseKilowalletExport(`${KILOWALLET_EXPORT_PREFIX}{"n":"mainnet","x":[],"b":[[1]]}`)).toThrow()
  })
})

describe('bondLockMonth', () => {
  it('gives the UTC month', () => {
    expect(bondLockMonth(1793491200)).toBe('2026-11')
    expect(bondLockMonth(1577836800)).toBe('2020-01')
  })
})
