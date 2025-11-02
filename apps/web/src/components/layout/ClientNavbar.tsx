'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/stores/authStore'
import { useCartStore } from '@/stores/cartStore'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Menu, X, ChevronDown } from 'lucide-react'
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  // 🔹 Charger les catégories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await apiClient.getCategories()
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
    setMobileMenuOpen(false)
  }

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId)
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
    setExpandedCategory(null)
  }

  return (
    <header className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="text-lg md:text-xl font-bold text-primary shrink-0">
            Fashion Market
          </Link>

          {/* Navigation principale (Desktop) */}
          <nav className="hidden lg:flex items-center space-x-1 relative flex-1 justify-center">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="relative group px-3 py-3"
                onMouseEnter={() => setHoveredCategory(cat.id)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <Link
                  href={`/${cat.slug}`}
                  className="font-medium text-gray-700 hover:text-black transition-colors"
                >
                  {cat.name}
                </Link>

                {/* Sous-menu Desktop */}
                {cat.children && cat.children.length > 0 && (
                  <div
                    className={`absolute left-1/2 -translate-x-1/2 top-full mt-0 bg-white border shadow-xl rounded-lg min-w-max transition-all duration-200 ${
                      hoveredCategory === cat.id
                        ? 'opacity-100 visible pointer-events-auto'
                        : 'opacity-0 invisible pointer-events-none'
                    }`}
                    style={{ width: 'max-content', minWidth: '400px' }}
                  >
                    {/* Flèche pointant vers le parent */}
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-t border-l border-gray-300 rotate-45"></div>

                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-6">
                        {cat.children.map((sub: any) => (
                          <div key={sub.id} className="space-y-2">
                            {/* Sous-catégorie principale */}
                            <Link
                              href={`/${sub.slug}`}
                              className="block text-gray-800 font-semibold text-sm hover:text-primary transition-colors"
                            >
                              {sub.name}
                            </Link>

                            {/* Sous-sous-catégories */}
                            {sub.children && sub.children.length > 0 && (
                              <ul className="space-y-1">
                                {sub.children.map((subsub: any) => (
                                  <li key={subsub.id}>
                                    <Link
                                      href={`/products?subcategory=${subsub.slug}`}
                                      className="block text-xs text-gray-600 hover:text-primary hover:translate-x-1 transition-all"
                                    >
                                      → {subsub.name}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Partie droite */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Panier */}
            <Button variant="outline" size="icon" className="relative shrink-0" asChild>
              <Link href="/cart">
                <ShoppingCart className="h-5 w-5" />
                {mounted && totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Link>
            </Button>

            {/* Authentification (Desktop) */}
            <div className="hidden md:flex items-center gap-2">
              {user ? (
                <>
                  <span className="text-sm text-gray-600 hidden lg:block">
                    Bonjour, {user.firstName} !
                  </span>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    Déconnexion
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/login">Se connecter</Link>
                </Button>
              )}
            </div>

            {/* Menu Mobile Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden shrink-0 p-2"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Menu Mobile */}
        {mobileMenuOpen && (
          <nav className="lg:hidden mt-4 pb-4 border-t pt-4 max-h-[70vh] overflow-y-auto">
            {categories.map((cat) => (
              <div key={cat.id} className="mb-1">
                <button
                  onClick={() => toggleCategory(cat.id)}
                  className="w-full flex items-center justify-between px-4 py-3 font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors"
                >
                  <Link
                    href={`/${cat.slug}`}
                    className="flex-1 text-left"
                    onClick={(e) => {
                      if (!cat.children || cat.children.length === 0) {
                        closeMobileMenu()
                      }
                    }}
                  >
                    {cat.name}
                  </Link>
                  {cat.children && cat.children.length > 0 && (
                    <ChevronDown
                      className={`h-5 w-5 text-gray-500 transition-transform ${
                        expandedCategory === cat.id ? 'rotate-180' : ''
                      }`}
                    />
                  )}
                </button>

                {/* Sous-catégories Mobile */}
                {expandedCategory === cat.id && cat.children && cat.children.length > 0 && (
                  <div className="bg-gray-50 rounded-lg mt-1 mx-2 overflow-hidden">
                    {cat.children.map((sub: any, index: number) => (
                      <div key={sub.id} className={index !== cat.children.length - 1 ? 'border-b' : ''}>
                        {/* Sous-catégorie */}
                        <Link
                          href={`/${sub.slug}`}
                          className="block px-4 py-3 text-gray-700 font-medium hover:bg-white hover:text-primary transition-colors text-sm"
                          onClick={closeMobileMenu}
                        >
                          {sub.name}
                        </Link>

                        {/* Sous-sous-catégories */}
                        {sub.children && sub.children.length > 0 && (
                          <div className="bg-gray-100 px-4 py-2 space-y-2">
                            {sub.children.map((subsub: any) => (
                              <Link
                                key={subsub.id}
                                href={`/products?subcategory=${subsub.slug}`}
                                className="block text-gray-600 hover:text-primary transition-colors text-xs py-1"
                                onClick={closeMobileMenu}
                              >
                                • {subsub.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Authentification Mobile */}
            <div className="mt-4 pt-4 border-t space-y-2">
              {user ? (
                <>
                  <p className="px-4 text-sm text-gray-600 mb-3">
                    Bonjour, {user.firstName} !
                  </p>
                  <Button variant="outline" size="sm" className="w-11/12 mx-auto block" asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                  <Button variant="outline" size="sm" className="w-11/12 mx-auto block" onClick={handleLogout}>
                    Déconnexion
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" className="w-11/12 mx-auto block" asChild>
                  <Link href="/login">Se connecter</Link>
                </Button>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}