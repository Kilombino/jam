import { describe, expect, it } from 'vitest'
import { XBT_EXPLORER_URL, xbtExplorerTxUrl } from './xbt'

const TXID = 'c39d915a1ef8b67283dd28a090c163e5c47a8d03ba86052d95e9706311fb83e7'

describe('xbtExplorerTxUrl', () => {
  it('links mainnet txids to the BLAKE2b explorer', () => {
    expect(xbtExplorerTxUrl(TXID, 'mainnet')).toBe(`${XBT_EXPLORER_URL}/tx/${TXID}`)
    expect(XBT_EXPLORER_URL).toBe('https://mempool.kilombino.com')
  })

  it('returns nothing on test networks or for malformed txids', () => {
    expect(xbtExplorerTxUrl(TXID, 'regtest')).toBeUndefined()
    expect(xbtExplorerTxUrl(TXID, null)).toBeUndefined()
    expect(xbtExplorerTxUrl('demo_123', 'mainnet')).toBeUndefined()
  })
})
