/**
 * JoinBlaket: why a collaborative send (taker CoinJoin) failed, and the
 * largest amount one CoinJoin can send from a jar.
 *
 * Both come from jmwalletd: GET /taker/status carries `error_code` and
 * `error_params` (stable codes from the taker, see taker.eligibility
 * FAILURE_* in Kilombino/joinblaket), and GET /taker/max-coinjoin runs the
 * taker's own coin-selection rules. Nothing here re-implements those rules;
 * this file only turns codes and numbers into text.
 */
import type { TFunction } from 'i18next'
import { formatSats } from '@/lib/utils'

export type TakerErrorParameters = Record<string, number | string | boolean>

export interface TakerStatusXbt {
  running: boolean
  status?: string | null
  txid?: string | null
  error?: string | null
  broadcast_method?: string | null
  error_code?: string | null
  error_params?: TakerErrorParameters | null
}

export interface MaxCoinjoinXbt {
  mixdepth: number
  counterparties: number
  min_confirmations: number
  max_selectable: number
  max_sendable: number
  limited_by: 'balance' | 'md0_no_merge' | 'podle_utxo_too_small' | 'no_eligible_utxos' | string
  merge_restricted: boolean
  eligible_count: number
  eligible_value: number
  largest_utxo: number
  mergeable_pool: number
  immature_value: number
  fee_rate_sat_vb: number
  estimated_tx_fee: number
  max_maker_fee_abs: number
  max_maker_fee_rel: number
}

export const TERMINAL_TAKER_STATUSES = ['complete', 'failed', 'cancelled'] as const

export const isTerminalTakerStatus = (status?: TakerStatusXbt): boolean =>
  status !== undefined &&
  !status.running &&
  (TERMINAL_TAKER_STATUSES as readonly string[]).includes(status.status ?? '')

const numberParameter = (parameters: TakerErrorParameters, key: string): number | undefined => {
  const value = parameters[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

const sats = (value: number | undefined) => (value === undefined ? '?' : formatSats(value))

export interface TakerFailureText {
  /** One or two sentences, in the user's language. */
  description: string
  /** What the user can do about it (may be empty). */
  hint?: string
}

/**
 * Human-readable reason for a failed CoinJoin. Unknown codes (or an old
 * daemon without codes) fall back to the daemon's own English message.
 */
export const describeTakerFailure = (t: TFunction, status: TakerStatusXbt): TakerFailureText => {
  const parameters = status.error_params ?? {}
  const jar = numberParameter(parameters, 'mixdepth')
  const minConfirmations = numberParameter(parameters, 'min_confirmations')
  const confirmationsHint =
    parameters.confirmations_hint === true && minConfirmations !== undefined
      ? t('send.taker_failure.hint_confirmations', { confirmations: minConfirmations })
      : undefined
  const raw = status.error || t('global.errors.reason_unknown')

  switch (status.error_code) {
    case 'md0_no_merge': {
      const fees = numberParameter(parameters, 'fees')
      const maxAmount = numberParameter(parameters, 'max_amount')
      return {
        description: t('send.taker_failure.md0_no_merge', {
          needed: sats(numberParameter(parameters, 'needed')),
          largest: sats(numberParameter(parameters, 'largest_utxo')),
        }),
        hint: [
          fees !== undefined
            ? t('send.taker_failure.md0_no_merge_fees', {
                amount: sats(numberParameter(parameters, 'amount')),
                fees: sats(fees),
              })
            : undefined,
          t('send.taker_failure.hint_send_less_or_consolidate', { max: sats(maxAmount) }),
          confirmationsHint,
        ]
          .filter(Boolean)
          .join(' '),
      }
    }
    case 'insufficient_funds':
      return {
        description: t('send.taker_failure.insufficient_funds', {
          needed: sats(numberParameter(parameters, 'needed')),
          available: sats(numberParameter(parameters, 'available')),
        }),
        hint: confirmationsHint,
      }
    case 'unconfirmed_funds':
      return {
        description: t('send.taker_failure.unconfirmed_funds', {
          needed: sats(numberParameter(parameters, 'needed')),
          available: sats(numberParameter(parameters, 'available')),
          unconfirmed: sats(numberParameter(parameters, 'unconfirmed')),
        }),
        hint: confirmationsHint ?? t('send.taker_failure.hint_confirmations', { confirmations: minConfirmations ?? 5 }),
      }
    case 'no_eligible_utxos':
      return {
        description: t('send.taker_failure.no_eligible_utxos', { jar: jar ?? '?' }),
        hint: t('send.taker_failure.hint_no_eligible_utxos', { confirmations: minConfirmations ?? 5 }),
      }
    case 'podle_utxo_too_small':
      return {
        description: t('send.taker_failure.podle_utxo_too_small', {
          needed: sats(numberParameter(parameters, 'needed')),
          percent: numberParameter(parameters, 'percent') ?? 20,
        }),
        hint: t('send.taker_failure.hint_podle'),
      }
    case 'not_enough_offers':
      return {
        description: t('send.taker_failure.not_enough_offers', {
          found: numberParameter(parameters, 'found') ?? 0,
          minimum: numberParameter(parameters, 'minimum') ?? 1,
        }),
        hint: t('send.taker_failure.hint_try_later'),
      }
    case 'not_enough_makers':
      return {
        description: t(
          parameters.bond_required === true
            ? 'send.taker_failure.not_enough_makers_bond'
            : 'send.taker_failure.not_enough_makers',
          { found: numberParameter(parameters, 'found') ?? 0, minimum: numberParameter(parameters, 'minimum') ?? 1 },
        ),
        hint: t('send.taker_failure.hint_fee_limits'),
      }
    default:
      return { description: t('send.taker_failure.other', { reason: raw }) }
  }
}

export type MaxCoinjoinVerdict = 'ok' | 'near_limit' | 'too_much'

/**
 * `too_much`: above what the taker can fund at all (it would refuse).
 * `near_limit`: fits the coins, but maybe not with the fees on top.
 */
export const maxCoinjoinVerdict = (
  data: MaxCoinjoinXbt | undefined,
  amount: number | undefined,
): MaxCoinjoinVerdict => {
  if (data === undefined || amount === undefined || !Number.isFinite(amount) || amount <= 0) return 'ok'
  if (amount > data.max_selectable) return 'too_much'
  if (amount > data.max_sendable) return 'near_limit'
  return 'ok'
}
