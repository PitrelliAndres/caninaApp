import { Inter } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import { Providers } from "@/components/providers"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "ParkDog",
  description: "Conecta con otros dueños de perros en tu zona.",
  generator: 'v0.dev'
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.className)}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}