import React, { useEffect } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient, initializeQueryPersistence } from './queryClient'

export function QueryProvider({ children }) {
  useEffect(() => {
    // Inicializar persistencia del cache al montar
    initializeQueryPersistence()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

export default QueryProvider
