// Copia as imagens (still/) e os vídeos (clip/) dos exercícios para dist/exercise-media/, de onde o app os lê
// (lib/exercises.js: 'exercise-media/still/' e 'exercise-media/clip/'). Falha se faltar mídia de algum exercício.
import { cpSync, existsSync, readdirSync } from 'node:fs'

const origem = new URL('../../catalogue/media/', import.meta.url)
const destino = new URL('../dist/exercise-media/', import.meta.url)
const exercicios = readdirSync(new URL('../../catalogue/exercises/', import.meta.url)).filter(f => f.endsWith('.json')).map(f => f.slice(0, -5))

// Sem a pasta de mídia (ela é licenciada à parte, ver NOTICE.md) o app sobe sem as imagens e vídeos.
if (!existsSync(origem)) {
  console.warn('catalogue/media/ não existe: o app será publicado SEM as imagens e vídeos dos exercícios.')
  process.exit(0)
}

const faltando = []
for (const id of exercicios) {
  if (!existsSync(new URL(`still/${id}.webp`, origem))) faltando.push(`still/${id}.webp`)
  if (!existsSync(new URL(`clip/${id}.mp4`, origem))) faltando.push(`clip/${id}.mp4`)
}
if (faltando.length) {
  console.error(`Mídia faltando para ${faltando.length} arquivos, por exemplo: ${faltando.slice(0, 5).join(', ')}`)
  process.exit(1)
}
for (const pasta of ['still', 'clip']) cpSync(new URL(`${pasta}/`, origem), new URL(`${pasta}/`, destino), { recursive: true })
console.log(`Mídia de ${exercicios.length} exercícios copiada para dist/exercise-media/`)
