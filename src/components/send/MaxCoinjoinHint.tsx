import { AlertTriangleIcon, InfoIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Balance } from '@/components/ui/jam/Balance'
import { maxCoinjoinVerdict, type MaxCoinjoinXbt } from '@/lib/takerOutcome'
import { formatSats } from '@/lib/utils'

interface MaxCoinjoinHintProps {
  data: MaxCoinjoinXbt
  amount?: number
  jarName?: string
}

/**
 * JoinBlaket: "Max in one CoinJoin from this jar: X sats" under the amount,
 * with the reason when the jar holds more than one CoinJoin can spend.
 */
export const MaxCoinjoinHint = ({ data, amount, jarName }: MaxCoinjoinHintProps) => {
  const { t } = useTranslation()
  const verdict = maxCoinjoinVerdict(data, amount)
  const restricted = data.limited_by === 'md0_no_merge'

  return (
    <div className="flex flex-col gap-1 text-sm" data-testid="max-coinjoin-hint">
      <div className="text-muted-foreground inline-flex flex-wrap items-center gap-1">
        <InfoIcon className="size-4 shrink-0" />
        <span>{t('send.max_coinjoin.label', { jar: jarName ?? `#${data.mixdepth}` })}</span>
        <Balance className="text-foreground font-semibold" valueString={String(data.max_sendable)} />
      </div>
      {restricted && (
        <div className="text-muted-foreground text-xs">
          {t('send.max_coinjoin.md0_no_merge', {
            largest: formatSats(data.largest_utxo),
            total: formatSats(data.eligible_value),
          })}
        </div>
      )}
      {data.limited_by === 'podle_utxo_too_small' && (
        <div className="text-muted-foreground text-xs">{t('send.max_coinjoin.podle')}</div>
      )}
      {data.immature_value > 0 && (
        <div className="text-muted-foreground text-xs">
          {t('send.max_coinjoin.immature', {
            amount: formatSats(data.immature_value),
            confirmations: data.min_confirmations,
          })}
        </div>
      )}
      {verdict === 'too_much' && (
        <div
          className="text-destructive inline-flex items-start gap-1"
          role="alert"
          data-testid="max-coinjoin-too-much"
        >
          <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
          <span>
            {restricted
              ? t('send.max_coinjoin.too_much_md0', { max: formatSats(data.max_sendable) })
              : t('send.max_coinjoin.too_much', { max: formatSats(data.max_sendable) })}
          </span>
        </div>
      )}
      {verdict === 'near_limit' && (
        <div className="inline-flex items-start gap-1 text-amber-600 dark:text-amber-400">
          <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
          <span>
            {t('send.max_coinjoin.near_limit', {
              max: formatSats(data.max_sendable),
              fee: formatSats(data.estimated_tx_fee),
            })}
          </span>
        </div>
      )}
    </div>
  )
}
