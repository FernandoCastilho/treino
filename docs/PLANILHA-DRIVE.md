# Entrada com o Google e histórico na planilha "treino"

O app abre com **Entrar com o Google**. Só os e-mails da família entram. O mesmo login decide a aba da planilha
**treino** (**Fernando**, **Iris** ou **Bia**), então não há endereço, código nem aba para digitar em cada celular.
Depois de cada treino o app reenvia o histórico, que **substitui** a aba (nunca duplica).

## Como funciona
1. O botão do Google devolve um comprovante do e-mail.
2. O app manda o comprovante ao Apps Script (`apps-script/Codigo.gs`). Ele confere com o Google, vê se o e-mail está
   na lista (propriedade `EMAILS`) e devolve uma sessão assinada, válida por 30 dias.
3. O app guarda a sessão no celular e a usa para liberar a tela e enviar o histórico.

## Configuração (já feita; refazer só se mudar)
- **Google Cloud** (projeto Hermes): cliente OAuth "FC Gym", origem `https://fernandocastilho.github.io`, app em modo
  **Teste**. Quem entra precisa estar em **Público-alvo > Usuários de teste** (limite de 100).
- **Apps Script** (Configurações do projeto > Propriedades do script):
  - `EMAILS`: `{"fernandotcastilho@gmail.com":"Fernando","email-da-esposa@gmail.com":"Iris","email-da-filha@gmail.com":"Bia"}`
  - `SEGREDO`: texto longo e aleatório (assina as sessões; trocá-lo desconecta todo mundo).
- **Implantação**: aplicativo da web, executar como **Eu**, acesso **Qualquer pessoa**. Depois de mudar o código, crie uma
  **nova versão** da implantação (Gerenciar implantações > editar > Nova versão).

## Incluir ou tirar uma pessoa
Edite `EMAILS` no script e, para incluir, cadastre também o e-mail em **Usuários de teste** no Google Cloud.
Tirar o e-mail de `EMAILS` derruba o acesso na hora, mesmo com sessão válida.

## Cuidados
- Na primeira entrada o Google pode avisar "app não verificado" (o app está em teste): **Avançado > continuar**.
- O site é público: a tela de entrada é uma barreira, e a proteção real da planilha é o script, que só aceita sessões
  assinadas por ele. O app nunca lê a planilha, só escreve.
- **Sair** (Configurações > Conta) apaga a sessão do celular; os treinos continuam no aparelho.
