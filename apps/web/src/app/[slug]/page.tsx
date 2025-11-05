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

const ITEMS_PER_PAGE = 20
const MAX_PRICE = 1000000

// 🔐 Validation du slug de catégorie
const validateCategorySlug = (slug: any): string | null => {
  if (!slug) return null
  
  const slugStr = Array.isArray(slug) ? slug[0] : slug
  
  // Vérifier que le slug respecte un format valide
  if (!/^[a-z0-9-]+$/.test(slugStr) && slugStr !== 'products') {
    return null
  }
  
  return slugStr
}

// 🔐 Validation des prix
const validatePrice = (price: number | undefined): number | undefined => {
  if (price === undefined) return undefined
  
  if (isNaN(price) || price < 0 || price > MAX_PRICE) {
    return undefined
  }
  
  return price
}

export default function CategoryPage() {
  const params = useParams()
  
  // 🔐 Valider le slug dès le départ
  const slug = validateCategorySlug(params?.slug) || 'products'

  const [filteredProducts, setFilteredProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [page, setPage] = useState(1)

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
      setError('')
      
      try {
        // 🔐 Valider les prix avant l'appel API
        const validatedMinPrice = validatePrice(filters.minPrice)
        const validatedMaxPrice = validatePrice(filters.maxPrice)

        // 🔐 Vérifier que minPrice <= maxPrice
        if (
          validatedMinPrice !== undefined &&
          validatedMaxPrice !== undefined &&
          validatedMinPrice > validatedMaxPrice
        ) {
          setError('Erreur de validation des prix')
          setFilteredProducts([])
          setLoading(false)
          return
        }

        // Construire les params pour l'API
        const apiParams: any = {
          ...(slug && slug !== 'products' && { slug }),
          ...(validatedMinPrice !== undefined && { minPrice: validatedMinPrice }),
          ...(validatedMaxPrice !== undefined && { maxPrice: validatedMaxPrice }),
          ...(filters.search && { search: filters.search }),
          ...(filters.shopSlug && { shop: filters.shopSlug }),
          limit: ITEMS_PER_PAGE,
          page: page,
        }

        const response = await apiClient.getProducts(apiParams)

        if (!response.ok && response.ok !== undefined) {
          setError(response.message || 'Erreur lors du chargement des produits')
          setFilteredProducts([])
          return
        }

        const data =
          response?.data?.products ||
          response?.products ||
          []

        // 🔐 Valider que c'est bien un tableau
        if (!Array.isArray(data)) {
          setFilteredProducts([])
          return
        }

        setFilteredProducts(data)
      } catch (err) {
        console.error('Erreur chargement produits:', err)
        setError('Une erreur est survenue lors du chargement des produits')
        setFilteredProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [slug, filters, page])

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
    
    // 🔐 Valider les prix reçus
    const validatedMinPrice = validatePrice(newFilters.minPrice)
    const validatedMaxPrice = validatePrice(newFilters.maxPrice)

    setFilters({
      minPrice: validatedMinPrice,
      maxPrice: validatedMaxPrice,
      search: newFilters.search ?? '',
      shopSlug: newFilters.shopSlug ?? '',
    })

    // 🔐 Réinitialiser à la page 1 quand les filtres changent
    setPage(1)
  }

  // 🔐 Valider le changement de page
  const handlePageChange = (newPage: number) => {
    if (newPage > 0) {
      setPage(newPage)
    }
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
            {/* 🔴 Afficher les erreurs */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-4 mb-4 text-sm text-red-700">
                ⚠️ {error}
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="w-full h-48 sm:h-64 rounded-lg" />
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <>
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
                              alt={product.name || 'Produit'}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e: any) => {
                                e.currentTarget.src = '/placeholder-product.jpg'
                              }}
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
                            {product.name || 'Produit sans nom'}
                          </CardTitle>
                          <p className="text-xs sm:text-sm text-gray-500 line-clamp-2">
                            {product.shop_name || 'Boutique inconnue'}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>

                {/* 📄 Pagination */}
                <div className="mt-8 flex justify-center items-center gap-2">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Précédent
                  </button>

                  <span className="px-4 py-2">
                    Page {page}
                  </span>

                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={filteredProducts.length < ITEMS_PER_PAGE}
                    className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Suivant
                  </button>
                </div>
              </>
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