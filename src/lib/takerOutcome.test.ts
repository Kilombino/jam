import type { TFunction } from 'i18next'
import { describe, expect, it } from 'vitest'
import { describeTakerFailure, isTerminalTakerStatus, maxCoinjoinVerdict, type MaxCoinjoinXbt } from './takerOutcome'

const t = ((key: string, options?: Record<string, unknown>) =>
  key + (options ? ' ' + JSON.stringify(options) : '')) as unknown as TFunction

describe('describeTakerFailure', () => {
  it('explains the mixdepth-0 merge refusal without a confirmations hint (15 Nov 2026 case)', () => {
    const text = describeTakerFailure(t, {
      running: false,
      status: 'failed',
      error: 'Insufficient funds: ... Cannot merge non-CJ md0 UTXOs for privacy reasons.',
      error_code: 'md0_no_merge',
      error_params: {
        mixdepth: 0,
        needed: 354_414,
        largest_utxo: 297_776,
        max_amount: 297_776,
        min_confirmations: 5,
        confirmations_hint: false,
      },
    })
    expect(text.description).toContain('send.taker_failure.md0_no_merge')
    expect(text.description).toContain('354,414')
    expect(text.description).toContain('297,776')
    expect(text.hint).toContain('send.taker_failure.hint_send_less_or_consolidate')
    expect(text.hint).not.toContain('hint_confirmations')
  })

  it('adds the confirmations hint only when the daemon says it helps', () => {
    const text = describeTakerFailure(t, {
      running: false,
      status: 'failed',
      error_code: 'insufficient_funds',
      error_params: { needed: 10, available: 5, min_confirmations: 5, confirmations_hint: true },
    })
    expect(text.hint).toContain('send.taker_failure.hint_confirmations')
    expect(text.hint).toContain('"confirmations":5')
  })

  it('falls back to the raw message for unknown codes or an old daemon', () => {
    expect(describeTakerFailure(t, { running: false, status: 'failed', error: 'boom' }).description).toContain(
      'send.taker_failure.other {"reason":"boom"}',
    )
    expect(
      describeTakerFailure(t, { running: false, status: 'failed', error: 'x', error_code: 'something_new' })
        .description,
    ).toContain('send.taker_failure.other')
  })

  it('says when makers need a fidelity bond', () => {
    const text = describeTakerFailure(t, {
      running: false,
      status: 'failed',
      error_code: 'not_enough_makers',
      error_params: { found: 0, minimum: 1, bond_required: true },
    })
    expect(text.description).toContain('send.taker_failure.not_enough_makers_bond')
  })
})

describe('isTerminalTakerStatus', () => {
  it('needs a final status and not running', () => {
    expect(isTerminalTakerStatus(undefined)).toBe(false)
    expect(isTerminalTakerStatus({ running: true, status: null })).toBe(false)
    expect(isTerminalTakerStatus({ running: true, status: 'failed' })).toBe(false)
    expect(isTerminalTakerStatus({ running: false, status: 'fetching_orderbook' })).toBe(false)
    expect(isTerminalTakerStatus({ running: false, status: 'failed' })).toBe(true)
    expect(isTerminalTakerStatus({ running: false, status: 'complete' })).toBe(true)
  })
})

describe('maxCoinjoinVerdict', () => {
  const data = { max_selectable: 297_776, max_sendable: 296_000 } as MaxCoinjoinXbt
  it('compares against the daemon numbers only', () => {
    expect(maxCoinjoinVerdict(undefined, 1_000_000)).toBe('ok')
    expect(maxCoinjoinVerdict(data, undefined)).toBe('ok')
    expect(maxCoinjoinVerdict(data, 100_000)).toBe('ok')
    expect(maxCoinjoinVerdict(data, 297_000)).toBe('near_limit')
    expect(maxCoinjoinVerdict(data, 297_777)).toBe('too_much')
  })
})
