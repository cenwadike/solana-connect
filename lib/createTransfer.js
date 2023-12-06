
import { DESTINATION_ADDRESS, DBA_TOKEN_ADDRESS, SOLANA_PUBLIC_DEVNET_RPC_ENDPOINT } from '../constant';
import { useWallet } from 'solana-wallets-vue';
import { Connection, clusterApiUrl, Transaction } from '@solana/web3.js';

import { createTransferCheckedInstruction, getAssociatedTokenAddress, getMint } from '@solana/spl-token';

export async function transferDbaToDestinationAddress(transferAmount) {
    // establish connection to a cluster
    const endpoint = clusterApiUrl(SOLANA_PUBLIC_DEVNET_RPC_ENDPOINT);
    const connection = new Connection(endpoint, 'confirmed');
    const version = await connection.getVersion();
    console.log('Connection to cluster established:', endpoint, version);

    // get senders account
    const { publicKey, sendTransaction } = useWallet();
    if (!publicKey.value) return;
    const sender = publicKey;

    // verify receiver account
    const receiverInfo = await connection.getAccountInfo(DESTINATION_ADDRESS);
    if (!receiverInfo) return;

    // create valid transfer instruction
    const transferInstruction = await createTransferCheckedTransaction(
        DESTINATION_ADDRESS, transferAmount, DBA_TOKEN_ADDRESS, sender, connection
    );

    // construct transaction 
    const transaction = new Transaction();
    transaction.feePayer = sender;
    transaction.add(
        new TransactionInstruction({
            programId: DBA_TOKEN_ADDRESS,
            keys: [],
            data: Buffer.from(memo, 'utf8'),
        })
    );
    transaction.add(transferInstruction);

    // send transaction to the network
    const txSignature = await sendTransaction(transaction, connection);

    // validate transaction within 4 seconds
    try {
        const latestBlockhash = await connection.getLatestBlockhash();
        await connection.confirmTransaction({
            blockhash: latestBlockhash.blockhash,
            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
            signature: txSignature,
        }, 'confirmed');
        clearInterval(interval);
    } catch (error) {
        console.log(error);
        clearInterval(interval);
    };

    //TODO: update database
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
    if (!mint.isInitialized) throw new CreateTransferError('DBA token not initialized');

    // Check that the amount provided doesn't have greater precision than the mint
    if ((amount.decimalPlaces() ?? 0) > mint.decimals) throw new CreateTransferError('amount decimals invalid');

    // Convert input decimal amount to integer tokens according to the mint decimals
    amount = amount.times(TEN.pow(mint.decimals)).integerValue(BigNumber.ROUND_FLOOR);

    // Get the sender's ATA and check that the account exists and can send tokens
    const senderATA = await getAssociatedTokenAddress(splToken, sender);
    const senderAccount = await getAccount(connection, senderATA);
    if (!senderAccount.isInitialized) throw new CreateTransferError('sender ATA not initialized');
    if (senderAccount.isFrozen) throw new CreateTransferError('sender account is frozen');

    // Get the recipient's ATA and check that the account exists and can receive tokens
    const recipientATA = await getAssociatedTokenAddress(splToken, recipient);
    const recipientAccount = await getAccount(connection, recipientATA);
    if (!recipientAccount.isInitialized) throw new CreateTransferError('recipient not initialized');
    if (recipientAccount.isFrozen) throw new CreateTransferError('recipient frozen');

    // Check that the sender has enough tokens
    const tokens = BigInt(String(amount));
    if (tokens > senderAccount.amount) throw new CreateTransferError('insufficient funds');

    // Create an instruction to transfer SPL tokens, asserting the mint and decimals match
    return createTransferCheckedInstruction(senderATA, splToken, recipientATA, sender, tokens, mint.decimals);
}
