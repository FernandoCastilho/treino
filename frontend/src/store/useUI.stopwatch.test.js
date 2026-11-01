// @vitest-environment happy-dom
// useUI pulls in api.js, which reads navigator.userAgent at module scope.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useUI } from './useUI.js'
import { useStore } from './useStore.js'

// Cronômetro da série (FC Gym): o work timer contando para cima. Concluir devolve o tempo e libera o descanso.
describe('cronômetro da série', () => {
  let original
  beforeEach(() => {
    vi.useFakeTimers()
    original = useStore.getState().S
    useStore.setState({ S: { ...original, sound: false, timedSetOvertime: true } })
    useUI.setState({ timer: null, work: null })
  })
  afterEach(() => {
    useUI.getState().stopWork()
    useStore.setState({ S: original })
    vi.useRealTimers()
  })

  it('conta para cima e não usa a prorrogação das séries por tempo', () => {
    useUI.getState().startWork(3600, 'Flexão', vi.fn(), null, { up: true })
    const w = useUI.getState().work
    expect(w.up).toBe(true)
    expect(w.overtime).toBe(false)
    vi.advanceTimersByTime(5000)
    const agora = useUI.getState().work
    expect(agora.total - agora.left).toBe(5)
  })

  it('concluir devolve os segundos e para o cronômetro', () => {
    const feito = vi.fn()
    useUI.getState().startWork(3600, 'Flexão', feito, null, { up: true })
    vi.advanceTimersByTime(12_000)
    useUI.getState().finishWorkEarly()
    expect(feito).toHaveBeenCalledTimes(1)
    expect(feito.mock.calls[0][0]).toBe(12)
    expect(useUI.getState().work).toBe(null)
  })

  it('o descanso de uma série começa com 60 s por padrão', () => {
    expect(useStore.getState().S.restSec).toBe(60)
  })

  it('cronômetro e descanso nunca rodam juntos', () => {
    useUI.getState().startRest(60, 0)
    useUI.getState().startWork(3600, 'Flexão', vi.fn(), null, { up: true })
    expect(useUI.getState().timer).toBe(null)
    expect(useUI.getState().work).not.toBe(null)
  })
})
