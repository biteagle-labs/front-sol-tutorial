"use client"

import { ComponentProps, useEffect, useState } from "react"
import { PublicKey } from "@solana/web3.js"

import { useMintSpl } from "@/hooks/use-mint-spl"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { Progress } from "./ui/progress"
import { cn } from "@/lib/utils"
import { Button } from "./ui/button"
import Loading from "./loading"
import { useLocalStorage } from "@/hooks/use-storage"
import { useTokenAccount } from "@/hooks/use-token-account"
import MintAccountDetails from "./account/mint-details"
import TokenAccountDetails from "./account/token-details"

export const MintSplCard = ({
  className,
  ...props
}: ComponentProps<typeof Card>) => {
  const [type, setType] = useState<"all" | "mint">("all")
  const { mintAccount, tokenAccount, getMintAccount, getTokenAccount } =
    useTokenAccount()

  const { getStorage } = useLocalStorage()
  const mint = getStorage("mint")
  const ata = getStorage("ata")

  const {
    mintIsLoading,
    mintIsError,
    progress,

    mintSplAsync,
    mintSplReset,
  } = useMintSpl(type)

  useEffect(() => {
    if (mint) {
      getMintAccount(new PublicKey(mint))
    }

    if (ata) {
      getTokenAccount(new PublicKey(ata))
    }
  }, [mint, ata, mintIsLoading])

  const notice = () => {
    if (mintIsError) return "Mint failure"

    switch (progress) {
      case 0:
        return "Please start Mint"
      case 33.33:
        return "A mint account has been created"
      case 50:
        return "mint and ATA addresses have been obtained and verified"
      case 66.66:
        return "An ATA has been created"
      case 100:
        return "Mint completed"
      default:
        return "unknown state"
    }
  }

  return (
    <Card className={cn("w-full", className)} {...props}>
      <CardHeader>
        <CardTitle>Mint SPL token</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <Progress
            value={progress}
            className={cn("h-5 w-full", mintIsError && "bg-red-500")}
          />
          <div className="flex items-center justify-between">
            <p className="text-sm">
              <span className="font-bold">current progress: </span>
              {notice()}
            </p>
            {mintIsLoading && <Loading />}
          </div>
        </div>
        <div className="text-sm space-y-2">
          <div>
            <span className="font-bold">ATA:</span>{" "}
            {mintIsLoading ? (
              <Loading className="h-4 w-4 inline-block ml-2" />
            ) : ata ? (
              ata
            ) : (
              "No data available"
            )}
          </div>
          <div>
            <span className="font-bold">Mint:</span>{" "}
            {mintIsLoading ? (
              <Loading className="h-4 w-4 inline-block ml-2" />
            ) : mint ? (
              mint
            ) : (
              "No data available"
            )}
          </div>
          <MintAccountDetails account={mintAccount} />

          <TokenAccountDetails
            tokenAccount={tokenAccount}
            mintAccount={mintAccount}
          />
        </div>

        <CardFooter className="p-0 space-x-4">
          <Button
            disabled={mintIsLoading}
            className="w-full"
            onClick={() => {
              setType("all")
              mintSplReset()
              mintSplAsync()
            }}
          >
            {mintIsLoading ? "Minting..." : "Full process mint"}
          </Button>
          <Button
            disabled={mintIsLoading}
            className="w-full"
            onClick={() => {
              setType("mint")
              mintSplReset()
              mintSplAsync()
            }}
          >
            {mintIsLoading ? "Minting..." : "Only mint tokens"}
          </Button>
        </CardFooter>
      </CardContent>
    </Card>
  )
}

export default MintSplCard
