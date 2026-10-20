/**
 * Read-only export of a wallet for Kilowallet's JOINMARKET wallet.
 *
 * jmwalletd builds it (GET /wallet/{walletname}/watch-export) so the browser
 * never needs the seed: the five jar account keys (BIP84 m/84'/coin'/N') and
 * the wallet's own fidelity bonds as [timenumber, locktime], the bond key being
 * m/84'/coin'/0'/2/<timenumber>, and the master key fingerprint that signers
 * look for in a PSBT. No private keys.
 *
 *   kilowallet-jm:v1:{"n":"mainnet","x":["zpub…",…],"b":[[82,1793491200],…],"f":"73c5da0a"}
 */
export const KILOWALLET_EXPORT_PREFIX = 'kilowallet-jm:v1:'

export interface WatchExportResponse {
  network: string
  xpubs: string[]
  bonds: Array<[number, number]>
  fingerprint?: string
  export: string
}

export interface KilowalletExport {
  network: string
  xpubs: string[]
  bonds: Array<{ timenumber: number; locktime: number }>
}

/** Parses an export string; throws on anything that is not a v1 export. */
export function parseKilowalletExport(text: string): KilowalletExport {
  const trimmed = text.trim()
  if (!trimmed.startsWith(KILOWALLET_EXPORT_PREFIX)) {
    throw new Error('Not a Kilowallet JoinMarket export')
  }
  const data: unknown = JSON.parse(trimmed.slice(KILOWALLET_EXPORT_PREFIX.length))
  if (typeof data !== 'object' || data === null) throw new Error('Malformed export')
  const { n, x, b } = data as { n?: unknown; x?: unknown; b?: unknown }
  if (typeof n !== 'string' || !Array.isArray(x) || !x.every((it) => typeof it === 'string') || !Array.isArray(b)) {
    throw new Error('Malformed export')
  }
  const bonds = b.map((it: unknown) => {
    if (!Array.isArray(it) || it.length !== 2 || !it.every((v) => Number.isInteger(v))) {
      throw new Error('Malformed bond entry')
    }
    return { timenumber: it[0] as number, locktime: it[1] as number }
  })
  return { network: n, xpubs: x, bonds }
}

/** The UTC month a bond unlocks, e.g. "2026-11". */
export function bondLockMonth(locktime: number): string {
  const d = new Date(locktime * 1_000)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}
