// Histórico na planilha "treino" do Google Drive (lib/planilha.js): a aba vem do e-mail do login com o Google.
import { useState } from 'react'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { t } from '../lib/i18n.js'
import { lerSessao } from '../lib/acesso.js'
import { enviar } from '../lib/planilha.js'
import { Button } from './ui.jsx'

export function PlanilhaSheet({ close }) {
  const toast = useUI(s => s.toast)
  const [busy, setBusy] = useState(false)
  const sessao = lerSessao()
  const agora = async () => {
    setBusy(true)
    try { await enviar(useStore.getState().S, sessao); toast?.(t('History sent to the spreadsheet')); close() }
    catch { toast?.(t('Could not send to the spreadsheet')) }
    setBusy(false)
  }
  return <>
    <h3>{t('Google Sheets spreadsheet')}</h3>
    <div className="muted small" style={{ marginBottom: 12 }}>
      {t('Sends your workout history to the "treino" spreadsheet, on your own tab. Sent again automatically after every workout.')}
    </div>
    {sessao && <div className="small" style={{ marginBottom: 14 }}>
      <div className="small dim">{t('Tab (person name)')}</div>
      <div>{sessao.aba} · {sessao.email}</div>
    </div>}
    <Button variant="primary" disabled={busy || !sessao} onClick={agora}>{t('Send now')}</Button>
  </>
}

export const planilhaSheet = () => useUI.getState().openSheet(close => <PlanilhaSheet close={close} />)
