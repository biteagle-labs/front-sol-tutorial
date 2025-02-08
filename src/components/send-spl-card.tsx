import { useEffect, useState } from "react"
import { z } from "zod"
import { isPublicKey } from "@/utils/address"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useDebounce } from "ahooks"
import { PublicKey } from "@solana/web3.js"
import { Mint } from "@solana/spl-token"

import { useTx } from "@/hooks/use-transaction"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { useMintSpl } from "@/hooks/use-mint-spl"
import { useTokenAccount } from "@/hooks/use-token-account"

export const SendSplCard = () => {
  const { getTokenAccount, getMintAccount } = useTokenAccount()
  const [mintAccount, setMintAccount] = useState<Mint>()

  const getAccountInfo = async () => {
    if (ataInputValue && isPublicKey(ataInputValue)) {
      const ataAccount = await getTokenAccount(new PublicKey(ataInputValue))

      if (ataAccount) {
        const mintAccount = await getMintAccount(ataAccount.mint)

        setMintAccount(mintAccount)
      }
    }
  }

  const { isSendSplPending, sendSplAsync } = useTx(undefined, getAccountInfo)

  const formInputList = [
    {
      id: 1,
      name: "ataAccount",
      label: "Token Account Address (ATA)",
      placeholder: "Enter the token account address",
    },
    {
      id: 2,
      name: "to",
      label: "Recipient Address (optional, must be a token account)",
      placeholder:
        "If not filled in, a wallet will be randomly created to receive the tokens.",
    },
    {
      id: 3,
      name: "amount",
      label: "Amount of Tokens to Transfer",
      placeholder: "Enter the amount of tokens to transfer",
    },
  ] as const

  const formSchema = z.object({
    ataAccount: z.string().refine((value) => !value || isPublicKey(value), {
      message: "Invalid address",
    }),
    to: z
      .string()
      .optional()
      .refine((value) => !value || isPublicKey(value), {
        message: "Invalid address",
      }),
    amount: z.string().min(0.000001, { message: "Amount too small" }),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      ataAccount: "",
      to: "",
      amount: "",
    },
  })

  const ataInputValue = useDebounce(form.watch("ataAccount"), { wait: 500 })

  const handleSubmit = ({
    ataAccount,
    to,
    amount,
  }: z.infer<typeof formSchema>) => {
    if (!mintAccount)
      return toast.error("The token account is not bound to a mint account")

    if (
      Number(amount) >
      Number(mintAccount?.supply || 0) / 10 ** (mintAccount?.decimals || 1)
    )
      return toast.error("Insufficient balance")

    sendSplAsync({
      ata: new PublicKey(ataAccount),
      mint: mintAccount.address,
      to,
      amount: Number(amount),
      decimals: mintAccount.decimals,
    })
  }

  useEffect(() => {
    getAccountInfo()
  }, [ataInputValue])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transfer SPL</CardTitle>
        <CardDescription>
          Current SPL balance:{" "}
          {Number(mintAccount?.supply || 0) /
            10 ** (mintAccount?.decimals || 1)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            {formInputList.map((item) => (
              <FormField
                key={item.id}
                control={form.control}
                name={item.name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{item.label}</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder={item.placeholder}
                        {...field}
                        className="bg-transparent border-zinc-200"
                      />
                    </FormControl>

                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
            ))}
            <CardFooter className="mt-4 p-0">
              <Button className="w-full" disabled={isSendSplPending}>
                {isSendSplPending ? "Loading..." : "Transfer SPL"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export default SendSplCard
