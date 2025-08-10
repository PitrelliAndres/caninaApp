"use client"

import { Button } from "@/components/ui/button"
import { PawPrint, CheckCircle } from 'lucide-react'
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageSelector } from "@/components/language-selector"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useGoogleLogin } from '@react-oauth/google'
import { useTranslation } from 'react-i18next'

export default function LoginPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const { login } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const googleLogin = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      try {
        setLoading(true)
        
        // El token de acceso viene en codeResponse.access_token
        const result = await login(codeResponse.access_token)
        
        if (result.user.onboarded) {
          router.push("/")
        } else {
          router.push("/onboarding")
        }
      } catch (error) {
        toast({
          title: t('auth.loginError'),
          description: error.message || t('errors.generic'),
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    },
    onError: (error) => {
      console.error('Login Failed:', error)
      toast({
        title: t('auth.loginError'),
        description: t('errors.network'),
        variant: "destructive"
      })
    },
    scope: 'openid email profile'
  })

  const features = [
    t('auth.features.registerVisits'),
    t('auth.features.meetOwners'),
    t('auth.features.matchInterests'),
    t('auth.features.chatCoordinate'),
  ]

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6">
      <div className="absolute top-4 right-4">
        <LanguageSelector />
        <ThemeToggle />
      </div>
      <div className="text-center max-w-lg w-full">
        <div className="inline-flex items-center justify-center p-4 bg-blue-100 rounded-full mb-6">
          <PawPrint className="h-16 w-16 text-blue-600" />
        </div>
        <h1 className="text-5xl font-bold mb-4">{t('auth.loginTitle')}</h1>
        <p className="mt-3 text-lg md:text-xl text-muted-foreground">
          {t('auth.loginSubtitle')}
        </p>

        <div className="mt-8 text-left bg-muted/50 p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4 text-center">{t('auth.whatCanYouDo')}</h2>
          <ul className="space-y-3">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center text-base">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8">
          <Button 
            onClick={() => googleLogin()}
            size="lg" 
            className="text-lg px-8 py-6 w-full sm:w-auto"
            disabled={loading}
          >
            {loading ? (
              <>{t('auth.loggingIn')}</>
            ) : (
              <>
                <svg className="w-6 h-6 mr-3" viewBox="0 0 48 48">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  ></path>
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  ></path>
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  ></path>
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  ></path>
                  <path fill="none" d="M0 0h48v48H0z"></path>
                </svg>
                {t('auth.loginWithGoogle')}
              </>
            )}
          </Button>
          <p className="mt-4 text-xs text-muted-foreground">
            {t('auth.termsAccept')}
          </p>
        </div>
      </div>
    </div>
  )
}
