import { toast } from "sonner"
import { useMutation } from "@tanstack/react-query"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { LAMPORTS_PER_SOL } from "@solana/web3.js"

import { Button } from "./ui/button"

export const SolAirdropButton = () => {
  const { connection } = useConnection()
  const { publicKey } = useWallet()

  const getAirdrop = async () => {
    if (!publicKey) {
      throw new Error("Please connect your wallet")
    }

    const [lastestBlockhash, signature] = await Promise.all([
      connection.getLatestBlockhash(),
      connection.requestAirdrop(publicKey, 5 * LAMPORTS_PER_SOL),
    ])
    const sigResult = await connection.confirmTransaction(
      { signature, ...lastestBlockhash },
      "confirmed"
    )

    if (sigResult) return sigResult.value

    throw new Error("Airdrop failed")
  }

  const { isPending, mutateAsync, reset } = useMutation({
    mutationKey: ["getAirdrop", publicKey],
    mutationFn: getAirdrop,
    onSuccess: () => {
      toast.success("Successfully received dev airdrop")
      reset()
    },
    onError: (err) => {
      if (err.message.includes("429")) {
        toast.error("You have already claimed, please try again in 3 hours")
      } else {
        toast.error(`Airdrop failed: ${err.message}`)
      }

      reset()
    },
  })

  return (
    <Button
      className="w-fit"
      onClick={() => mutateAsync()}
      disabled={isPending}
    >
      {isPending ? "Loading..." : "Get 5 test tokens"}
    </Button>
  )
}

export default SolAirdropButton
