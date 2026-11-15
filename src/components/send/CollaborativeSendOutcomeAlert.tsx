import { AlertTriangleIcon, CheckCircle2Icon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { describeTakerFailure, type TakerStatusXbt } from '@/lib/takerOutcome'
import { Button } from '../ui/button'

interface CollaborativeSendOutcomeAlertProps {
  status: TakerStatusXbt
  onDone: () => void
}

/**
 * JoinBlaket: the outcome of a collaborative send as jmwalletd reports it
 * (GET /taker/status), instead of a generic "the flow has stopped".
 */
export const CollaborativeSendOutcomeAlert = ({ status, onDone }: CollaborativeSendOutcomeAlertProps) => {
  const { t } = useTranslation()
  const done = (
    <div>
      <Button variant="outline" onClick={onDone}>
        {t('global.done')}
      </Button>
    </div>
  )

  if (status.status === 'complete') {
    return (
      <Alert variant="success" data-testid="collaborative-send-complete">
        <CheckCircle2Icon />
        <AlertTitle>{t('send.taker_failure.title_complete')}</AlertTitle>
        <AlertDescription className="flex flex-col gap-2">
          {status.txid && <div className="font-mono text-xs break-all slashed-zero">{status.txid}</div>}
          {done}
        </AlertDescription>
      </Alert>
    )
  }

  const failure = describeTakerFailure(t, status)
  return (
    <Alert variant="destructive" data-testid="collaborative-send-failed">
      <AlertTriangleIcon />
      <AlertTitle>{t('send.taker_failure.title')}</AlertTitle>
      <AlertDescription className="flex flex-col gap-2">
        <div>{failure.description}</div>
        {failure.hint && <div>{failure.hint}</div>}
        {/* Coded failures all happen before any transaction is built. */}
        {status.error_code && status.error_code !== 'other' && !status.txid && (
          <div className="text-muted-foreground text-xs">{t('send.taker_failure.no_funds_moved')}</div>
        )}
        {done}
      </AlertDescription>
    </Alert>
  )
}
