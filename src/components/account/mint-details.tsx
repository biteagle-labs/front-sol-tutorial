import { Mint } from "@solana/spl-token"

export const MintAccountDetails = ({
  account: mintAccount,
}: {
  account?: Mint
}) => {
  if (!mintAccount) return

  return (
    <div className="border-2 border-zinc-600 rounded-md p-4 space-y-2">
      <p className="font-bold">Current mint account details:</p>
      <p className="text-xs">
        <span className="font-bold">Address: </span>
        {mintAccount?.address.toBase58()}
      </p>
      <p className="text-xs">
        <span className="font-bold">Tokens provided: </span>
        {Number(mintAccount?.supply) / 10 ** mintAccount?.decimals}
      </p>
      <p className="text-xs">
        <span className="font-bold">Mint authority address: </span>
        {mintAccount?.mintAuthority?.toBase58()}
      </p>
      <p className="text-xs">
        <span className="font-bold">Freeze authority owner: </span>
        {mintAccount?.freezeAuthority?.toBase58()}
      </p>
    </div>
  )
}

export default MintAccountDetails
