// Servidor gratuito do FC Gym: confere o login com o Google e grava o histórico na aba da pessoa, na planilha "treino".
// Fica em Propriedades do script (Configurações do projeto), nunca no código:
//   EMAILS  = {"email@gmail.com":"Fernando", ...}   quem pode entrar e em qual aba grava
//   SEGREDO = texto longo e aleatório               assina as sessões
const CLIENT_ID = '960486071855-ruug8v3pt6llpjck6j39637ukpb681ei.apps.googleusercontent.com'
const PLANILHA_ID = '1f3vptgihjQTnszaY9f9dnwAYI96EhX9fa41BPsYN7Yg'
const DIAS = 30

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents)
    return resposta(d.idToken ? entrar(d.idToken) : gravar(d))
  } catch (err) {
    return resposta({ ok: false, erro: String(err) })
  }
}

const prop = k => PropertiesService.getScriptProperties().getProperty(k)
const lista = () => JSON.parse(prop('EMAILS') || '{}')

// O comprovante do Google (idToken) vale só se for do nosso app, com e-mail confirmado e na lista da família.
function entrar(idToken) {
  const r = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken), { muteHttpExceptions: true })
  if (r.getResponseCode() !== 200) return { ok: false, erro: 'login inválido' }
  const t = JSON.parse(r.getContentText())
  if (t.aud !== CLIENT_ID || String(t.email_verified) !== 'true') return { ok: false, erro: 'login inválido' }
  const email = String(t.email).toLowerCase()
  const aba = lista()[email]
  if (!aba) return { ok: false, erro: 'e-mail não autorizado' }
  const exp = Date.now() + DIAS * 86400000
  return { ok: true, sessao: assinar(email + '|' + aba + '|' + exp), aba: aba, email: email, exp: exp }
}

function assinar(msg) {
  const sig = Utilities.computeHmacSha256Signature(msg, prop('SEGREDO'))
  return Utilities.base64EncodeWebSafe(msg) + '.' + Utilities.base64EncodeWebSafe(sig)
}

// A sessão vale se a assinatura bate, não venceu e o e-mail ainda está na lista (tirar da lista derruba o acesso).
function verificar(sessao) {
  const m = String(sessao || '').split('.')[0]
  if (!m) return null
  const msg = Utilities.newBlob(Utilities.base64DecodeWebSafe(m)).getDataAsString()
  if (assinar(msg) !== sessao) return null
  const p = msg.split('|')
  if (Date.now() > Number(p[2]) || lista()[p[0]] !== p[1]) return null
  return { email: p[0], aba: p[1] }
}

function gravar(d) {
  const s = verificar(d.sessao)
  if (!s) return { ok: false, erro: 'sessão inválida' }
  const linhas = d.linhas
  if (!Array.isArray(linhas) || !linhas.length) return { ok: false, erro: 'sem dados' }
  const aba = SpreadsheetApp.openById(PLANILHA_ID).getSheetByName(s.aba)
  if (!aba) return { ok: false, erro: 'aba não existe' }
  const largura = linhas[0].length
  aba.clearContents()
  aba.getRange(1, 1, linhas.length, largura).setNumberFormat('@').setValues(linhas)
  aba.getRange(1, 1, 1, largura).setFontWeight('bold')
  aba.setFrozenRows(1)
  return { ok: true, linhas: linhas.length - 1 }
}

// Rode uma vez no editor (Executar) depois de colar o código: o Google pede a autorização para falar com a internet.
function autorizar() {
  UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo', { muteHttpExceptions: true })
}

function resposta(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON)
}
