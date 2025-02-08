import { toast } from "sonner"
import { sendV0Transaction } from "@/utils/transaction"
import { createBurnCheckedInstruction } from "@solana/spl-token"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { PublicKey } from "@solana/web3.js"
import { useMutation } from "@tanstack/react-query"

export const useBurnToken = (onSuccess?: VoidFunction) => {
  const { connection } = useConnection()
  const { publicKey, signTransaction } = useWallet()

  /**
   *
   * @param param0 ata account, mint account, amount, decimals
   * @returns transaction hash
   */
  const burnSpl = async ({
    ataAccount,
    mintAccount,
    amount,
    decimals,
  }: {
    ataAccount: string
    mintAccount: string
    amount: number
    decimals: number
  }) => {
    if (!publicKey) throw new Error("Please connect your wallet first")

    // Calculate the amount in the smallest unit
    const amountInSmallestUnit = BigInt(Math.floor(amount * 10 ** decimals))

    return await sendV0Transaction(
      connection,
      publicKey,
      [
        createBurnCheckedInstruction(
          new PublicKey(ataAccount), // ata account
          new PublicKey(mintAccount), // mint account
          publicKey, // authority
          amountInSmallestUnit, // amount
          decimals // number of decimals
        ),
      ],
      signTransaction
    )
  }

  const { isPending, mutateAsync, reset } = useMutation({
    mutationKey: ["burn", publicKey],
    mutationFn: burnSpl,
    onSuccess: () => {
      toast.success("SPL burned successfully")
      onSuccess?.()
      reset()
    },
    onError: (err) => {
      toast.error(err.message)
      reset()
    },
  })

  return {
    isLoading: isPending,
    burnToken: mutateAsync,
    reset,
  }
}
