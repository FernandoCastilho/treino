// Histórico na planilha "treino" do Google Drive: uma aba por pessoa.
//
// O app não fala com o Google direto (isso exigiria login Google dentro do app). Ele envia o histórico
// para um Apps Script publicado como aplicativo da web, que grava na aba da pessoa (docs/PLANILHA-DRIVE.md).
// O endereço do script, o código secreto e o nome da aba ficam só neste aparelho (localStorage): o
// repositório é público e não pode carregar segredo, e o código não entra nos backups.
import { WORKOUT_COLUMNS, workoutRows } from './export-csv.js'

const K = { url: 'fc_planilha_url', token: 'fc_planilha_token', aba: 'fc_planilha_aba' }
const ler = k => { try { return localStorage.getItem(k) || '' } catch { return '' } }
const gravar = (k, v) => { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k) } catch { /* sem armazenamento */ } }

export const lerConfig = () => ({ url: ler(K.url), token: ler(K.token), aba: ler(K.aba) })
export function gravarConfig({ url = '', token = '', aba = '' }) {
  gravar(K.url, url.trim()); gravar(K.token, token.trim()); gravar(K.aba, aba.trim())
}
export const configurada = c => !!(c.url && c.token && c.aba && /^https:\/\/script\.google\.com\//.test(c.url))

/** O que vai para a aba: cabeçalho + uma linha por série concluída, do mais antigo ao mais novo. */
export const montarLinhas = S => [WORKOUT_COLUMNS, ...workoutRows(S)]

/** Substitui o conteúdo da aba da pessoa pelo histórico atual (reenviar nunca duplica). */
export async function enviar(S, config = lerConfig()) {
  if (!configurada(config)) throw new Error('config')
  const res = await fetch(config.url, {
    method: 'POST',
    // text/plain evita a pré-checagem CORS, que o Apps Script não responde.
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ token: config.token, aba: config.aba, linhas: montarLinhas(S) }),
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
    if (!configurada(lerConfig())) return
    clearTimeout(tm)
    tm = setTimeout(() => { enviar(store.getState().S).catch(() => aviso?.()) }, 5000)
  })
}
