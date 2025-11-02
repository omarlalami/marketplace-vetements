'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { apiClient } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ClientLayout } from '@/components/layout/ClientLayout'
import Image from 'next/image'
import { SidebarResearch } from '@/components/layout/SidebarResearch'

export default function CategoryPage() {
  const params = useParams()
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug

  const [filteredProducts, setFilteredProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // 🔹 Filtres combinés (prix, recherche, shop)
  const [filters, setFilters] = useState<{
    minPrice?: number
    maxPrice?: number
    search: string
    shopSlug: string
  }>({
    minPrice: undefined,
    maxPrice: undefined,
    search: '',
    shopSlug: '',
  })

  // 🟢 Récupération des produits selon les filtres (API côté serveur)
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true)
      try {
        // Construire les params pour l'API
        const apiParams: any = {
          ...(slug && slug !== 'products' && { slug }),
          ...(filters.minPrice !== undefined && { minPrice: filters.minPrice }),
          ...(filters.maxPrice !== undefined && { maxPrice: filters.maxPrice }),
          ...(filters.search && { search: filters.search }),
          ...(filters.shopSlug && { shop: filters.shopSlug }),
        }

        console.log('📡 Appel API avec params:', apiParams)

        const response = await apiClient.getProducts(apiParams)

        console.log('✅ Réponse API:', JSON.stringify(response, null, 2))

        const data =
          response?.data?.products ||
          response?.products ||
          []

        setFilteredProducts(data)
      } catch (err) {
        console.error('Erreur chargement produits:', err)
        setFilteredProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [slug, filters])

  const formatPrice = (price: number | string): string => {
    const num = typeof price === 'string' ? parseFloat(price) : price
    
    if (isNaN(num)) return '0'
    
    if (num === Math.floor(num)) {
      return num.toString()
    }
    
    return num.toFixed(2)
  }

  const handleFilterChange = (newFilters: {
    minPrice?: number
    maxPrice?: number
    search?: string
    shopSlug?: string
  }) => {
    console.log('🔧 Filtres appliqués:', newFilters)
    
    setFilters({
      minPrice: newFilters.minPrice,
      maxPrice: newFilters.maxPrice,
      search: newFilters.search ?? '',
      shopSlug: newFilters.shopSlug ?? '',
    })
  }

  return (
    <ClientLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Layout: Sidebar sur desktop, Filtre modal sur mobile */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar - Filtre */}
          <div className="w-full md:w-64 shrink-0">
            <SidebarResearch onFilterChange={handleFilterChange} />
          </div>

          {/* Produits */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="w-full h-48 sm:h-64 rounded-lg" />
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {filteredProducts.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug || product.id}`}
                    className="group"
                  >
                    <Card className="relative overflow-hidden hover:shadow-lg transition-shadow h-full">
                      <CardHeader className="p-0">
                        <div className="relative w-full h-48 sm:h-64">
                          <Image
                            src={product.primary_image?.url || '/placeholder-product.jpg'}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>

                        {(product.min_price || product.max_price) && (
                          <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                            <Badge className="bg-white text-black hover:bg-white text-xs sm:text-sm">
                              {formatPrice(product.min_price ?? 0)} DZD
                            </Badge>
                          </div>
                        )}
                      </CardHeader>
                      <CardContent className="p-3 sm:p-4">
                        <CardTitle className="text-xs sm:text-sm font-semibold mb-1 line-clamp-2">
                          {product.name}
                        </CardTitle>
                        <p className="text-xs sm:text-sm text-gray-500 line-clamp-2">
                          {product.shop_name}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Aucun produit trouvé pour cette catégorie.
              </p>
            )}
          </div>
        </div>
      </div>
    </ClientLayout>
  )
}