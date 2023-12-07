
import { DESTINATION_ADDRESS, TOKEN_ADDRESS, SOLANA_PUBLIC_MAINNET_RPC_ENDPOINT } from '../constant';
import { useWallet } from 'solana-wallets-vue';
import { Connection, Transaction, TransactionInstruction } from '@solana/web3.js';
import BigNumber from 'bignumber.js';

import { createTransferCheckedInstruction, getAccount, getMint, getOrCreateAssociatedTokenAccount } from '@solana/spl-token';

export async function transferDbaToDestinationAddress(transferAmount) {
    // establish connection to a cluster
    const connection = new Connection(SOLANA_PUBLIC_MAINNET_RPC_ENDPOINT, 'confirmed');
    const version = await connection.getVersion();
    console.log('Connection to cluster established:', SOLANA_PUBLIC_MAINNET_RPC_ENDPOINT, version);

    // verify user is still connected 
    const { publicKey, wallet, sendTransaction, connected } = useWallet();
    if (connected) {
        console.log("user wallet still connected: ", publicKey.value)
    }

    // verify receiver account
    try {
        await connection.getAccountInfo(DESTINATION_ADDRESS);
        console.log("receiver verified")
    } catch (error) {
        console.error(error)
    }

    // get senders account
    const sender = publicKey;

    // create valid transfer instruction
    const transferInstruction = await createTransferCheckedTransaction(
        DESTINATION_ADDRESS, transferAmount, TOKEN_ADDRESS, sender, connection
    );
    console.log("valid transfer instruction created")

    // construct transaction 
    const transaction = new Transaction();

    transaction.add(transferInstruction);
    console.log("transaction constructed successfully")

    // send transaction to the network
    const txSignature = await sendTransaction(transaction, connection);
    console.log("transaction submitted")

    // validate transaction within 4 seconds
    try {
        const latestBlockhash = await connection.getLatestBlockhash();
        await connection.confirmTransaction({
            blockhash: latestBlockhash.blockhash,
            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
            signature: txSignature,
        }, 'confirmed');
        console.log("transaction confirmation successful")
        clearInterval(interval);
    } catch (error) {
        console.log(error);
    };

    //TODO: update state
};

async function createTransferCheckedTransaction(
    recipient,
    amount,
    splToken,
    sender,
    connection
) {
    // Check mint info of DBA token 
    const mint = await getMint(connection, splToken);
    const TEN = new BigNumber(10);
    amount = new BigNumber(amount)
    
    if (!mint.isInitialized) throw new CreateTransferError('DBA token not initialized');

    // Check that the amount provided doesn't have greater precision than the mint
    if ((amount.decimalPlaces() ?? 0) > mint.decimals) throw new CreateTransferError('amount decimals invalid');

    // Convert input decimal amount to integer tokens according to the mint decimals
    amount = amount.times(TEN.pow(mint.decimals)).integerValue(BigNumber.ROUND_FLOOR);
    
    // Get the sender's ATA and check that the account exists and can send tokens
    const senderATA = await getOrCreateAssociatedTokenAccount( connection, sender, splToken, sender.value);
    console.log(senderATA)
    const senderAccount = await getAccount(connection, senderATA.address);
    if (!senderAccount.isInitialized) throw new CreateTransferError('sender ATA not initialized');
    if (senderAccount.isFrozen) throw new CreateTransferError('sender account is frozen');

    console.log(splToken.toBase58());
    // Get the recipient's ATA and check that the account exists and can receive tokens
    const recipientATA = await getOrCreateAssociatedTokenAccount( connection, sender, splToken, recipient);
    const recipientAccount = await getAccount(connection, recipientATA.address);
    if (!recipientAccount.isInitialized) throw new CreateTransferError('recipient not initialized');
    if (recipientAccount.isFrozen) throw new CreateTransferError('recipient frozen');

    // Check that the sender has enough tokens
    const tokens = BigInt(String(amount));
    if (tokens > senderAccount.amount) throw new CreateTransferError('insufficient funds');

    // Create an instruction to transfer SPL tokens, asserting the mint and decimals match
    return createTransferCheckedInstruction(senderATA.address, splToken, recipientATA.address, sender.value, tokens, mint.decimals);
}
