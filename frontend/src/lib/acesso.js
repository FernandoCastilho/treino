// Entrada com o Google, sem servidor próprio.
//
// O botão do Google devolve um comprovante (idToken) do e-mail. Ele vai ao Apps Script (apps-script/Codigo.gs),
// que confere com o Google, vê se o e-mail está na lista da família e devolve uma "sessão" assinada, válida
// por 30 dias, já com o nome da aba da pessoa na planilha. É a sessão que libera o app e o envio do histórico.
// Os dois valores abaixo são públicos (o ID do cliente aparece em qualquer site com login Google).
export const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
  || '960486071855-ruug8v3pt6llpjck6j39637ukpb681ei.apps.googleusercontent.com'
export const SCRIPT_URL = import.meta.env.VITE_SCRIPT_URL
  || 'https://script.google.com/macros/s/AKfycbwHl1hNxHIzOJpJf5tv2LHlxJ2WJH-l91-bJkiOzI1VzeL3kIuZVAejtxa1zgbwpLMT/exec'

const KEY = 'fc_sessao'

export function lerSessao() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null')
    return s && s.sessao && s.aba && s.exp > Date.now() ? s : null
  } catch { return null }
}
export function gravarSessao(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* sem armazenamento: pede o login de novo */ }
}
export function sair() {
  try { localStorage.removeItem(KEY); localStorage.removeItem('gym_guest') } catch { /* nada a limpar */ }
}

const MENSAGENS = {
  'e-mail não autorizado': 'Este e-mail do Google não está na lista da família.',
  'login inválido': 'O Google não confirmou o login. Tente de novo.',
}

/** Troca o comprovante do Google pela sessão do app. Erros viram mensagens para a tela de entrada. */
export async function entrar(idToken, url = SCRIPT_URL) {
  let r = null
  try {
    const res = await fetch(url, {
      method: 'POST',
      // text/plain evita a pré-checagem CORS, que o Apps Script não responde.
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ idToken }),
    })
    r = await res.json()
  } catch { throw new Error('Sem conexão com o servidor da família. Tente de novo.') }
  if (!r || !r.ok) throw new Error(MENSAGENS[r?.erro] || 'Não foi possível entrar. Tente de novo.')
  const s = { sessao: r.sessao, aba: r.aba, email: r.email, exp: r.exp }
  gravarSessao(s)
  // Quem entrou pelo Google já tem o app liberado: pula a tela de contas do servidor, que não existe aqui.
  try { localStorage.setItem('gym_guest', '1') } catch { /* o app mostra a tela de contas */ }
  return s
}
