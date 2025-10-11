'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/stores/authStore'
import { useCartStore } from '@/stores/cartStore'
import { useRouter } from 'next/navigation'
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/api'

export function ClientNavbar() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const getTotalItems = useCartStore((state) => state.getTotalItems)
  const [totalItems, setTotalItems] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)

  // 🔹 Charger les catégories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await apiClient.getCategories()
        //console.log('Tout les categories recu : ', JSON.stringify(response, null, 2))

        // ✅ Gère plusieurs formats de réponse possibles
        if (response?.data?.categories) {
          setCategories(response.data.categories)
        } else if (response?.categories) {
          setCategories(response.categories)
        } else if (Array.isArray(response)) {
          setCategories(response)
        } else {
          console.warn("⚠️ Format de réponse inattendu :", response)
        }
      } catch (error) {
        console.error('Erreur lors du chargement des catégories :', error)
      }
    }

    fetchCategories()
  }, [])

  //console.log('categories dans variable : ', JSON.stringify(categories, null, 2))


  // 🔹 Gérer le panier
  useEffect(() => {
    setMounted(true)
    setTotalItems(getTotalItems())
  }, [getTotalItems])

  useEffect(() => {
    if (mounted) {
      setTotalItems(getTotalItems())
    }
  }, [getTotalItems, mounted])

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <header className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold text-primary">
          Fashion Market
        </Link>

        {/* Navigation principale */}
        <nav className="hidden md:flex items-center space-x-8 relative">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="relative"
              onMouseEnter={() => setHoveredCategory(cat.id)}
              onMouseLeave={() => setHoveredCategory(null)}
            >
              <Link
                href={`/${cat.slug}`}
                className="font-medium text-gray-700 hover:text-black transition-colors"
              >
                {cat.name}
              </Link>

              {/* Sous-menu (type Nike) */}
              {hoveredCategory === cat.id && cat.children && cat.children.length > 0 && (
                <div className="absolute left-1/2 transform -translate-x-1/2 top-full mt-2 bg-white border-t shadow-lg w-screen max-w-5xl p-6">
                  <div className="grid grid-cols-4 gap-6">
                    {cat.children.map((sub: any) => (
                      <div key={sub.id}>
                        <Link
                          href={`/${sub.slug}`}
                          className="block text-gray-800 font-medium mb-2 hover:text-primary transition-colors"
                        >
                          {sub.name}
                        </Link>
                        {sub.children && sub.children.length > 0 && (
                          <ul className="space-y-1">
                            {sub.children.map((subsub: any) => (
                              <li key={subsub.id}>
                                <Link
                                  href={`/products?subcategory=${subsub.slug}`}
                                  className="block text-sm text-gray-600 hover:text-primary transition-colors"
                                >
                                  {subsub.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Partie droite */}
        <div className="flex items-center gap-4">
          {/* Panier */}
          <Button variant="outline" size="icon" className="relative" asChild>
            <Link href="/cart">
              <ShoppingCart className="h-5 w-5" />
              {mounted && totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
          </Button>

          {/* Authentification */}
          {user ? (
            <div className="flex items-center gap-3">
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
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
