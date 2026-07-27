import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { WebGLFallback } from '../ui/WebGLFallback'

describe('WebGL fallback', () => {
  it('explains the failure accessibly and offers a guarded retry', async () => {
    const user = userEvent.setup()
    const retry = vi.fn()
    const { rerender } = render(<WebGLFallback canRetry onRetry={retry} />)

    expect(screen.getByRole('alert')).toHaveAccessibleName(
      /memory chamber could not open/i,
    )
    await user.click(screen.getByRole('button', { name: /retry memory/i }))
    expect(retry).toHaveBeenCalledOnce()

    rerender(<WebGLFallback canRetry={false} onRetry={retry} />)
    expect(screen.getByRole('button', { name: /retry unavailable/i })).toBeDisabled()
  })
})
