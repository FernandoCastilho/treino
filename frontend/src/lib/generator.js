// Gerador de treino do FC Gym. Sem IA: escolhe exercícios de listas curadas por grupo muscular e por
// local de treino, aplica séries e repetições conforme o objetivo e o nível, e devolve rotinas no mesmo
// formato dos planos prontos (lib/starter.js). Idéia de fluxo inspirada em geradores de treino em
// geral; as listas e as regras são próprias.
import { uid } from './format.js'
import { EXIDX, isHold } from './exercises.js'

export const LOCAIS = ['casa', 'halteres', 'academia']
export const OBJETIVOS = ['gordura', 'forca', 'musculo']
export const NIVEIS = ['iniciante', 'intermediario', 'avancado']
export const FOCOS = ['corpo', 'superior', 'inferior', 'empurrar', 'puxar', 'pernas', 'abdomen', 'bracos', 'ombros']
export const TEMPOS = [30, 45, 60]

// Cada item: [id do exercício, nível mínimo (0 iniciante, 1 intermediário, 2 avançado)].
// A ordem é de prioridade: os mais completos primeiro.
export const POOLS = {
  peito: {
    casa: [['0662', 0], ['0493', 0], ['3211', 0], ['0279', 1]],
    halteres: [['0289', 0], ['0314', 0], ['0308', 1], ['0662', 0]],
    academia: [['0025', 0], ['0576', 0], ['0047', 1], ['0289', 0], ['0227', 1]]
  },
  costas: {
    casa: [['0499', 0], ['3436', 0], ['1326', 2], ['0652', 2]],
    halteres: [['0293', 0], ['0499', 0], ['3436', 0]],
    academia: [['2330', 0], ['1323', 0], ['0861', 0], ['0027', 1], ['0017', 0], ['0652', 2]]
  },
  ombros: {
    casa: [['2921', 0], ['3905', 0]],
    halteres: [['0405', 0], ['0334', 0], ['0377', 1]],
    academia: [['0603', 0], ['0426', 0], ['0334', 0], ['0203', 1]]
  },
  biceps: {
    casa: [['1326', 2]],
    halteres: [['0294', 0], ['0313', 0], ['0285', 0], ['0297', 1]],
    academia: [['0031', 0], ['0313', 0], ['0868', 0], ['0294', 0]]
  },
  triceps: {
    casa: [['0814', 0], ['0283', 1]],
    halteres: [['0430', 0], ['0351', 1], ['0333', 0]],
    academia: [['0241', 0], ['0201', 0], ['0251', 1], ['0430', 0]]
  },
  quads: {
    casa: [['1197', 0], ['0612', 0], ['0781', 0], ['0514', 1], ['7557', 0]],
    halteres: [['1760', 0], ['0336', 0], ['0431', 0], ['2290', 1]],
    academia: [['0043', 1], ['0739', 0], ['0585', 0], ['1760', 0], ['0336', 0], ['5516', 1]]
  },
  post: {
    casa: [['2471', 0]],
    halteres: [['1459', 0], ['3335', 0], ['0432', 1]],
    academia: [['0085', 1], ['1060', 0], ['0586', 0], ['0599', 0], ['0032', 2]]
  },
  pant: {
    casa: [['3018', 0]],
    halteres: [['0417', 0]],
    academia: [['0605', 0], ['0594', 0]]
  },
  abd: {
    casa: [['0463', 0], ['6211', 0], ['0276', 0], ['0715', 0], ['0687', 1], ['0459', 1], ['1163', 1], ['0630', 0]],
    halteres: [['0463', 0], ['6211', 0], ['0276', 0], ['0715', 0], ['0687', 1]],
    academia: [['0463', 0], ['0175', 0], ['6211', 0], ['0715', 0], ['0472', 2]]
  },
  cardio: {
    casa: [['1160', 1], ['3094', 0], ['0630', 0]],
    halteres: [['3094', 0], ['1160', 1]],
    academia: [['3094', 0], ['1160', 1]]
  }
}

