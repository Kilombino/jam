import { useState, type ComponentProps } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertCircleIcon, AlertTriangleIcon, CheckIcon, CopyIcon, HatGlassesIcon } from 'lucide-react'
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
import { useApiClient } from '@/hooks/useApiClient'
import { getErrorReason } from '@/lib/errorReason'
import { bondLockMonth, type WatchExportResponse } from '@/lib/kilowalletExport'
import type { WalletFileName } from '@/lib/utils'
import type { WithRequiredProperty } from '@/types/global'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'
import { buttonVariants } from '../ui/button-variants'
import { BitcoinXpubQrCode } from '../ui/jam/BitcoinQrCode'
import { CopyButton } from '../ui/jam/CopyButton'
import { Spinner } from '../ui/spinner'

const QRCODE_WIDTH = 360

type KilowalletWatchDialogProps = WithRequiredProperty<
  Omit<ComponentProps<typeof Dialog>, 'children'>,
  'open' | 'onOpenChange'
> & {
  walletFileName: WalletFileName
}

/**
 * "View in Kilowallet (read-only)": a QR code and the same text to copy, with
 * the five jar account keys and the fidelity bonds of this wallet, and no
 * private key. Kilowallet's JOINMARKET wallet imports it to follow the jars and
 * bonds and to warn when a bond unlocks. Fetched fresh on every opening, so a
 * bond created since is in it.
 */
export const KilowalletWatchDialog = ({
  open,
  onOpenChange,
  walletFileName,
  ...dialogProps
}: KilowalletWatchDialogProps) => {
  const { t } = useTranslation()
  const client = useApiClient()
  const [showQrCode, setShowQrCode] = useState(false)

  const exportQuery = useQuery({
    queryKey: [walletFileName, 'kilowallet-watch-export'],
    queryFn: async () => {
      const { data } = await client.get<{ 200: WatchExportResponse }, unknown, true>({
        url: '/api/v1/wallet/{walletname}/watch-export',
        path: { walletname: walletFileName },
        throwOnError: true,
      })
      return data
    },
    enabled: open,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  })

  const handleClose = () => {
    setShowQrCode(false)
    onOpenChange(false)
  }

  const data = exportQuery.data
  const testNetwork = data !== undefined && data.network !== 'mainnet'

  return (
    <Dialog open={open} onOpenChange={handleClose} {...dialogProps}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('settings.kilowallet_modal.title')}</DialogTitle>
          <DialogDescription>{t('settings.kilowallet_modal.subtitle')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {exportQuery.isFetching && (
            <div className="text-muted-foreground flex items-center justify-center gap-1">
              <Spinner className="motion-reduce:hidden" />
              {t('global.loading')}
            </div>
          )}

          {!exportQuery.isFetching && exportQuery.error && (
            <Alert variant="destructive">
              <AlertTriangleIcon />
              <AlertTitle>{t('settings.kilowallet_modal.text_error_title')}</AlertTitle>
              <AlertDescription>
                {getErrorReason(exportQuery.error, t('global.errors.reason_unknown'))}
              </AlertDescription>
            </Alert>
          )}

          {!exportQuery.isFetching && data && (
            <>
              <Alert variant="default">
                <AlertCircleIcon />
                <AlertTitle>{t('settings.kilowallet_modal.text_info_title')}</AlertTitle>
                <AlertDescription>{t('settings.kilowallet_modal.text_info_message')}</AlertDescription>
              </Alert>

              {testNetwork && (
                <Alert variant="warning">
                  <AlertTriangleIcon />
                  <AlertDescription>
                    {t('settings.kilowallet_modal.text_test_network', { network: data.network })}
                  </AlertDescription>
                </Alert>
              )}

              <div className="text-sm" data-testid="kilowallet-bonds">
                {data.bonds.length === 0
                  ? t('settings.kilowallet_modal.text_no_bonds')
                  : t('settings.kilowallet_modal.text_bonds', {
                      count: data.bonds.length,
                      months: data.bonds.map(([, locktime]) => bondLockMonth(locktime)).join(', '),
                    })}
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="bg-muted flex w-full items-center gap-2 rounded-md p-2">
                  <div className="max-h-24 flex-1 overflow-y-auto font-mono text-xs break-all select-all">
                    {data.export}
                  </div>
                  <CopyButton
                    className={buttonVariants({ size: 'icon', variant: 'ghost', className: 'shrink-0' })}
                    value={data.export}
                    text={<CopyIcon className="h-3 w-3" />}
                    successText={<CheckIcon className="text-brand-success h-3 w-3" />}
                    title={t('settings.kilowallet_modal.button_copy')}
                    aria-label={t('settings.kilowallet_modal.button_copy')}
                    onSuccess={() => toast.success(t('settings.kilowallet_modal.text_copied'))}
                    onError={(error) =>
                      toast.error(
                        t('global.errors.error_copy_to_clipboard_failed', {
                          reason:
                            (error instanceof Error ? error.message : undefined) || t('global.errors.reason_unknown'),
                        }),
                      )
                    }
                  />
                </div>
                {showQrCode ? (
                  <BitcoinXpubQrCode
                    xpub={data.export}
                    width={QRCODE_WIDTH}
                    errorCorrectionLevel="low"
                    className="animate-in fade-in duration-1000"
                  />
                ) : (
                  <div className="flex aspect-square w-full max-w-80 items-center justify-center border">
                    <Button variant="outline" size="lg" onClick={() => setShowQrCode(true)}>
                      <HatGlassesIcon />
                      {t('settings.kilowallet_modal.button_reveal_qrcode')}
                    </Button>
                  </div>
                )}
              </div>

              <p className="text-muted-foreground text-xs">{t('settings.kilowallet_modal.text_regenerate')}</p>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t('global.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
