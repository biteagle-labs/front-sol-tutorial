import { getAccount, getMint } from "@solana/spl-token"
import { useConnection } from "@solana/wallet-adapter-react"
import { PublicKey } from "@solana/web3.js"
import { useMutation } from "@tanstack/react-query"

export const useTokenAccount = () => {
  const { connection } = useConnection()

  // Get mint account information
  const {
    data: mintAccount,
    isPending: isPendingGetMintAccount,
    mutateAsync: getMintAccount,
    reset: resetGetMintAccount,
  } = useMutation({
    mutationKey: ["getMintAccount"],
    mutationFn: async (publicKey: PublicKey) => {
      return await getMint(connection, new PublicKey(publicKey))
    },
  })

  // Get token account information
  const {
    data: tokenAccount,
    isPending: isPendingGetTokenAccount,
    mutateAsync: getTokenAccount,
    reset: resetGetTokenAccount,
  } = useMutation({
    mutationKey: ["getTokenAccount"],
    mutationFn: async (publicKey: PublicKey) => {
      return await getAccount(connection, publicKey)
    },
  })

  return {
    mintAccount,
    tokenAccount,
    isPendingGetMintAccount,
    isPendingGetTokenAccount,
    getMintAccount,
    resetGetMintAccount,
    getTokenAccount,
    resetGetTokenAccount,
  }
}
