import { Account, Mint } from "@solana/spl-token"

export const TokenAccountDetails = ({
  tokenAccount,
  mintAccount,
}: {
  tokenAccount?: Account
  mintAccount?: Mint
}) => {
  if (!tokenAccount || !mintAccount) return

  return (
    <div className="border-2 border-zinc-600 rounded-md p-4 space-y-2">
      <p className="font-bold">Current ATA details:</p>
      <p className="text-xs">
        <span className="font-bold">Address: </span>
        {tokenAccount?.address.toBase58()}
      </p>
      <p className="text-xs">
        <span className="font-bold">Total tokens: </span>
        {Number(tokenAccount?.amount) / 10 ** mintAccount!.decimals}
      </p>
      <p className="text-xs">
        <span className="font-bold">Associated mint account: </span>
        {tokenAccount!.mint?.toBase58()}
      </p>
      <p className="text-xs">
        <span className="font-bold">Account owner: </span>
        {tokenAccount!.owner?.toBase58()}
      </p>
      <p className="text-xs">
        <span className="font-bold">Is initialized: </span>
        {tokenAccount!.isInitialized ? "Yes" : "No"}
      </p>
      <p className="text-xs">
        <span className="font-bold">Is frozen: </span>
        {tokenAccount!.isFrozen ? "Yes" : "No"}
      </p>
      <p className="text-xs">
        <span className="font-bold">Delegate transfer token address: </span>{" "}
        {tokenAccount!.delegate?.toBase58() || "None"}
      </p>
      <p className="text-xs">
        <span className="font-bold">
          Close token account authority address:{" "}
        </span>
        {tokenAccount!.closeAuthority?.toBase58() || "None"}
      </p>
      <p className="text-xs">
        <span className="font-bold">Is native token account: </span>
        {tokenAccount!.isNative ? "Yes" : "No"}
      </p>
      <p className="text-xs">
        <span className="font-bold">Rent: </span>
        {Number(tokenAccount!.rentExemptReserve) || "None"}
      </p>
    </div>
  )
}

export default TokenAccountDetails
