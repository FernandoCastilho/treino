import { passarPeloLogin } from './lib/gate.js'

// Só carrega o app depois do login com o Google (ver lib/gate.js).
passarPeloLogin().then(() => import('./main.jsx'))
