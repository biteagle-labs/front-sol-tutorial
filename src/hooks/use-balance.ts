import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { LAMPORTS_PER_SOL, type PublicKey } from "@solana/web3.js"
import { useEffect, useState } from "react"

export const useBalance = (publicKey: PublicKey | null) => {
  const { connection } = useConnection()
  const [solBalance, setSolBalance] = useState(0)
  const [splBalance, setSplBalance] = useState("")

  const getSolBalance = async () => {
    if (!publicKey) return setSolBalance(0)

    const bigSolBalance = await connection.getBalance(publicKey)

    setSolBalance(bigSolBalance / LAMPORTS_PER_SOL)
  }

  const getSplBalance = async (splPublicKey: PublicKey) => {
    if (!splPublicKey) return setSplBalance("No tokens available")

    const tokenAmount = await connection.getTokenAccountBalance(splPublicKey)

    setSplBalance(`${tokenAmount.value.uiAmount} ${tokenAmount.value.decimals}`)
  }

  useEffect(() => {
    getSolBalance()
  }, [publicKey])

  return {
    solBalance,
    splBalance,
    getSolBalance,
    getSplBalance,
  }
}
