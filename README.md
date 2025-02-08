# Learning Solana Related Interaction Operations

### 1. The second parameter of `confirmTransaction()`

In Solana, the confirmation process of blockchain transactions has different "commitment levels." Each commitment level represents the degree of confirmation of a transaction in the network, and they are used to weigh the security and speed of the transaction. A higher commitment level means waiting longer to confirm the transaction, but it also means higher finality (i.e., a lower chance of the transaction being rolled back). The second parameter of confirmTransaction() is the "commitment level." Here are the common Solana commitment levels and their meanings:

1. processed:
   - Indicates that the transaction has been processed and included in the current node's memory pool (not yet written to a block);
   - This level of confirmation is very fast, but the transaction may not have been written to a block and could ultimately be rolled back.
   - **Suitable for quick confirmation**, but not suitable for highly dependent operations.
2. confirmed:
   - Indicates that the transaction has been included in a block and confirmed, but has not yet been confirmed by the majority of nodes in the network.
   - It indicates that the transaction has passed preliminary confirmation and has a certain level of security.
   - **Applicable to most scenarios**, the transaction is mostly valid, but there is still a possibility of rollback.
3. finalized:
   - Indicates that the transaction has been fully confirmed and will absolutely not be rolled back.
   - At this level, the transaction has been confirmed by enough network nodes, achieving blockchain finality.
   - **The highest level of confirmation**, suitable for operations requiring the highest security, but requires waiting longer.

### 2. Sending Transactions

Solana has two versions: the old version and the V0 version, so there are naturally two ways to send transactions. Here is the code for sending transactions using the V0 version:

```ts
/**
 * V0 version sign and send transaction
 * @param connection Connector
 * @param publicKey Current account public key
 * @param instructions Instruction set
 * @param signTransaction Sign function
 * @returns Transaction result
 */
export const sendV0Transaction = async (
  connection: Connection,
  publicKey: PublicKey,
  instructions: TransactionInstruction[],
  signTransaction: WalletContextState["signTransaction"],
  signers?: Signer[]
) => {
  // Ensure signTransaction exists
  if (!signTransaction) {
    throw new Error("Sign function is undefined, unable to sign transaction")
  }

  // Get the latest block hash
  const latestBlockhash = await connection.getLatestBlockhash()

  // Use TransactionMessage to construct v0 transaction message
  const message = new TransactionMessage({
    payerKey: publicKey, // Payer account
    recentBlockhash: latestBlockhash.blockhash, // Latest block hash
    instructions, // Included instructions
  }).compileToV0Message() // Compile to v0 message

  // Create VersionedTransaction
  const transaction = new VersionedTransaction(message)

  if (signers && signers.length > 0) transaction.sign(signers)

  // Sign the transaction (ensure signing is successful)
  const signedTransaction = await signTransaction(transaction)
  if (!signedTransaction) {
    throw new Error("Transaction signing failed")
  }

  // Send the signed raw transaction
  const signature = await connection.sendRawTransaction(
    signedTransaction.serialize() // Serialize the signed transaction
  )

  // Confirm the transaction, using "confirmed" or other commitment levels
  return await connection.confirmTransaction(
    { signature, ...latestBlockhash },
    "confirmed"
  )
}
```

### 3. Mint Token Process

- First, you need to create a mint account (note that this should not be confused with a wallet account). The code is as follows:

```ts
// Create mint account
const mint = Keypair.generate()
console.log(`Mint: ${mint.publicKey.toBase58()}`)

const createAccountInstruction = SystemProgram.createAccount({
  fromPubkey: publicKey, // Account paying the fees (user wallet)
  newAccountPubkey: mint.publicKey, // Newly created Mint account
  lamports: await getMinimumBalanceForRentExemptMint(connection),
  space: MINT_SIZE, // Storage space required for Mint account
  programId: TOKEN_PROGRAM_ID, // Token Program ID
})

// Initialize mint account
const initMintInstruction = createInitializeMintInstruction(
  mint.publicKey,
  8,
  publicKey, // Address with mint authority
  publicKey // Address with freeze authority
)

// Return instructions and mint account
// You can directly send instructions to complete the signed transaction (may require multiple signatures), or you can pass the instructions down and finally complete the signed transaction in one go (only need to sign once)
return {
  createMintInstruction: [
    createAccountInstruction,
    initMintInstruction,
  ] as const,
  mint,
}
```

