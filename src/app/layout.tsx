import type { Metadata } from "next"

import App from "@/components/provider"
import "./globals.css"
import "@solana/wallet-adapter-react-ui/styles.css"
import Header from "@/components/header"
import { Toaster } from "@/components/ui/sonner"

export const metadata: Metadata = {
  title: "Solana Learning",
  description: "Used only for Solana basic interactions",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <App>
          <Header />
          <main>{children}</main>
          <Toaster />
        </App>
      </body>
    </html>
  )
}
