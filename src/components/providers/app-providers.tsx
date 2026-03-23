'use client'

import { ReactFlowProvider } from '@xyflow/react'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ReactFlowProvider>
        {children}
        <Toaster position="bottom-right" richColors />
      </ReactFlowProvider>
    </ThemeProvider>
  )
}
