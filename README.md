# FC Gym

FC Gym: app de treino da família (repositório `treino`), publicado em https://fernandocastilho.github.io/treino/ (GitHub Pages, sem servidor).

- **Base:** [openGym](https://github.com/DuarteSantos8/openGym), de Duarte Santos, licença AGPL-3.0 (`LICENSE`, `NOTICE.md`). O código-fonte fica aberto neste repositório, como a licença exige.
- **Uso:** "Continuar sem conta". Os dados ficam só no navegador de cada aparelho.
- **Senha:** uma tela simples na entrada (`frontend/src/lib/gate.js`). É barreira leve, não segurança forte: o site é público e o código é aberto. O hash da senha vem da variável `SENHA_HASH` do repositório. Para gerar: `node scripts/gerar-hash-senha.mjs "a senha"`.
- **Animações dos exercícios:** NÃO estão aqui. São da Gym visual e só podem ser usadas dentro do openGym (ver `NOTICE.md`).
- **Fluxo:** mudanças entram por branch e pull request; o CI testa e monta; só o responsável mescla. O robô publica ao mesclar em `main`.
