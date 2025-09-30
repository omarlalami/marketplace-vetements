'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'next/navigation'

export function ClientNavbar() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
    const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-xl font-bold text-primary">
              Fashion Market
            </Link>
            
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/products" className="text-muted-foreground hover:text-foreground transition-colors">
                Produits
              </Link>
              <Link href="/shops" className="text-muted-foreground hover:text-foreground transition-colors">
                Créateurs
              </Link>
            </nav>
            
            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 hidden sm:block">
                    Bonjour, {user.firstName} !
                  </span>
                  <Button variant="outline" asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                  <Button variant="outline" onClick={handleLogout}>
                    Déconnexion
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" asChild>
                    <Link href="/login">Se connecter</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/register">S'inscrire</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>


  )
}