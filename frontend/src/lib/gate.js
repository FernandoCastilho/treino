// Tela de senha do Treino. Barreira simples, não segurança forte: o site é público e o código é aberto.
// O hash (PBKDF2-SHA256) vem do build em VITE_SENHA_HASH, no formato "iteracoes:salt:hash" em hex.
// Sem hash configurado, o app fica fechado.
const KEY = 'treino_acesso'

const hex = (buf) => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('')
const bytes = (h) => new Uint8Array(h.match(/../g).map(x => parseInt(x, 16)))

export async function derivar(senha, saltHex, iteracoes) {
  const chave = await crypto.subtle.importKey('raw', new TextEncoder().encode(senha), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: bytes(saltHex), iterations: iteracoes }, chave, 256)
  return hex(bits)
}

export async function confere(senha, config) {
  const [it, salt, hash] = String(config || '').split(':')
  const iteracoes = Number(it)
  if (!iteracoes || !salt || !hash) return false
  return (await derivar(senha, salt, iteracoes)) === hash
}

const lembrado = (config) => {
  try { return localStorage.getItem(KEY) === config } catch { return false }
}
const lembrar = (config) => {
  try { localStorage.setItem(KEY, config) } catch { /* sem armazenamento: pede de novo na próxima */ }
}

function tela(config) {
  return new Promise((resolve) => {
    const raiz = document.createElement('div')
    raiz.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#060d1f;color:#fff;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;padding:24px'
    const caixa = document.createElement('form')
    caixa.style.cssText = 'width:100%;max-width:320px;display:flex;flex-direction:column;gap:12px;text-align:center'
    const titulo = document.createElement('h1')
    titulo.textContent = 'FC Gym'
    titulo.style.cssText = 'margin:0 0 4px;font-size:28px;color:#ffd60a'
    const aviso = document.createElement('p')
    aviso.style.cssText = 'margin:0;min-height:20px;font-size:14px;color:#aaa'
    caixa.append(titulo, aviso)

    if (!config) {
      aviso.textContent = 'Acesso ainda não configurado.'
      raiz.append(caixa)
      document.body.append(raiz)
      return
    }

    aviso.textContent = 'Digite a senha para entrar.'
    const campo = document.createElement('input')
    campo.type = 'password'
    campo.autocomplete = 'current-password'
    campo.setAttribute('aria-label', 'Senha')
    campo.style.cssText = 'font-size:16px;padding:12px;border-radius:10px;border:1px solid #333;background:#101d3d;color:#fff'
    const botao = document.createElement('button')
    botao.type = 'submit'
    botao.textContent = 'Entrar'
    botao.style.cssText = 'font-size:16px;padding:12px;border-radius:10px;border:0;background:#ffd60a;color:#000;font-weight:600'
    caixa.append(campo, botao)
    caixa.addEventListener('submit', async (e) => {
      e.preventDefault()
      botao.disabled = true
      aviso.textContent = 'Conferindo…'
      let ok = false
      try { ok = await confere(campo.value, config) } catch { ok = false }
      if (ok) {
        lembrar(config)
        raiz.remove()
        resolve()
      } else {
        aviso.textContent = 'Senha incorreta.'
        campo.value = ''
        botao.disabled = false
        campo.focus()
      }
    })
    raiz.append(caixa)
    document.body.append(raiz)
    campo.focus()
  })
}

// Resolve quando o acesso está liberado. Sem hash configurado, nunca resolve.
export async function passarPelaSenha(config = import.meta.env.VITE_SENHA_HASH) {
  if (config && lembrado(config)) return
  const boot = document.getElementById('boot')
  if (boot) boot.remove()
  await tela(config)
}
