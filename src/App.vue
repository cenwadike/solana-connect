<script setup>
import TransferDbaToken from './components/TransferDbaToken.vue';
import ConnectWallet from './components/ConnectWallet.vue'

import "solana-wallets-vue/styles.css"
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { initWallet } from 'solana-wallets-vue';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'

const walletOptions =
  [
    new PhantomWalletAdapter({ network: WalletAdapterNetwork.Mainnet }),
    new SolflareWalletAdapter({ network: WalletAdapterNetwork.Mainnet }),
  ]

initWallet({
  walletOptions,
  autoConnect: true
})

walletOptions

</script>

<template>
  <header>
    <div class="wrapper">
      <ConnectWallet />
    </div>
  </header>

  <main>
    <TransferDbaToken />
  </main>
</template>

<style scoped>
header {
  line-height: 1.5;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
