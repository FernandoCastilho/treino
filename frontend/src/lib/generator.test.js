import { describe, expect, it } from 'vitest'
import { EXIDX } from './exercises.js'
import { DIAS, FOCOS, analiseHistorico, LOCAIS, NIVEIS, OBJETIVOS, POOLS, TEMPOS, gerarPlanoSemanal, gerarTreino, prescricao, quantosExercicios, resumo } from './generator.js'

describe('listas do gerador', () => {
  it('todo exercício existe no app', () => {
    for (const [grupo, locais] of Object.entries(POOLS)) {
      for (const [local, lista] of Object.entries(locais)) {
        for (const [id] of lista) expect(EXIDX[id], `${grupo}/${local}: ${id}`).toBeTruthy()
      }
    }
  })

  it('"em casa" só usa o peso do corpo', () => {
    for (const [grupo, locais] of Object.entries(POOLS)) {
      for (const [id] of locais.casa) expect(EXIDX[id].eq, `${grupo}: ${EXIDX[id].n}`).toBe('body weight')
    }
  })
})

describe('gerarTreino', () => {
  it('é determinístico e a semente muda as variações', () => {
    const a = gerarTreino({ foco: 'corpo', local: 'academia', semente: 1 })
    const b = gerarTreino({ foco: 'corpo', local: 'academia', semente: 1 })
    expect(a.ex).toEqual(b.ex)
    const outras = [2, 3, 4, 5, 6].map(s => gerarTreino({ foco: 'corpo', local: 'academia', semente: s }).ex.map(e => e.id).join())
    expect(new Set([a.ex.map(e => e.id).join(), ...outras]).size).toBeGreaterThan(1)
  })

  it('respeita o tempo, sem repetir exercício, em todas as combinações', () => {
    for (const local of LOCAIS) for (const foco of FOCOS) for (const tempo of TEMPOS) for (const nivel of NIVEIS) for (const objetivo of OBJETIVOS) {
      const t = gerarTreino({ foco, local, tempo, nivel, objetivo, semente: 3 })
      const ids = t.ex.map(e => e.id)
      expect(new Set(ids).size, `${local}/${foco}/${tempo}/${nivel}`).toBe(ids.length)
      expect(ids.length, `${local}/${foco}/${tempo}/${nivel}: vazio`).toBeGreaterThan(0)
      expect(ids.length).toBeLessThanOrEqual(quantosExercicios(tempo))
      for (const e of t.ex) { expect(EXIDX[e.id]).toBeTruthy(); expect(e.sets).toBeGreaterThan(0); expect(e.reps).toBeGreaterThan(0) }
    }
  })

  it('treino de corpo inteiro em casa cobre vários grupos e não pede equipamento', () => {
    const t = gerarTreino({ foco: 'corpo', local: 'casa', tempo: 60 })
    expect(t.ex.length).toBe(8)
    for (const e of t.ex) expect(EXIDX[e.id].eq).toBe('body weight')
    expect(new Set(t.ex.map(e => EXIDX[e.id].tg)).size).toBeGreaterThan(3)
  })

  it('nível iniciante não recebe exercícios avançados', () => {
    const avancados = new Set(Object.values(POOLS).flatMap(l => Object.values(l).flat()).filter(([, min]) => min === 2).map(([id]) => id))
    for (let s = 1; s <= 20; s++) {
      for (const local of LOCAIS) for (const foco of FOCOS) {
        const ids = gerarTreino({ foco, local, nivel: 'iniciante', semente: s }).ex.map(e => e.id)
        for (const id of ids) expect(avancados.has(id), `${local}/${foco}: ${id}`).toBe(false)
      }
    }
  })

  it('perder gordura inclui cardio', () => {
    const t = gerarTreino({ objetivo: 'gordura', local: 'casa', foco: 'corpo', tempo: 45 })
    expect(t.ex.some(e => ['1160', '3094', '0630'].includes(e.id))).toBe(true)
  })
})

