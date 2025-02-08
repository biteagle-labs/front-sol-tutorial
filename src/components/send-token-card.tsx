import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { ComponentProps } from "react"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { isSolAddress } from "@/utils/address"
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
import { useTx } from "@/hooks/use-transaction"
import { cn } from "@/lib/utils"

export const SendTokenCard = ({
  className,
  ...props
}: ComponentProps<typeof Card>) => {
  const { isSendingSol, sendSolAsync } = useTx()

  const formInputList = [
    { id: 1, name: "address", label: "Address" },
    { id: 2, name: "amount", label: "Amount of SOL to send" },
  ] as const

  const formSchema = z.object({
    address: z.string().refine((value) => !value || isSolAddress(value), {
      message: "Invalid address",
    }),
    amount: z.string().min(0.000001, { message: "Amount too small" }),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      address: "",
      amount: "",
    },
  })

  const handleSubmit = ({ address, amount }: z.infer<typeof formSchema>) => {
    sendSolAsync({ address, amount: Number(amount) })
  }

  return (
    <Card className={cn("w-full", className)} {...props}>
      <CardHeader>
        <CardTitle>{"Send SOL"}</CardTitle>
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

            <CardFooter className="p-0">
              <Button disabled={isSendingSol} className="w-full">
                {isSendingSol ? "Loading..." : "Submit"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export default SendTokenCard
