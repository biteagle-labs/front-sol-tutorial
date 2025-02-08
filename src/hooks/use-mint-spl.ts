import { useState } from "react"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js"
import { toast } from "sonner"
import {
  Account,
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  createMintToCheckedInstruction,
  getAccount,
  getAssociatedTokenAddress,
  getMinimumBalanceForRentExemptMint,
  getMint,
  Mint,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token"
import { sendV0Transaction } from "@/utils/transaction"
import { useMutation } from "@tanstack/react-query"
import { useLocalStorage } from "./use-storage"

export const useMintSpl = (type: "all" | "mint", onSuccess?: VoidFunction) => {
  const { connection } = useConnection()
  const { publicKey, signTransaction } = useWallet()
  const [progress, setProgress] = useState(0)
  const { getStorage, setStorage } = useLocalStorage()

  /**
   * Create mint account
   * @returns Instructions to create mint account and initialize mint account
   */
  const createMintAccount = async () => {
    if (!publicKey) throw new Error("Please connect your wallet first")

    // Create mint account
    const mint = Keypair.generate()
    console.log(`Mint: ${mint.publicKey.toBase58()}`)

    const createAccountInstruction = SystemProgram.createAccount({
      fromPubkey: publicKey, // Account paying the fees (user's wallet)
      newAccountPubkey: mint.publicKey, // Newly created Mint account
      lamports: await getMinimumBalanceForRentExemptMint(connection),
      space: MINT_SIZE, // Storage space required for Mint account
      programId: TOKEN_PROGRAM_ID, // Token Program ID
    })

    const initMintInstruction = createInitializeMintInstruction(
      mint.publicKey,
      8,
      publicKey, // Mint authority address
      publicKey // Freeze authority address
    )

    return {
      createMintInstruction: [
        createAccountInstruction,
        initMintInstruction,
      ] as const,
      mint,
    }
  }

  /**
   * Create token account
   * @param mint Mint account publickey
   * @param publicKey Paying account, which is also the owner of the token account
   * @returns Instructions to create token account
   */
  const createTokenAccount = async (mint: PublicKey, publicKey: PublicKey) => {
    // The first parameter is the SPL token's Mint address that the user will hold.
    // The second parameter is the user's wallet address.
    const ata = await getAssociatedTokenAddress(mint, publicKey)

    console.log(`ATA: ${ata.toBase58()}`)

    const createTokenAccountInstuction =
      createAssociatedTokenAccountInstruction(
        publicKey, // Paying account
        ata, // Associated token account
        publicKey, // Token account owner
        mint // Token mint account
      )

    return { createTokenAccountInstuction, ata }
  }

  /**
   * Mint tokens process, including creating mint account, creating token account, creating mint instructions, minting tokens, and completing all signature processes
   * @returns ata and mint addresses
   */
  const mintSpl = async () => {
    if (!publicKey) throw new Error("Please connect your wallet first")

    setProgress(0)
    const { createMintInstruction, mint: mintAccount } =
      await createMintAccount()
    setProgress(33.33)
    const { createTokenAccountInstuction, ata: ataAccount } =
      await createTokenAccount(mintAccount.publicKey, publicKey)
    setProgress(66.66)

    // Mint to token account
    await sendV0Transaction(
      connection,
      publicKey,
      [
        ...createMintInstruction,
        createTokenAccountInstuction,
        createMintToCheckedInstruction(
          mintAccount.publicKey, // mint account
          new PublicKey(ataAccount), // token account
          publicKey, // Token administrator's publickey
          1e8, // Token amount
          8 // Number of decimals
        ),
      ],
      signTransaction,
      [mintAccount]
    )

    const ataAccountPubKey = ataAccount.toBase58()
    const mintAccountPubKey = mintAccount.publicKey.toBase58()

    return { ataAccountPubKey, mintAccountPubKey }
  }

  /**
   * Only mint tokens, requires token account and mint account (currently directly obtaining accounts created in the full process)
   * @returns ata and mint addresses
   */
  const justMintSpl = async () => {
    if (!publicKey) throw new Error("Please connect your wallet first")

    const ataAccount = getStorage("ata")
    const mintAccount = getStorage("mint")

    if (!ataAccount) throw new Error("ATA account does not exist")
    if (!mintAccount) throw new Error("Mint account does not exist")

    setProgress(50)

    await sendV0Transaction(
      connection,
      publicKey,
      [
        createMintToCheckedInstruction(
          new PublicKey(mintAccount), // mint account
          new PublicKey(ataAccount), // token account
          publicKey, // Token administrator's publickey
          10e8, // Token amount
          8 // Number of decimals
        ),
      ],
      signTransaction
    )

    return { ataAccountPubKey: ataAccount, mintAccountPubKey: mintAccount }
  }

  // State management
  const {
    isPending: mintIsLoading,
    mutateAsync: mintSplAsync,
    isSuccess: mintIsSuccess,
    isError: mintIsError,
    reset: mintSplReset,
  } = useMutation({
    mutationKey: ["mintSpl"],
    mutationFn: async () => {
      if (type === "all") return await mintSpl()

      return await justMintSpl()
    },
    onSuccess: ({ ataAccountPubKey, mintAccountPubKey }) => {
      toast.success("Mint successful")
      setProgress(100)

      setStorage("ata", ataAccountPubKey)
      setStorage("mint", mintAccountPubKey)

      onSuccess?.()
    },
    onError: (err) => {
      toast.error(`Mint failed: ${err.message}`)
    },
  })

  return {
    mintIsLoading,
    mintIsSuccess,
    mintIsError,
    progress,
    mintSplAsync,
    createMintAccount,
    createTokenAccount,
    mintSpl,
    mintSplReset,
  }
}
