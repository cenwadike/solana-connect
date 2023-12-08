<template>
    <div>
        <input type="amount" v-model="amount" />

        <button @click="submit">Submit</button>
    </div>
</template>
  
<script>
import { transferSplToken } from '../../lib/createTransfer'

export default {

    data() {
        return {
            amount: null
        }
    },
    methods: {
        submit() {
            transferSplToken(this.amount)
        }
    }
}
</script>