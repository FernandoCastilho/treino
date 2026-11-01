# Histórico na planilha "treino" (Google Drive)

A planilha **treino** tem uma aba por pessoa: **Fernando**, **Iris** e **Bia**. Cada pessoa envia o próprio histórico
para a própria aba. O envio é refeito sozinho depois de cada treino e sempre **substitui** a aba (nunca duplica).

## Uma vez só (Fernando, no computador)
1. Abra a planilha **treino** no Google Drive > **Extensões > Apps Script**.
2. Apague o que estiver lá e cole o conteúdo de `apps-script/Codigo.gs`. Salve.
3. **Configurações do projeto (engrenagem) > Propriedades do script > Adicionar**: nome `TOKEN`, valor = um código
   secreto que você inventar (ex.: 4 palavras). Não use a senha do app.
4. **Implantar > Nova implantação > Tipo: Aplicativo da web**. Executar como: **Eu**. Quem tem acesso: **Qualquer pessoa**.
   Autorize quando o Google pedir. Copie o endereço que termina em `/exec`.

## Em cada celular
App > **Configurações > Dados > Planilha do Google Sheets**: cole o endereço, o código secreto e escreva a aba
(`Fernando`, `Iris` ou `Bia`, exatamente assim). Toque em **Salvar e enviar agora**.

## Cuidados
- Quem tiver o endereço **e** o código consegue gravar nas abas. Passe o código só para a Iris e a Bia, por mensagem privada.
- O código fica só no celular (não vai para o repositório nem para os backups). Para trocar: mude o `TOKEN` no script e nos celulares.
- A planilha só é lida por você (e por quem você compartilhar). O app nunca lê a planilha, só escreve.
