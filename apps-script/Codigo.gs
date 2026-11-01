// Recebe o histórico do FC Gym e grava na aba da pessoa, na planilha "treino" (aberta pelo código dela, pois o script é independente).
// O código secreto fica em Configurações do projeto > Propriedades do script > TOKEN (nunca no código).
const ABAS = ['Fernando', 'Iris', 'Bia']

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents)
    const token = PropertiesService.getScriptProperties().getProperty('TOKEN')
    if (!token || d.token !== token) return resposta({ ok: false, erro: 'código inválido' })
    if (ABAS.indexOf(d.aba) < 0) return resposta({ ok: false, erro: 'aba inválida' })
    const linhas = d.linhas
    if (!Array.isArray(linhas) || !linhas.length) return resposta({ ok: false, erro: 'sem dados' })
    const aba = SpreadsheetApp.openById('1f3vptgihjQTnszaY9f9dnwAYI96EhX9fa41BPsYN7Yg').getSheetByName(d.aba)
    if (!aba) return resposta({ ok: false, erro: 'aba não existe' })
    const largura = linhas[0].length
    aba.clearContents()
    // Tudo como texto simples (setValues não executa fórmulas vindas de texto digitado como "'=")
    aba.getRange(1, 1, linhas.length, largura).setNumberFormat('@').setValues(linhas)
    aba.getRange(1, 1, 1, largura).setFontWeight('bold')
    aba.setFrozenRows(1)
    return resposta({ ok: true, linhas: linhas.length - 1 })
  } catch (err) {
    return resposta({ ok: false, erro: String(err) })
  }
}

function resposta(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON)
}
