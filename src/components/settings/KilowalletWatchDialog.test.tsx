import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { KilowalletWatchDialog } from './KilowalletWatchDialog'

type QueryState = { data?: unknown; error: Error | null; isFetching: boolean }

const h = vi.hoisted(() => {
  const query: QueryState = { error: null, isFetching: false }
  const seen: { options?: { enabled?: boolean; queryFn?: () => Promise<unknown> } } = {}
  return { query, seen, get: vi.fn() }
})

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) => (values ? `${key} ${JSON.stringify(values)}` : key),
  }),
}))

vi.mock('@tanstack/react-query', () => ({
  useQuery: (options: { enabled?: boolean; queryFn?: () => Promise<unknown> }) => {
    h.seen.options = options
    return h.query
  },
}))

vi.mock('@/hooks/useApiClient', () => ({ useApiClient: () => ({ get: h.get }) }))

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }: { open: boolean; children: ReactNode }) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: ReactNode }) => <p>{children}</p>,
  DialogFooter: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
}))

vi.mock('../ui/jam/BitcoinQrCode', () => ({
  BitcoinXpubQrCode: ({ xpub }: { xpub: string }) => <div data-testid="qr">{xpub}</div>,
}))

const EXPORT = {
  network: 'mainnet',
  xpubs: ['zpub0', 'zpub1', 'zpub2', 'zpub3', 'zpub4'],
  bonds: [[82, 1793491200]],
  export: 'kilowallet-jm:v1:{"n":"mainnet","x":["zpub0","zpub1","zpub2","zpub3","zpub4"],"b":[[82,1793491200]]}',
}

const renderDialog = (open = true) =>
  render(<KilowalletWatchDialog walletFileName={'w.jmdat'} open={open} onOpenChange={vi.fn()} />)

describe('KilowalletWatchDialog', () => {
  beforeEach(() => {
    h.query = { data: undefined, error: null, isFetching: false }
    h.get.mockReset()
  })

  it('asks jmwalletd for the read-only export only while open', async () => {
    h.get.mockResolvedValue({ data: EXPORT })
    renderDialog(false)
    expect(h.seen.options?.enabled).toBe(false)
    renderDialog(true)
    expect(h.seen.options?.enabled).toBe(true)
    await expect(h.seen.options?.queryFn?.()).resolves.toEqual(EXPORT)
    expect(h.get).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/api/v1/wallet/{walletname}/watch-export',
        path: { walletname: 'w.jmdat' },
      }),
    )
  })

  it('shows the export text, the bonds and the QR code on demand', () => {
    h.query = { data: EXPORT, error: null, isFetching: false }
    renderDialog()
    expect(screen.getByText(EXPORT.export)).toBeInTheDocument()
    expect(screen.getByTestId('kilowallet-bonds').textContent).toContain('2026-11')
    expect(screen.queryByTestId('qr')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('settings.kilowallet_modal.button_reveal_qrcode'))
    expect(screen.getByTestId('qr').textContent).toBe(EXPORT.export)
    expect(screen.queryByText(/text_test_network/)).not.toBeInTheDocument()
  })

  it('warns when the wallet is not on mainnet', () => {
    h.query = { data: { ...EXPORT, network: 'regtest', bonds: [] }, error: null, isFetching: false }
    renderDialog()
    expect(screen.getByText(/text_test_network/)).toBeInTheDocument()
    expect(screen.getByText('settings.kilowallet_modal.text_no_bonds')).toBeInTheDocument()
  })

  it('shows an error', () => {
    h.query = { data: undefined, error: new Error('boom'), isFetching: false }
    renderDialog()
    expect(screen.getByText('settings.kilowallet_modal.text_error_title')).toBeInTheDocument()
  })
})
