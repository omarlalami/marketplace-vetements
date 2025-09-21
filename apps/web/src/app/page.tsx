'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import { apiClient } from '@/lib/api'

export default function HomePage() {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const { user, logout } = useAuthStore()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesData, productsData] = await Promise.all([
          apiClient.getCategories(),
          apiClient.getProducts()
        ])
        setCategories(categoriesData.categories)
        setProducts(productsData.products)
      } catch (error) {
        console.error('Erreur:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Fashion Market V1</h1>
          
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  Bonjour, {user.firstName} !
                </span>
                <Button variant="outline" onClick={logout}>
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
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Bienvenue sur Fashion Market
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            La marketplace des créateurs de vêtements
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg">
              Découvrir les créations
            </Button>
            <Button variant="outline" size="lg">
              Devenir créateur
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Catégories */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">Catégories disponibles</h3>
            {categories.length > 0 ? (
              <div className="space-y-2">
                {categories.map((category: any) => (
                  <div key={category.id} className="flex justify-between p-2 bg-gray-50 rounded">
                    <span>{category.name}</span>
                    <span className="text-sm text-gray-500">
                      {category.product_count} produits
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Aucune catégorie disponible</p>
            )}
          </div>

          {/* Produits */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">Derniers produits</h3>
            {products.length > 0 ? (
              <div className="space-y-3">
                {products.slice(0, 5).map((product: any) => (
                  <div key={product.id} className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-medium">{product.name}</h4>
                    <p className="text-sm text-gray-600">
                      Par {product.shop_name}
                      {product.price && (
                        <span className="ml-2 font-semibold text-green-600">
                          {product.price}€
                        </span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Aucun produit disponible</p>
            )}
          </div>
        </div>

        {/* Status de connexion */}
        <div className="mt-12 bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">🎉 Status de l'application</h3>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div>
              <strong>API:</strong> ✅ Connectée
            </div>
            <div>
              <strong>Catégories:</strong> {categories.length} chargées
            </div>
            <div>
              <strong>Utilisateur:</strong> {user ? '✅ Connecté' : '❌ Non connecté'}
            </div>
          </div>
          
          {!user && (
            <div className="mt-4 p-3 bg-yellow-100 rounded border-l-4 border-yellow-500">
              <p className="text-yellow-800">
                💡 Testez l'inscription/connexion avec les boutons en haut à droite !
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}