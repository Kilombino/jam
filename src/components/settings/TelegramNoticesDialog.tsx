import { useState, type ComponentProps } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircleIcon, AlertTriangleIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useApiClient } from '@/hooks/useApiClient'
import { getErrorReason } from '@/lib/errorReason'
import type { WithRequiredProperty } from '@/types/global'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'
import { Spinner } from '../ui/spinner'

interface TelegramStatus {
  enabled: boolean
  chat_id: string | null
}

const QUERY_KEY = ['xbt-telegram']

type TelegramNoticesDialogProps = WithRequiredProperty<
  Omit<ComponentProps<typeof Dialog>, 'children'>,
  'open' | 'onOpenChange'
>

/**
 * JoinBlaket: "Telegram notices". The maker tells a Telegram bot when someone
 * takes an offer, when a CoinJoin is done and when it loses the directories.
 * The token is sent to the wallet daemon and never shown again.
 */
export const TelegramNoticesDialog = ({ open, onOpenChange, ...dialogProps }: TelegramNoticesDialogProps) => {
  const { t } = useTranslation()
  const client = useApiClient()
  const queryClient = useQueryClient()
  const [botToken, setBotToken] = useState('')
  const [chatId, setChatId] = useState('')

  const statusQuery = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data } = await client.get<{ 200: TelegramStatus }, unknown, true>({
        url: '/api/v1/xbt/telegram',
        throwOnError: true,
      })
      return data
    },
    enabled: open,
    staleTime: 0,
    retry: false,
  })

  const onError = (error: unknown) => toast.error(getErrorReason(error, t('global.errors.reason_unknown')))

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data } = await client.post<{ 200: TelegramStatus }, unknown, true>({
        url: '/api/v1/xbt/telegram',
        body: { bot_token: botToken.trim(), chat_id: chatId.trim() },
        headers: { 'Content-Type': 'application/json' },
        throwOnError: true,
      })
      return data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEY, data)
      setBotToken('')
      toast.success(t('settings.telegram_modal.text_saved'))
    },
    onError,
  })

  const disableMutation = useMutation({
    mutationFn: async () => {
      const { data } = await client.delete<{ 200: TelegramStatus }, unknown, true>({
        url: '/api/v1/xbt/telegram',
        throwOnError: true,
      })
      return data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEY, data)
      toast.success(t('settings.telegram_modal.text_disabled'))
    },
    onError,
  })

  const testMutation = useMutation({
    mutationFn: async () => {
      await client.post<{ 200: { sent: boolean } }, unknown, true>({
        url: '/api/v1/xbt/telegram/test',
        throwOnError: true,
      })
    },
    onSuccess: () => toast.success(t('settings.telegram_modal.text_test_sent')),
    onError,
  })

  const status = statusQuery.data
  const busy = saveMutation.isPending || disableMutation.isPending || testMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange} {...dialogProps}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('settings.telegram_modal.title')}</DialogTitle>
          <DialogDescription>{t('settings.telegram_modal.subtitle')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {statusQuery.isFetching && (
            <div className="text-muted-foreground flex items-center justify-center gap-1">
              <Spinner className="motion-reduce:hidden" />
              {t('global.loading')}
            </div>
          )}

          {!statusQuery.isFetching && statusQuery.error && (
            <Alert variant="destructive">
              <AlertTriangleIcon />
              <AlertDescription>
                {getErrorReason(statusQuery.error, t('global.errors.reason_unknown'))}
              </AlertDescription>
            </Alert>
          )}

          {status && (
            <Alert variant="default" data-testid="telegram-status">
              <AlertCircleIcon />
              <AlertTitle>
                {status.enabled
                  ? t('settings.telegram_modal.text_enabled', { chat: status.chat_id })
                  : t('settings.telegram_modal.text_off')}
              </AlertTitle>
              <AlertDescription>{t('settings.telegram_modal.text_howto')}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-1">
            <Label htmlFor="telegram-bot-token">{t('settings.telegram_modal.label_token')}</Label>
            <Input
              id="telegram-bot-token"
              type="password"
              autoComplete="off"
              placeholder="123456789:AA…"
              value={botToken}
              onChange={(event_) => setBotToken(event_.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="telegram-chat-id">{t('settings.telegram_modal.label_chat')}</Label>
            <Input
              id="telegram-chat-id"
              autoComplete="off"
              placeholder={status?.chat_id ?? '123456789'}
              value={chatId}
              onChange={(event_) => setChatId(event_.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <div className="flex gap-2">
            {status?.enabled && (
              <>
                <Button variant="outline" disabled={busy} onClick={() => testMutation.mutate()}>
                  {t('settings.telegram_modal.button_test')}
                </Button>
                <Button variant="outline" disabled={busy} onClick={() => disableMutation.mutate()}>
                  {t('settings.telegram_modal.button_disable')}
                </Button>
              </>
            )}
          </div>
          <Button
            disabled={busy || botToken.trim() === '' || chatId.trim() === ''}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending && <Spinner className="motion-reduce:hidden" />}
            {t('settings.telegram_modal.button_save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
