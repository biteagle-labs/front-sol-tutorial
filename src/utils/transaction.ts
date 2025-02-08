import { WalletAdapterProps } from "@solana/wallet-adapter-base"
import { type WalletContextState } from "@solana/wallet-adapter-react"
import {
  Signer,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
  type Connection,
  type PublicKey,
  type TransactionInstruction,
} from "@solana/web3.js"

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

/**
 * Old version send transaction
 * @param connection Connector
 * @param tx Transaction
 * @param sendTransaction Method to send transaction
 * @returns Transaction result
 */
export const sendOldTransaction = async (
  connection: Connection,
  tx: Transaction,
  sendTransaction: WalletAdapterProps["sendTransaction"]
) => {
  // const tx = new Transaction().add(
  //     SystemProgram.transfer({
  //       fromPubkey: publicKey,
  //       toPubkey: recipient,
  //       lamports: amount * LAMPORTS_PER_SOL,
  //     })
  //   )

  // Sign
  const signature = await sendTransaction(tx, connection)
  // Get the latest blockhash and block height for transaction confirmation
  const latestBlockhash = await connection.getLatestBlockhash()

  // Confirm the transaction
  return await connection.confirmTransaction(
    {
      signature,
      ...latestBlockhash,
    },
    "confirmed"
  )
}
