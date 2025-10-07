'use client'

import { ReactNode } from 'react'
import { ClientNavbar } from './ClientNavbar'
import { ClientFooter } from './ClientFooter'

interface ClientLayoutProps {
  children: ReactNode
}

export function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ClientNavbar />

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>

      <ClientFooter />
    </div>
  )
}