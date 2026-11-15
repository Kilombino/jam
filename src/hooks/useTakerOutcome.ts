import { useQuery } from '@tanstack/react-query'
import { useApiClient } from '@/hooks/useApiClient'
import type { MaxCoinjoinXbt, TakerStatusXbt } from '@/lib/takerOutcome'
import { isTerminalTakerStatus } from '@/lib/takerOutcome'
import type { WalletFileName } from '@/lib/utils'

/**
 * JoinBlaket: outcome of the latest collaborative send (GET /taker/status).
 * Polls while the outcome is not final, so a CoinJoin that fails before the
 * session ever reported it as running is still noticed.
 */
export const useTakerStatus = (walletFileName: WalletFileName, attemptKey: number | undefined, enabled: boolean) => {
  const client = useApiClient()
  return useQuery({
    // One cache entry per payment attempt: never show a previous outcome.
    queryKey: [walletFileName, 'xbt-taker-status', attemptKey],
    queryFn: async () => {
      const { data } = await client.get<{ 200: TakerStatusXbt }, unknown, true>({
        url: '/api/v1/wallet/{walletname}/taker/status',
        path: { walletname: walletFileName },
        throwOnError: true,
      })
      return data
    },
    enabled: enabled && attemptKey !== undefined,
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchInterval: (query) => (isTerminalTakerStatus(query.state.data) ? false : 2_000),
  })
}

export interface MaxCoinjoinQueryParameters {
  mixdepth?: number
  counterparties?: number
  txfee?: number
  /** Changes when the jar's coins change (new coins, frozen, confirmations). */
  utxoKey?: string
}

/**
 * JoinBlaket: the largest amount one CoinJoin can send from a jar
 * (GET /taker/max-coinjoin, the taker's own selection rules).
 */
export const useMaxCoinjoin = (
  walletFileName: WalletFileName,
  parameters: MaxCoinjoinQueryParameters,
  enabled: boolean,
) => {
  const client = useApiClient()
  const { mixdepth, counterparties, txfee, utxoKey } = parameters
  return useQuery({
    queryKey: [walletFileName, 'xbt-max-coinjoin', mixdepth, counterparties, txfee, utxoKey],
    queryFn: async () => {
      const { data } = await client.get<{ 200: MaxCoinjoinXbt }, unknown, true>({
        url: '/api/v1/wallet/{walletname}/taker/max-coinjoin',
        path: { walletname: walletFileName },
        query: {
          mixdepth,
          counterparties: counterparties ?? 1,
          ...(txfee !== undefined && txfee > 0 ? { txfee } : {}),
        },
        throwOnError: true,
      })
      return data
    },
    enabled: enabled && mixdepth !== undefined,
    retry: false,
    staleTime: 30_000,
  })
}
