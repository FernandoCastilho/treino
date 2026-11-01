import { describe, expect, it } from 'vitest'
import { existsSync, readdirSync } from 'node:fs'

// Todo exercício do catálogo precisa ter a imagem (still/) e o vídeo (clip/) de execução.
// A pasta catalogue/media é licenciada à parte (NOTICE.md) e pode não estar no checkout: sem ela, o teste não roda.
const catalogo = new URL('../../../catalogue/', import.meta.url)
const temMidia = existsSync(new URL('media/still/', catalogo))

describe.skipIf(!temMidia)('mídia dos exercícios', () => {
  const ids = readdirSync(new URL('exercises/', catalogo)).filter(f => f.endsWith('.json')).map(f => f.slice(0, -5))

  it('cada exercício tem imagem e vídeo', { timeout: 60_000 }, () => {
    const faltando = ids.flatMap(id => [
      existsSync(new URL(`media/still/${id}.webp`, catalogo)) ? null : `still/${id}.webp`,
      existsSync(new URL(`media/clip/${id}.mp4`, catalogo)) ? null : `clip/${id}.mp4`
    ]).filter(Boolean)
    expect(faltando.slice(0, 10), `${faltando.length} arquivos de mídia faltando`).toEqual([])
  })
})
