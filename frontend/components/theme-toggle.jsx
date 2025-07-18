"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

// Componente para cambiar entre modo claro y oscuro.
// Esta es la implementación final y correcta.
export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  // La función de toggle ahora simplemente alterna entre 'light' y 'dark'.
  // next-themes se encarga de aplicar los cambios y guardar la preferencia.
  const handleToggle = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <Button variant="outline" size="icon" onClick={handleToggle} aria-label="Cambiar tema">
      <Sun className="h-[1.4rem] w-[1.4rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.4rem] w-[1.4rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Cambiar tema</span>
    </Button>
  )
}
