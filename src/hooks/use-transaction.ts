import { toast } from "sonner"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js"
import { useMutation } from "@tanstack/react-query"
import bs58 from "bs58"

import { useBalance } from "./use-balance"
import { sendV0Transaction } from "@/utils/transaction"
import { createTransferCheckedInstruction } from "@solana/spl-token"
import { useMintSpl } from "./use-mint-spl"

export const useTx = (
  onSendSolSuccess?: VoidFunction,
  onSendSplSuccess?: VoidFunction
) => {
  const { connection } = useConnection()
  const { publicKey, signTransaction } = useWallet()
  const { getSolBalance } = useBalance(publicKey)
  const { createTokenAccount } = useMintSpl("all")

  const sendSOL = async ({
    address,
    amount,
  }: {
    address: string
    amount: number
  }) => {
    if (!publicKey) {
      throw new Error("Please connect your wallet first")
    }

    const balance = await connection.getBalance(publicKey)

    if (balance < amount * LAMPORTS_PER_SOL) {
      throw new Error("Insufficient balance")
    }

    const recipient = new PublicKey(address)

    // V0 version send SOL
    const transferInstruction = SystemProgram.transfer({
      fromPubkey: publicKey,
      toPubkey: recipient,
      lamports: amount * LAMPORTS_PER_SOL, // Send 0.01 SOL
    })

    return await sendV0Transaction(
      connection,
      publicKey,
      [transferInstruction],
      signTransaction
    )
  }

  /**
   * Transfer SPL tokens
   * @param ata ata account
   * @param mint mint account
   * @param to recipient address, must be a token account
   * @param amount token amount
   * @returns transaction hash
   */
  const sendSPL = async ({
    ata,
    mint,
    to,
    amount,
    decimals,
  }: {
    ata: PublicKey
    mint: PublicKey
    to?: string
    amount: number
    decimals: number
  }) => {
    if (!publicKey) throw new Error("Please connect your wallet first")

    // Calculate the amount in the smallest unit
    const amountInSmallestUnit = BigInt(Math.floor(amount * 10 ** decimals))

    // Build Transfer instruction
    const createTransferInstruction = (destination: PublicKey) =>
      createTransferCheckedInstruction(
        ata, // Source token account
        mint, // Mint address
        destination, // Recipient address (must be a token account)
        publicKey, // Sender's publickey (token administrator)
        amountInSmallestUnit, // Amount of tokens to transfer (in smallest unit)
        decimals // Number of decimals for the token
      )

    // If no recipient address is specified, create a recipient wallet and token account
    if (!to) {
      const account = Keypair.generate()
      console.log("create one account:", bs58.encode(account.secretKey))

      const { createTokenAccountInstuction, ata: receiveAccount } =
        await createTokenAccount(mint, account.publicKey)

      // Send 0.1 SOL to the newly created account to create the token account
      await sendSOL({ address: account.publicKey.toBase58(), amount: 0.1 })

      // Execute transaction: create target token account and transfer
      return await sendV0Transaction(
        connection,
        publicKey,
        [
          createTokenAccountInstuction, // Create recipient's token account
          createTransferInstruction(receiveAccount), // Transfer instruction
        ],
        signTransaction,
        [account]
      )
    }

    // If a recipient address is specified, transfer directly
    return await sendV0Transaction(
      connection,
      publicKey,
      [
        createTransferInstruction(new PublicKey(to)), // Transfer to specified account
      ],
      signTransaction
    )
  }

  const {
    isPending: isSendingSol,
    mutateAsync: sendSolAsync,
    reset: sendSolReset,
  } = useMutation({
    mutationKey: ["sendSol", publicKey],
    mutationFn: sendSOL,
    onSuccess: () => {
      toast.success("SOL sent successfully")

      setTimeout(() => {
        getSolBalance()
      }, 3000)

      onSendSolSuccess?.()
      sendSolReset()
    },
    onError: (error) => {
      toast.error(error.message)
      sendSolReset()
    },
  })

  const {
    isPending: isSendSplPending,
    mutateAsync: sendSplAsync,
    reset: sendSplReset,
  } = useMutation({
    mutationKey: ["sendSpl", publicKey],
    mutationFn: sendSPL,
    onSuccess: () => {
      toast.success("SPL sent successfully")
      onSendSplSuccess?.()

      sendSolReset()
    },
    onError: (error) => {
      toast.error(error.message)
      sendSplReset()
    },
  })

  return {
    isSendingSol,
    isSendSplPending,
    sendSolAsync,
    sendSplAsync,
    sendSolReset,
    sendSplReset,
  }
}
