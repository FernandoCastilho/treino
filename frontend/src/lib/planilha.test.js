import { afterEach, describe, expect, it, vi } from 'vitest'
import { configurada, enviar, montarLinhas } from './planilha.js'
import { WORKOUT_COLUMNS } from './export-csv.js'

const ok = { url: 'https://script.google.com/macros/s/x/exec', token: 't', aba: 'Iris' }

describe('planilha do Drive', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('só vale com endereço do Google, código e aba', () => {
    expect(configurada(ok)).toBe(true)
    expect(configurada({ ...ok, token: '' })).toBe(false)
    expect(configurada({ ...ok, aba: '' })).toBe(false)
    expect(configurada({ ...ok, url: 'https://exemplo.com/exec' })).toBe(false)
  })

  it('sem treinos, manda só o cabeçalho', () => {
    expect(montarLinhas({ workouts: [] })).toEqual([WORKOUT_COLUMNS])
  })

  it('envia aba, código e linhas; erro do script vira exceção', async () => {
    const f = vi.fn().mockResolvedValue({ json: async () => ({ ok: true, linhas: 0 }) })
    vi.stubGlobal('fetch', f)
    await expect(enviar({ workouts: [] }, ok)).resolves.toBe(0)
    const corpo = JSON.parse(f.mock.calls[0][1].body)
    expect(corpo).toMatchObject({ token: 't', aba: 'Iris' })
    f.mockResolvedValue({ json: async () => ({ ok: false, erro: 'código inválido' }) })
    await expect(enviar({ workouts: [] }, ok)).rejects.toThrow('código inválido')
    await expect(enviar({ workouts: [] }, { ...ok, token: '' })).rejects.toThrow('config')
  })
})