describe('prescrição', () => {
  it('isométricos usam segundos e força usa poucas repetições', () => {
    expect(prescricao('0463', { objetivo: 'musculo', nivel: 'iniciante', local: 'casa' })).toEqual({ sets: 3, reps: 20 })
    expect(prescricao('0025', { objetivo: 'forca', nivel: 'intermediario', local: 'academia' })).toEqual({ sets: 4, reps: 5 })
    expect(prescricao('0025', { objetivo: 'gordura', nivel: 'iniciante', local: 'academia' }).reps).toBe(15)
  })
})

describe('gerarPlanoSemanal', () => {
  it('cria uma rotina por dia e marca os dias certos', () => {
    for (const dias of [2, 3, 4, 5, 6]) {
      const p = gerarPlanoSemanal({ dias, local: 'academia', semente: 2 })
      expect(p.routines).toHaveLength(dias)
      expect(p.schedule.map(s => s.day)).toEqual(DIAS[dias])
      for (const s of p.schedule) expect(p.routines.some(r => r.id === s.routineId)).toBe(true)
      for (const r of p.routines) expect(r.ex.length).toBeGreaterThan(2)
    }
  })

  it('em casa nunca pede equipamento', () => {
    for (const dias of [2, 3, 4, 5, 6]) {
      const p = gerarPlanoSemanal({ dias, local: 'casa', semente: 1 })
      for (const r of p.routines) for (const e of r.ex) expect(EXIDX[e.id].eq).toBe('body weight')
    }
  })

  it('dias do mesmo foco não repetem exercícios quando há opções', () => {
    const p = gerarPlanoSemanal({ dias: 4, local: 'academia', semente: 4 })
    const [supA, , supB] = p.routines
    const comuns = supA.ex.filter(a => supB.ex.some(b => b.id === a.id))
    expect(comuns.length).toBeLessThan(supA.ex.length)
  })
})

describe('resumo', () => {
  it('conta exercícios, séries e minutos', () => {
    expect(resumo({ ex: [{ sets: 3 }, { sets: 4 }] })).toEqual({ exercicios: 2, series: 7, minutos: 15 })
  })
})

describe('histórico de treino', () => {
  const peitoPesado = { chest: 40, deltoids: 12, triceps: 10 }
  it('sem histórico, o foco automático vira corpo inteiro', () => {
    const a = gerarTreino({ foco: 'auto', local: 'academia', historico: null, semente: 2 })
    const b = gerarTreino({ foco: 'corpo', local: 'academia', semente: 2 })
    expect(a.ex.map(e => e.id)).toEqual(b.ex.map(e => e.id))
  })

  it('analisa o que falta e o que está em excesso', () => {
    const an = analiseHistorico(peitoPesado)
    expect(an.temHistorico).toBe(true)
    expect(an.mais[0]).toBe('peito')
    expect(an.menos).not.toContain('peito')
    expect(analiseHistorico({}).temHistorico).toBe(false)
  })

  it('automático poupa o que está em excesso e prioriza o que falta', () => {
    const t = gerarTreino({ foco: 'auto', local: 'academia', tempo: 45, historico: peitoPesado, semente: 1 })
    const alvos = t.ex.map(e => EXIDX[e.id].tg)
    expect(alvos).not.toContain('pectorals')
    // pernas e costas nunca foram treinadas: aparecem
    expect(t.ex.some(e => ['quads', 'glutes', 'hamstrings'].includes(EXIDX[e.id].tg))).toBe(true)
    expect(t.name).toBe('Treino gerado · O que falta')
  })

  it('dentro de um foco, começa pelo que está menos treinado', () => {
    const t = gerarTreino({ foco: 'superior', local: 'academia', historico: { chest: 50, deltoids: 30, biceps: 20, triceps: 20, 'upper-back': 1 }, semente: 1 })
    expect(['lats', 'upper back', 'spine']).toContain(EXIDX[t.ex[0].id].tg)
  })

  it('o plano da semana também usa o histórico sem quebrar', () => {
    const p = gerarPlanoSemanal({ dias: 4, local: 'academia', historico: peitoPesado, semente: 2 })
    expect(p.routines).toHaveLength(4)
    for (const r of p.routines) expect(r.ex.length).toBeGreaterThan(2)
  })
})
