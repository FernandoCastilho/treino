// Uso: node scripts/gerar-hash-senha.mjs "a senha"
// Imprime o valor para a variável SENHA_HASH do repositório (Settings > Secrets and variables > Actions > Variables).
import { randomBytes } from 'node:crypto'
import { derivar } from '../frontend/src/lib/gate.js'

const senha = process.argv[2]
if (!senha || senha.length < 8) {
  console.error('Informe uma senha de pelo menos 8 caracteres.')
  process.exit(1)
}
const iteracoes = 210000
const salt = randomBytes(16).toString('hex')
console.log(`${iteracoes}:${salt}:${await derivar(senha, salt, iteracoes)}`)
