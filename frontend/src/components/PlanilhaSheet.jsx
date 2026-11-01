// Configuração do histórico na planilha "treino" do Google Drive (lib/planilha.js).
import { useState } from 'react'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { t } from '../lib/i18n.js'
import { lerConfig, gravarConfig, configurada, enviar } from '../lib/planilha.js'
import { Button } from './ui.jsx'

export function PlanilhaSheet({ close }) {
  const toast = useUI(s => s.toast)
  const [c, setC] = useState(lerConfig)
  const [busy, setBusy] = useState(false)
  const campo = (k, rotulo, extra = {}) => <label style={{ display: 'block', marginBottom: 10 }}>
    <div className="small dim" style={{ marginBottom: 4 }}>{rotulo}</div>
    <input className="timef" style={{ width: '100%' }} value={c[k]} onChange={e => setC({ ...c, [k]: e.target.value })}
      autoCapitalize="off" autoCorrect="off" spellCheck={false} {...extra} />
  </label>
  const salvar = async () => {
    gravarConfig(c)
    if (!configurada(c)) { toast?.(t('Turned off')); close(); return }
    setBusy(true)
    try { await enviar(useStore.getState().S, c); toast?.(t('History sent to the spreadsheet')); close() }
    catch { toast?.(t('Could not send to the spreadsheet')) }
    setBusy(false)
  }
  return <>
    <h3>{t('Google Sheets spreadsheet')}</h3>
    <div className="muted small" style={{ marginBottom: 12 }}>
      {t('Sends your workout history to the "treino" spreadsheet, on your own tab. Sent again automatically after every workout.')}
    </div>
    {campo('url', t('Script address'), { inputMode: 'url', placeholder: 'https://script.google.com/macros/s/…/exec' })}
    {campo('token', t('Secret code'), { type: 'password' })}
    {campo('aba', t('Tab (person name)'), { placeholder: 'Fernando' })}
    <Button variant="primary" disabled={busy} onClick={salvar}>{t('Save and send now')}</Button>
    <div className="small dim" style={{ margin: '8px 2px 0' }}>{t('Leave the address empty to turn it off.')}</div>
  </>
}

export const planilhaSheet = () => useUI.getState().openSheet(close => <PlanilhaSheet close={close} />)
