<template>
    <div>
        <input type="amount" v-model="amount" />

        <button @click="submit">Submit</button>
    </div>
</template>
  
<script>
import { transferDbaToDestinationAddress } from '../../lib/createTransfer'

export default {

    data() {
        return {
            amount: null
        }
    },
    methods: {
        submit() {
            transferDbaToDestinationAddress(this.amount)
        }
    }
}
</script>