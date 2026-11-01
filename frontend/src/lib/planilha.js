// Histórico na planilha "treino" do Google Drive: uma aba por pessoa.
//
// O app não grava no Google direto. Ele envia o histórico ao Apps Script (apps-script/Codigo.gs), que confere a
// sessão do login com o Google (lib/acesso.js) e grava na aba da pessoa, escolhida pelo e-mail dela.
import { WORKOUT_COLUMNS, workoutRows } from './export-csv.js'
import { SCRIPT_URL, lerSessao } from './acesso.js'

/** O que vai para a aba: cabeçalho + uma linha por série concluída, do mais antigo ao mais novo. */
export const montarLinhas = S => [WORKOUT_COLUMNS, ...workoutRows(S)]

/** Substitui o conteúdo da aba da pessoa pelo histórico atual (reenviar nunca duplica). */
export async function enviar(S, sessao = lerSessao(), url = SCRIPT_URL) {
  if (!sessao) throw new Error('config')
  const res = await fetch(url, {
    method: 'POST',
    // text/plain evita a pré-checagem CORS, que o Apps Script não responde.
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ sessao: sessao.sessao, linhas: montarLinhas(S) }),
  })
  const r = await res.json().catch(() => null)
  if (!r || !r.ok) throw new Error(r?.erro || 'falha')
  return r.linhas
}

let tm = null
/** Reenvia sozinho, alguns segundos depois de o histórico mudar (fim de treino, edição). */
export function iniciarEnvioAutomatico(store, aviso) {
  let anterior = store.getState().S.workouts
  return store.subscribe(st => {
    const w = st.S.workouts
    if (w === anterior) return
    anterior = w
    if (!lerSessao()) return
    clearTimeout(tm)
    tm = setTimeout(() => { enviar(store.getState().S).catch(() => aviso?.()) }, 5000)
  })
}
