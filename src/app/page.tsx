"use client"

import { useWallet } from "@solana/wallet-adapter-react"
import { IoRefresh } from "react-icons/io5"

import SolAirdropButton from "@/components/sol-airdrop"
import SendTokenCard from "@/components/send-token-card"
import { useBalance } from "@/hooks/use-balance"
import MintSplCard from "@/components/mint-spl-card"
import SendSplCard from "@/components/send-spl-card"
import BurnTokenCard from "@/components/burn-token-card"

export default function Home() {
  const { publicKey } = useWallet()
  const { solBalance, getSolBalance } = useBalance(publicKey)

  return (
    <div className="flex flex-col gap-4 py-2 px-4">
      <div className="flex items-center gap-2">
        <span>Wallet balance: {solBalance}</span>
        <IoRefresh className="cursor-pointer" onClick={() => getSolBalance()} />
      </div>
      <SolAirdropButton />
      <div className="grid max-xl:grid-cols-2 xl:grid-cols-3 gap-6 max-sm:grid-cols-1 max-sm:gap-4">
        <div className="space-y-4">
          <SendTokenCard />
          <SendSplCard />
        </div>
        <MintSplCard />
        <div>
          <BurnTokenCard />
        </div>
      </div>
    </div>
  )
}
