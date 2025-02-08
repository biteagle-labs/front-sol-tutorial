"use client"

import { useEffect, useState } from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card"
import { isPublicKey } from "@/utils/address"
import { useMintSpl } from "@/hooks/use-mint-spl"
import { Mint } from "@solana/spl-token"
import { PublicKey } from "@solana/web3.js"
import { useDebounce } from "ahooks"
import { useBurnToken } from "@/hooks/use-burn-token"
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

export const BurnTokenCard = () => {
  const { getTokenAccount, getMintAccount } = useMintSpl("all")
  const [mintAccount, setMintAccount] = useState<Mint>()
  const { isLoading, burnToken } = useBurnToken(() => {
    getAccountInfo()
  })

  const getAccountInfo = async () => {
    if (ataInputValue && isPublicKey(ataInputValue)) {
      const ataAccount = await getTokenAccount(new PublicKey(ataInputValue))

      if (ataAccount) {
        const mintAccount = await getMintAccount(ataAccount?.mint)

        setMintAccount(mintAccount)
      }
    }
  }

  const formInputList = [
    { id: 1, name: "ataAccount", label: "Token Account Address (ATA)" },
    { id: 3, name: "amount", label: "Amount of Tokens to Burn" },
  ] as const

  const formSchema = z.object({
    ataAccount: z.string().refine((value) => !value || isPublicKey(value), {
      message: "Invalid address",
    }),
    amount: z.string().min(0.000001, { message: "Amount too small" }),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      ataAccount: "",
      amount: "",
    },
  })

  const handleSubmit = ({ ataAccount, amount }: z.infer<typeof formSchema>) => {
    if (!mintAccount)
      return toast.error("The token account is not bound to a mint account")

    if (
      Number(amount) >
      Number(mintAccount?.supply || 0) / 10 ** (mintAccount?.decimals || 1)
    )
      return toast.error("Insufficient balance")

    burnToken({
      ataAccount,
      mintAccount: mintAccount.address.toBase58(),
      amount: Number(amount),
      decimals: mintAccount.decimals,
    })
  }

  const ataInputValue = useDebounce(form.watch("ataAccount"), { wait: 500 })

  useEffect(() => {
    getAccountInfo()
  }, [ataInputValue])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Burn SPL</CardTitle>
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
              <Button
                className="w-full"
                variant={"destructive"}
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Burn SPL"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export default BurnTokenCard
