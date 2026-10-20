// Bitcoin BLAKE2b (XBT) build of Jam, for the XBT build of JoinMarket-NG.
// Jam itself never fetches external data (see the Content-Security-Policy in
// index.html); this file only defines the user-facing explorer links.

export const XBT_CHAIN_LABEL = 'Bitcoin BLAKE2b'

// Block explorer of the BLAKE2b chain. Links are only shown on mainnet: test
// networks (regtest, signet, testnet) have no public explorer.
export const XBT_EXPLORER_URL = 'https://mempool.kilombino.com'

export const xbtExplorerTxUrl = (txid: string, network: string | null | undefined): string | undefined =>
  network === 'mainnet' && /^[0-9a-f]{64}$/i.test(txid) ? `${XBT_EXPLORER_URL}/tx/${txid}` : undefined
