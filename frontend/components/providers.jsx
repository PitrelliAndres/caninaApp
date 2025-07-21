"use client"

import { ThemeProvider } from "@/components/theme-provider"
import { ReduxProvider } from "@/lib/redux/provider"
import { GoogleOAuthProvider } from '@react-oauth/google'
import '@/lib/i18n' // Importar i18n aquí

export function Providers({ children }) {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
      <ReduxProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </ReduxProvider>
    </GoogleOAuthProvider>
  )
}