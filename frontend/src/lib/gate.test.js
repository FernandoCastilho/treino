// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { entrar, lerSessao, sair } from './acesso.js'

const resposta = r => vi.fn().mockResolvedValue({ json: async () => r })

describe('entrada com o Google', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.unstubAllGlobals())

  it('guarda a sessão, libera o app como visitante e manda só o comprovante do Google', async () => {
    const f = resposta({ ok: true, sessao: 'abc.def', aba: 'Fernando', email: 'f@x.com', exp: Date.now() + 1e6 })
    vi.stubGlobal('fetch', f)
    await entrar('comprovante', 'https://script.google.com/macros/s/x/exec')
    expect(JSON.parse(f.mock.calls[0][1].body)).toEqual({ idToken: 'comprovante' })
    expect(lerSessao()).toMatchObject({ sessao: 'abc.def', aba: 'Fernando' })
    expect(localStorage.getItem('gym_guest')).toBe('1')
  })

  it('e-mail fora da lista vira mensagem clara e não guarda nada', async () => {
    vi.stubGlobal('fetch', resposta({ ok: false, erro: 'e-mail não autorizado' }))
    await expect(entrar('x', 'u')).rejects.toThrow('não está na lista da família')
    expect(lerSessao()).toBeNull()
  })

  it('sem conexão, avisa; sessão vencida não vale; sair apaga a sessão', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('rede')))
    await expect(entrar('x', 'u')).rejects.toThrow('Sem conexão')
    localStorage.setItem('fc_sessao', JSON.stringify({ sessao: 's', aba: 'Bia', exp: Date.now() - 1 }))
    expect(lerSessao()).toBeNull()
    localStorage.setItem('fc_sessao', JSON.stringify({ sessao: 's', aba: 'Bia', exp: Date.now() + 1e6 }))
    expect(lerSessao()).not.toBeNull()
    sair()
    expect(lerSessao()).toBeNull()
  })
})
