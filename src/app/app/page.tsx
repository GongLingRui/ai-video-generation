import { AppClient } from '@/app/app/app-client'
import { Suspense } from 'react'

export default function AppPage() {
  return (
    <Suspense fallback={<div className="h-screen w-screen bg-background" />}>
      <AppClient />
    </Suspense>
  )
}
