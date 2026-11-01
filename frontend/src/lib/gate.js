// Tela de entrada do FC Gym: "Entrar com o Google", só para os e-mails da família (lib/acesso.js).
// Barreira da tela, não segurança forte: o site é público e o código é aberto. O que protege a planilha é
// o Apps Script, que só aceita sessões assinadas por ele.
import { CLIENT_ID, entrar, lerSessao } from './acesso.js'

function carregarGoogle() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve()
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('gsi'))
    document.head.append(s)
  })
}

function tela() {
  return new Promise((resolve) => {
    const raiz = document.createElement('div')
    raiz.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#060d1f;color:#fff;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;padding:24px'
    const caixa = document.createElement('div')
    caixa.style.cssText = 'width:100%;max-width:320px;display:flex;flex-direction:column;gap:14px;text-align:center;align-items:center'
    const titulo = document.createElement('h1')
    titulo.textContent = 'FC Gym'
    titulo.style.cssText = 'margin:0;font-size:28px;color:#ffd60a'
    const sub = document.createElement('p')
    sub.textContent = 'Seus treinos. Seus pesos.'
    sub.style.cssText = 'margin:0 0 6px;font-size:14px;color:#8a93ab'
    const botao = document.createElement('div')
    const aviso = document.createElement('p')
    aviso.style.cssText = 'margin:0;min-height:20px;font-size:14px;color:#aaa'
    caixa.append(titulo, sub, botao, aviso)
    raiz.append(caixa)
    document.body.append(raiz)

    carregarGoogle().then(() => {
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: async ({ credential }) => {
          aviso.style.color = '#aaa'
          aviso.textContent = 'Conferindo…'
          try {
            await entrar(credential)
            raiz.remove()
            resolve()
          } catch (e) {
            aviso.style.color = '#ff8a80'
            aviso.textContent = e.message
          }
        },
      })
      window.google.accounts.id.renderButton(botao, { theme: 'filled_blue', size: 'large', text: 'signin_with', locale: 'pt-BR', width: 280 })
    }).catch(() => { aviso.textContent = 'Não consegui carregar o login do Google. Verifique a internet e recarregue.' })
  })
}

// Resolve quando o acesso está liberado (sessão guardada e ainda válida, ou login feito agora).
export async function passarPeloLogin() {
  if (lerSessao()) return
  const boot = document.getElementById('boot')
  if (boot) boot.remove()
  await tela()
}
