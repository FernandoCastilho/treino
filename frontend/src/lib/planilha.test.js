import { afterEach, describe, expect, it, vi } from 'vitest'
import { enviar, montarLinhas } from './planilha.js'
import { WORKOUT_COLUMNS } from './export-csv.js'

const sessao = { sessao: 'abc.def', aba: 'Iris', email: 'i@x.com', exp: Date.now() + 1e6 }

describe('planilha do Drive', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('sem treinos, manda só o cabeçalho', () => {
    expect(montarLinhas({ workouts: [] })).toEqual([WORKOUT_COLUMNS])
  })

  it('envia sessão e linhas (a aba é decidida pelo script); erro do script vira exceção', async () => {
    const f = vi.fn().mockResolvedValue({ json: async () => ({ ok: true, linhas: 0 }) })
    vi.stubGlobal('fetch', f)
    await expect(enviar({ workouts: [] }, sessao, 'https://script.google.com/x')).resolves.toBe(0)
    const corpo = JSON.parse(f.mock.calls[0][1].body)
    expect(corpo).toMatchObject({ sessao: 'abc.def' })
    expect(corpo.aba).toBeUndefined()
    f.mockResolvedValue({ json: async () => ({ ok: false, erro: 'sessão inválida' }) })
    await expect(enviar({ workouts: [] }, sessao, 'u')).rejects.toThrow('sessão inválida')
    await expect(enviar({ workouts: [] }, null, 'u')).rejects.toThrow('config')
  })
})
