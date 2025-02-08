import { web3 } from "@coral-xyz/anchor"
import { PublicKey } from "@solana/web3.js"

export const isSolAddress = (addr: string) => {
  try {
    return web3.PublicKey.isOnCurve(addr)
  } catch (err) {
    return false
  }
}

export const isPublicKey = (addr: string) => {
  try {
    // Try to create a PublicKey object; if it fails, the format is incorrect
    new PublicKey(addr)
    return true
  } catch (err) {
    return false
  }
}