// Que grupos entram em cada foco, em ordem de prioridade.
const FOCO_GRUPOS = {
  corpo: ['quads', 'peito', 'costas', 'post', 'ombros', 'abd', 'triceps', 'biceps', 'pant'],
  superior: ['peito', 'costas', 'ombros', 'biceps', 'triceps'],
  inferior: ['quads', 'post', 'pant', 'abd'],
  empurrar: ['peito', 'ombros', 'triceps'],
  puxar: ['costas', 'biceps', 'ombros'],
  pernas: ['quads', 'post', 'pant'],
  abdomen: ['abd'],
  bracos: ['biceps', 'triceps'],
  ombros: ['ombros']
}

const EMOJI = { corpo: 'figureStrength', superior: 'barbell', inferior: 'legs', empurrar: 'barbell', puxar: 'pullup', pernas: 'legs', abdomen: 'figureStrength', bracos: 'barbell', ombros: 'barbell' }

// Gerador de números aleatórios com semente: o mesmo pedido dá o mesmo treino, e "gerar de novo"
// só muda a semente.
const rng = seed => {
  let a = (seed >>> 0) || 1
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const nivelIdx = n => Math.max(0, NIVEIS.indexOf(n))

// Exercícios disponíveis para um grupo, no local e nível pedidos. Quem treina com halteres também
// usa o peso do corpo; quem vai à academia usa tudo.
const candidatos = (grupo, local, nivel) => {
  const p = POOLS[grupo]
  const lista = local === 'academia' ? [...p.academia, ...p.halteres, ...p.casa]
    : local === 'halteres' ? [...p.halteres, ...p.casa]
      : p.casa
  const visto = new Set()
  return lista.filter(([id, min]) => {
    if (visto.has(id) || min > nivelIdx(nivel) || !EXIDX[id]) return false
    visto.add(id)
    return true
  }).map(([id]) => id)
}

// Quantos exercícios cabem no tempo (cerca de 8 a 9 minutos cada, com aquecimento e descanso).
export const quantosExercicios = tempo => (tempo <= 30 ? 4 : tempo <= 45 ? 6 : 8)

// Séries e repetições: depende do objetivo, do nível e se o exercício é um exercício isométrico
// (prancha etc., onde "repetições" são segundos).
export const prescricao = (id, { objetivo, nivel, local }) => {
  const n = nivelIdx(nivel)
  const peso = EXIDX[id]?.eq !== 'body weight'
  if (isHold(id)) return { sets: 3, reps: [20, 30, 45][n] }
  const sets = objetivo === 'forca' ? [3, 4, 5][n] : objetivo === 'musculo' ? [3, 3, 4][n] : 3
  let reps = objetivo === 'forca' ? 5 : objetivo === 'musculo' ? 10 : 15
  // Peso do corpo não tem carga para subir: as repetições carregam a dificuldade.
  if (!peso || local === 'casa') reps = objetivo === 'forca' ? [6, 8, 10][n] : objetivo === 'musculo' ? [10, 12, 15][n] : [12, 15, 20][n]
  return { sets, reps }
}

// Escolhe `quantos` exercícios de um foco, percorrendo os grupos em rodízio (um de cada grupo antes
// de repetir um grupo), sem repetir exercício.
function escolher({ grupos, quantos, local, nivel, rand, evitar = new Set() }) {
  const filas = grupos.map(g => {
    const c = candidatos(g, local, nivel).filter(id => !evitar.has(id))
    // pequena variação: embaralha só as primeiras opções
    const topo = c.slice(0, 3).map(id => [rand(), id]).sort((a, b) => a[0] - b[0]).map(x => x[1])
    return [...topo, ...c.slice(3)]
  })
  const saida = []
  const usados = new Set()
  let vazio = 0
  for (let i = 0; saida.length < quantos && vazio < filas.length; i++) {
    const f = filas[i % filas.length]
    let id
    while (f.length && !id) { const x = f.shift(); if (!usados.has(x)) id = x }
    if (id) { usados.add(id); saida.push(id); vazio = 0 } else vazio++
  }
  return saida
}

const montar = (ids, opts) => ids.map(id => ({ id, ...prescricao(id, opts), weight: 0 }))

/** Um treino. `semente` muda as variações ("gerar de novo"). Devolve uma rotina pronta para o app. */
export function gerarTreino({ foco = 'corpo', objetivo = 'musculo', nivel = 'iniciante', local = 'casa', tempo = 45, semente = 1 } = {}) {
  const grupos = FOCO_GRUPOS[foco] || FOCO_GRUPOS.corpo
  const rand = rng(semente * 9973 + 17)
  let ids = escolher({ grupos, quantos: quantosExercicios(tempo), local, nivel, rand })
  // Perder gordura: troca o último exercício por um de cardio, quando houver espaço.
  if (objetivo === 'gordura' && ids.length >= 4) {
    const cardio = candidatos('cardio', local, nivel).find(id => !ids.includes(id))
    if (cardio) ids = [...ids.slice(0, -1), cardio]
  }
  return { id: uid(), name: nomeDoTreino(foco), emoji: EMOJI[foco] || 'figureStrength', ex: montar(ids, { objetivo, nivel, local }) }
}

export const nomeDoTreino = foco => ({
  corpo: 'Treino gerado · Corpo inteiro', superior: 'Treino gerado · Parte superior', inferior: 'Treino gerado · Parte inferior',
  empurrar: 'Treino gerado · Empurrar', puxar: 'Treino gerado · Puxar', pernas: 'Treino gerado · Pernas',
  abdomen: 'Treino gerado · Abdômen', bracos: 'Treino gerado · Braços', ombros: 'Treino gerado · Ombros'
}[foco] || 'Treino gerado')

// Dias da semana (0 domingo … 6 sábado) para cada quantidade de dias.
export const DIAS = { 2: [1, 4], 3: [1, 3, 5], 4: [1, 2, 4, 5], 5: [1, 2, 3, 5, 6], 6: [1, 2, 3, 4, 5, 6] }

// Divisão por quantidade de dias: [foco, rótulo].
const DIVISAO = {
  2: [['corpo', 'Corpo inteiro A'], ['corpo', 'Corpo inteiro B']],
  3: [['corpo', 'Corpo inteiro A'], ['corpo', 'Corpo inteiro B'], ['corpo', 'Corpo inteiro C']],
  4: [['superior', 'Superior A'], ['inferior', 'Inferior A'], ['superior', 'Superior B'], ['inferior', 'Inferior B']],
  5: [['empurrar', 'Empurrar'], ['puxar', 'Puxar'], ['pernas', 'Pernas'], ['superior', 'Superior'], ['inferior', 'Inferior']],
  6: [['empurrar', 'Empurrar A'], ['puxar', 'Puxar A'], ['pernas', 'Pernas A'], ['empurrar', 'Empurrar B'], ['puxar', 'Puxar B'], ['pernas', 'Pernas B']]
}

/** Um plano da semana. Devolve { routines, schedule } como buildStarterPlan: schedule = [{ day, routineId }]. */
export function gerarPlanoSemanal({ dias = 3, objetivo = 'musculo', nivel = 'iniciante', local = 'casa', tempo = 45, semente = 1 } = {}) {
  const n = DIVISAO[dias] ? dias : 3
  const routines = []
  const jaUsados = {}
  DIVISAO[n].forEach(([foco, rotulo], i) => {
    const grupos = FOCO_GRUPOS[foco]
    const rand = rng(semente * 7919 + i * 131 + 3)
    // Evita repetir os mesmos exercícios em dias do mesmo foco.
    const evitar = jaUsados[foco] || new Set()
    let ids = escolher({ grupos, quantos: quantosExercicios(tempo), local, nivel, rand, evitar })
    if (ids.length < 3) ids = escolher({ grupos, quantos: quantosExercicios(tempo), local, nivel, rand })
    ids.forEach(id => evitar.add(id))
    jaUsados[foco] = evitar
    if (objetivo === 'gordura' && ids.length >= 4 && i % 2 === 1) {
      const cardio = candidatos('cardio', local, nivel).find(id => !ids.includes(id))
      if (cardio) ids = [...ids.slice(0, -1), cardio]
    }
    routines.push({ id: uid(), name: `Plano gerado · ${rotulo}`, emoji: EMOJI[foco] || 'figureStrength', ex: montar(ids, { objetivo, nivel, local }) })
  })
  return { routines, schedule: DIAS[n].map((day, i) => ({ day, routineId: routines[i].id })) }
}

// Resumo para mostrar antes de salvar: total de séries e minutos estimados (cerca de 2 minutos por série
// com o descanso de 60 s, e meio minuto de troca entre exercícios).
export const resumo = rotina => {
  const series = rotina.ex.reduce((s, e) => s + e.sets, 0)
  return { exercicios: rotina.ex.length, series, minutos: Math.round(series * 2 + rotina.ex.length * 0.5) }
}
