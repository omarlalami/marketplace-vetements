'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { apiClient } from '@/lib/api'
import { 
  ArrowLeft, 
  MapPin,
  Calendar,
  Search,
  Grid,
  List,
  Heart,
  Share2,
  Mail,
  ShoppingBag,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { ClientLayout } from '@/components/layout/ClientLayout'

interface Shop {
  id: string
  name: string
  slug: string
  description: string
  owner_name: string
  created_at: string
  logo_url?: string
}

interface Product {
  id: string
  name: string
  slug: string
  description: string
  category_name: string
  min_price?: number
  max_price?: number
  primary_image?: {
    url: string
    key: string
  } | null
  created_at: string
}

export default function ShopPage() {
  const params = useParams()
  const shopSlug = params.slug as string
  
  const [shop, setShop] = useState<Shop | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchShopData = async () => {
      try {
        setLoading(true)
        const [shopData, productsData] = await Promise.all([
          apiClient.getShop(shopSlug),
          // Utiliser l'API publique des produits avec le slug de la boutique
          apiClient.getProducts({ shop: shopSlug })
        ])
        
        setShop(shopData.shop)
        setProducts(productsData.products || [])
        setFilteredProducts(productsData.products || [])
        console.log('productsData :', JSON.stringify(productsData, null, 2))

      } catch (error: any) {
        setError(error.response?.data?.error || 'Boutique non trouvée')
      } finally {
        setLoading(false)
      }
    }

    if (shopSlug) {
      fetchShopData()
    }
  }, [shopSlug])

  const formatPrice = (price: number | string): string => {
    const num = typeof price === 'string' ? parseFloat(price) : price;
    
    if (isNaN(num)) return '0';

    // Si c'est un nombre entier, pas de décimales
    if (num === Math.floor(num)) {
      return num.toString();
    }

    // Sinon, afficher avec 2 décimales
    return num.toFixed(2);
  }

  // Filtrer les produits
  useEffect(() => {
    if (searchTerm) {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())||
        product.category_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredProducts(filtered)
    } else {
      setFilteredProducts(products)
    }
  }, [searchTerm, products])

  if (loading) {
    return (
      <ClientLayout>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-8">
          {/* En-tête boutique skeleton */}
          <div className="mb-8">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="flex-1 space-y-3">
                <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Grille produits skeleton */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-square bg-gray-200"></div>
                <CardContent className="p-4">
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
      </ClientLayout>
    )
  }

  if (error || !shop) {
    return (
      <ClientLayout>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <div className="text-red-500 mb-4">
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ExternalLink className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Boutique introuvable</h2>
              <p className="text-muted-foreground">{error}</p>
            </div>
            <Button asChild>
              <Link href="/shops">
                Découvrir d'autres créateurs
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      </ClientLayout>
    )
  }

  return (
    <ClientLayout>
    <div className="min-h-screen bg-gray-50">

      <main className="container mx-auto px-4 py-8">

        {/* En-tête de la boutique */}
        <div className="mb-8">
          <div className="bg-white rounded-xl p-8 border">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              {/* Logo/Avatar */}
              <div className="w-24 h-24 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
                {shop.logo_url ? (
                  <Image
                    src={shop.logo_url}
                    alt={shop.name}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                    {shop.name.charAt(0)}
                  </div>
                )}
              </div>

              {/* Informations */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{shop.name}</h1>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <span>{filteredProducts.length} Création{filteredProducts.length > 1 ? 's' : ''} unique{filteredProducts.length > 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    {shop.description && (
                      <p className="text-gray-700 leading-relaxed max-w-2xl">
                        {shop.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Heart className="h-4 w-4 mr-2" />
                      Suivre
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share2 className="h-4 w-4 mr-2" />
                      Partager
                    </Button>
                    <Button size="sm">
                      <Mail className="h-4 w-4 mr-2" />
                      Contacter
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Barre de recherche et contrôles */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              {/* Barre de recherche */}
              <div className="flex-1 max-w-lg w-full relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher un produit dans cette boutique..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-12 py-2 rounded-full border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Compteur + mode d’affichage */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">
                  {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>


        {/* Grille des produits */}
        {filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="text-muted-foreground">
                {searchTerm ? (
                  <>
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">Aucun produit trouvé</p>
                    <p>Aucun produit ne correspond à "{searchTerm}"</p>
                  </>
                ) : (
                  <>
                    <div className="h-12 w-12 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <span className="text-2xl">🎨</span>
                    </div>
                    <p className="text-lg font-medium mb-2">Pas encore de créations</p>
                    <p>Cette boutique n'a pas encore ajouté de produits</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1 max-w-4xl'
          }`}>
            {filteredProducts.map((product) => (
              <Card key={product.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                <Link href={`/products/${product.slug || product.id}`}>
                  {/* Image */}
                  <div className={`bg-gray-100 relative overflow-hidden ${
                    viewMode === 'grid' ? 'aspect-square' : 'h-48 sm:h-32'
                  }`}>
                    {product.primary_image?.url ? (
                      <Image
                        src={product.primary_image.url}
                        alt={product.name}
                        fill
                        priority
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <ShoppingBag className="h-16 w-16 opacity-50 mb-2" />
                        <p className="text-sm">Pas d'image</p>
                      </div>
                    )}
                    
                    {/* Badge prix */}
                    {(product.min_price || product.max_price) && (
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-white text-black hover:bg-white">
                          {formatPrice(product.min_price ?? 0)} DZD
                        </Badge>
                      </div>
                    )}
                    
                    {/* Bouton favoris */}
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="secondary" className="h-8 w-8">
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Link>
                
                {/* Contenu */}
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <Link href={`/products/${product.id}`}>
                      <h3 className="font-semibold text-lg line-clamp-1 hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                    
                    {product.category_name && (
                      <p className="text-sm text-muted-foreground">
                        {product.category_name}
                      </p>
                    )}
                    
                    {product.description && viewMode === 'list' && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {product.description}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
    </ClientLayout>
  )
}