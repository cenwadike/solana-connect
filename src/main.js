import './assets/main.css'

import SolanaWallets from "solana-wallets-vue"

import { createApp } from 'vue'
import walletOptions from './App.vue'
import App from './App.vue'

createApp(App).use(SolanaWallets, walletOptions).mount('#app')
