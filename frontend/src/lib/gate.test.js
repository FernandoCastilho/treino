import { describe, it, expect } from 'vitest'
import { derivar, confere } from './gate.js'

const SALT = '00112233445566778899aabbccddeeff'

describe('tela de senha', () => {
  it('aceita a senha certa e recusa a errada', async () => {
    const config = `1000:${SALT}:${await derivar('senha-de-teste', SALT, 1000)}`
    expect(await confere('senha-de-teste', config)).toBe(true)
    expect(await confere('outra-senha', config)).toBe(false)
  })

  it('sem configuração ou com configuração torta, recusa tudo', async () => {
    expect(await confere('qualquer', undefined)).toBe(false)
    expect(await confere('qualquer', '')).toBe(false)
    expect(await confere('qualquer', 'lixo')).toBe(false)
  })
})