> The mint account (also called the minting account) is the core of the token, representing a specific type of token contract. The mint account is used to track the total supply of tokens, the number of decimal places, and other information. In Solana's SPL token standard, the mint account is the basis for all token-related operations, such as minting, burning, transferring, etc.

- Then use the mint account to create an associated token account (ATA)

```ts
// The first parameter is the Mint address of the SPL token that the user will hold.
// The second parameter is the user's wallet address.
const ata = await getAssociatedTokenAddress(mint, publicKey)

console.log(`ATA: ${ata.toBase58()}`)

const createTokenAccountInstuction = createAssociatedTokenAccountInstruction(
  publicKey, // Paying account
  ata, // Associated token account
  publicKey, // Owner of the token account
  mint // Token mint account, i.e., mint account
)

return { createTokenAccountInstuction, ata }
```

> ATA (Associated Token Account) is an account uniquely bound to a wallet address and a mint account, used to store the balance of the tokens held by the user. ATA is a convenient account design in the Solana token standard, allowing users and developers to manage token balances more simply and uniformly.

> Note: A mint token can have multiple different ATAs because it can be combined with different user wallet addresses. However, under the same user address, an ATA account can only be bound to one mint account (i.e., an associated token address can only store one type of SPL token).

- Start minting SPL tokens

```ts
// Get the mint account and its creation instructions
const { createMintInstruction, mint: mintAccount } = await createMintAccount()
// Get the ATA account and its creation instructions
const { createTokenAccountInstuction, ata: ataAccount } =
  await createTokenAccount(mintAccount.publicKey, publicKey)

// Sign and send the transaction uniformly
await sendV0Transaction(
  connection,
  publicKey,
  [
    ...createMintInstruction,
    createTokenAccountInstuction,
    // Mint SPL to the token account
    createMintToCheckedInstruction(
      mintAccount.publicKey, // Mint account
      new PublicKey(ataAccount), // Token account
      publicKey, // Public key of the token administrator
      1e8, // Amount of tokens
      8 // Number of decimal places
    ),
  ],
  signTransaction,
  [mintAccount]
)

const ataAccountPubKey = ataAccount.toBase58()
const mintAccountPubKey = mintAccount.publicKey.toBase58()

return { ataAccountPubKey, mintAccountPubKey }
```

### 4. Sending SPL

To send SPL, both parties must have the same SPL token. The ATAs can be different, but the tokens stored in the ATAs must be the same. The code for constructing the transaction instruction is as follows:

```ts
// Calculate the minimum unit number for the transfer
const amountInSmallestUnit = BigInt(Math.floor(amount * 10 ** decimals))

// Construct Transfer instruction
const createTransferInstruction = (destination: PublicKey) =>
  createTransferCheckedInstruction(
    ata, // Source token account
    mint, // Mint address
    destination, // Receiving address (must be a token account)
    publicKey, // Sender's public key (token administrator)
    amountInSmallestUnit, // Amount of tokens to transfer (in smallest unit)
    decimals // Number of decimal places for the token
  )
```

### 5. Burning SPL

```ts
await sendV0Transaction(
  connection,
  publicKey,
  [
    createBurnCheckedInstruction(
      new PublicKey(ataAccount), // ATA account
      new PublicKey(mintAccount), // Mint account
      publicKey, // Authorizer
      amountInSmallestUnit, // Amount
      decimals // Number of decimal places
    ),
  ],
  signTransaction
)
```
