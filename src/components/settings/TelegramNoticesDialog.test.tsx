import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TelegramNoticesDialog } from './TelegramNoticesDialog'

const h = vi.hoisted(() => ({
  query: { data: { enabled: false, chat_id: null }, error: null, isFetching: false },
  mutate: vi.fn(),
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) => (values ? `${key} ${JSON.stringify(values)}` : key),
  }),
}))

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => h.query,
  useMutation: () => ({ mutate: h.mutate, isPending: false }),
  useQueryClient: () => ({ setQueryData: vi.fn() }),
}))

vi.mock('@/hooks/useApiClient', () => ({ useApiClient: () => ({}) }))

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }: { open: boolean; children: ReactNode }) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: ReactNode }) => <p>{children}</p>,
  DialogFooter: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
}))

const TOKEN = '9154091586:' + 'A'.repeat(35)

const fill = (token: string, chat: string) => {
  fireEvent.change(screen.getByLabelText('settings.telegram_modal.label_token'), { target: { value: token } })
  fireEvent.change(screen.getByLabelText('settings.telegram_modal.label_chat'), { target: { value: chat } })
}

describe('TelegramNoticesDialog', () => {
  beforeEach(() => {
    h.mutate.mockReset()
    render(<TelegramNoticesDialog open onOpenChange={vi.fn()} />)
  })

  it("refuses the bot's own number as the chat id", () => {
    fill(TOKEN, '9154091586')
    expect(screen.getByTestId('telegram-chat-is-bot')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'settings.telegram_modal.button_save' })).toBeDisabled()
  })

  it('saves with a real Telegram id', () => {
    fill(TOKEN, '123456789')
    expect(screen.queryByTestId('telegram-chat-is-bot')).not.toBeInTheDocument()
    const save = screen.getByRole('button', { name: 'settings.telegram_modal.button_save' })
    expect(save).toBeEnabled()
    fireEvent.click(save)
    expect(h.mutate).toHaveBeenCalled()
  })
})
