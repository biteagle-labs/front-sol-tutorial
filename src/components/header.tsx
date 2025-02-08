"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"

import { Routes } from "@/routes"

export const Header = () => {
  const router = useRouter()

  return (
    <header className="w-full h-fit flex justify-between items-center mb-4 py-2 px-4">
      <svg
        width="250"
        height="50"
        xmlns="http://www.w3.org/2000/svg"
        className="cursor-pointer"
        onClick={() => router.push(Routes.Home)}
      >
        <text
          x="32%"
          y="50%"
          fontSize="24"
          fontFamily="fantasy, sans-serif"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          Solana Learning
        </text>
      </svg>

      <div className="flex gap-4 items-center">
        <Link
          href={"https://faucet.solana.com/"}
          target="_blank"
          className="border-2 border-white font-bold hover:border-black px-4 py-2 rounded-md"
        >
          faucet
        </Link>
        <WalletMultiButton style={{ height: "45px" }} />
      </div>
    </header>
  )
}

export default Header
