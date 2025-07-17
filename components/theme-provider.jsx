"use client"
import { ThemeProvider as NextThemesProvider } from "next-themes"

// Este es el componente proveedor estándar para next-themes.
// Envuelve la aplicación y le da a todos los componentes hijos
// el contexto necesario para saber cuál es el tema actual.
export function ThemeProvider({ children, ...props }) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
