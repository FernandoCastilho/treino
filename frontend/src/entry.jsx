import { passarPelaSenha } from './lib/gate.js'

// Só carrega o app depois da senha (ver lib/gate.js).
passarPelaSenha().then(() => import('./main.jsx'))
