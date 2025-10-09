'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/authStore'
import { apiClient } from '@/lib/api'
import { 
  ArrowRight, 
  Search, 
  TrendingUp, 
  Users, 
  Palette,
  Heart,
  ShoppingBag
} from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ClientLayout } from '@/components/layout/ClientLayout'

export default function HomePage() {
//  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
//  const [featuredProducts, setFeaturedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const { user, logout } = useAuthStore()
  const handleLogout = () => {
    logout()
    router.push('/')
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ productsData] = await Promise.all([
          apiClient.getProducts({ limit: 6 })
        ])
//        setCategories(categoriesData.categories)
        setProducts(productsData.products)
//        setFeaturedProducts(productsData.products)
      } catch (error) {
        console.error('Erreur:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const features = [
    {
      icon: Palette,
      title: 'Créateurs uniques',
      description: 'Découvrez des designers talentueux et leurs créations originales'
    },
    {
      icon: Users,
      title: 'Communauté créative',
      description: 'Rejoignez une communauté passionnée de mode et de création'
    },
    {
      icon: TrendingUp,
      title: 'Tendances émergentes',
      description: 'Soyez les premiers à découvrir les nouvelles tendances'
    }
  ]

/*   if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Chargement...</p>
        </div>
      </div>
    )
  } */

  return (
  <ClientLayout>
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}

      <main>
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-purple-50 via-white to-blue-50 py-20 sm:py-32">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-4xl mx-auto">

              <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-gray-900 mb-6">
                La marketplace des{' '}
                <span className="bg-gradient-to-r from-green-600 via-gray-400 to-red-600 bg-clip-text text-transparent">
                  créateurs de mode algériens
                </span>
              </h1>

              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Découvrez des pièces uniques créées par des designers passionnés. 
                Soutenez les créateurs indépendants et exprimez votre style authentique.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                <Button size="lg" className="text-lg px-8 py-6" asChild>
                  <Link href="/products">
                    <ShoppingBag className="mr-2 h-5 w-5" />
                    Découvrir les créations
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="text-lg px-8 py-6" asChild>
                  <Link href="/register">
                    <Palette className="mr-2 h-5 w-5" />
                    Devenir créateur
                  </Link>
                </Button>
              </div>

              {/* Barre de recherche */}
              <div className="max-w-md mx-auto">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Rechercher des créations..."
                    className="w-full pl-12 pr-4 py-4 rounded-full border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const query = (e.target as HTMLInputElement).value
                        window.location.href = `/products?search=${encodeURIComponent(query)}`
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 sm:grid-cols-3 max-w-4xl mx-auto">
              {features.map((feature, index) => (
                <div key={index} className="text-center">
                  <div className="mx-auto mb-6 h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg">
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Produits en vedette */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Créations en vedette</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Découvrez une sélection de nos plus belles pièces créées par des designers talentueux
              </p>
            </div>

            {loading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="aspect-square bg-gray-200"></div>
                    <CardContent className="p-4">
                      <div className="h-6 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                      <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {products.slice(0, 6).map((product: any) => (
                  <Card key={product.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
                    <Link href={`/products/${product.id}`}>
                      <div className="aspect-square bg-gray-100 relative overflow-hidden">
                        {product.primary_image ? (
                          <Image
                            src={product.primary_image}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400">
                            <Palette className="h-12 w-12" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <Button size="icon" variant="secondary" className="rounded-full">
                            <Heart className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Link>
                    
                    <CardContent className="p-6">
                      <div className="space-y-2">
                        <Link href={`/products/${product.id}`}>
                          <h3 className="font-semibold text-lg hover:text-primary transition-colors line-clamp-1">
                            {product.name}
                          </h3>
                        </Link>
                        
                        <Link 
                          href={`/shops/${product.shop_slug}`}
                          className="text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                          Par {product.shop_name}
                        </Link>
                        
                        <div className="flex items-center justify-between pt-2">
                          {product.price ? (
                            <span className="text-xl font-bold text-green-600">
                              {product.price}€
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">Prix sur demande</span>
                          )}
                          
                          {product.category_name && (
                            <Badge variant="secondary" className="text-xs">
                              {product.category_name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="text-center mt-12">
              <Button size="lg" asChild>
                <Link href="/products">
                  Voir toutes les créations
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

	    	{/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold mb-4">
                Prêt à partager vos créations ?
              </h2>
              <p className="text-xl mb-8 text-purple-100">
                Rejoignez notre communauté de créateurs et donnez vie à vos idées. 
                Créez votre boutique en quelques minutes et commencez à vendre dès aujourd'hui.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" variant="secondary" className="text-purple-600 hover:text-purple-700" asChild>
                  <Link href="/register">
                    <Users className="mr-2 h-5 w-5" />
                    Créer mon compte
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-purple-600" asChild>
                  <Link href="/products">
                    En savoir plus
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

    </div>
  </ClientLayout>    
  )
}


