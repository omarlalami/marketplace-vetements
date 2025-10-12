'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { apiClient } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { ClientLayout } from '@/components/layout/ClientLayout'
import Image from 'next/image'
import { SidebarResearch } from '@/components/layout/SidebarResearch'

export default function CategoryPage() {
  const params = useParams()
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug

  const [products, setProducts] = useState<any[]>([])
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])
  const [categoryName, setCategoryName] = useState('')
  const [loading, setLoading] = useState(true)

  // 🔹 Filtres combinés (prix, recherche, shop)
  const [filters, setFilters] = useState({
    minPrice: 0,
    maxPrice: Infinity,
    search: '',
    shopSlug: '',
  })

  // 🟢 Récupération des produits selon la catégorie
  useEffect(() => {
    async function fetchProducts() {
      if (!slug) return
      setLoading(true)
      try {
        const response = await apiClient.getProducts({ slug })
        //console.log('🟢 produits recu : ', JSON.stringify(response, null, 2))

        const data =
          response?.data?.products ||
          response?.data ||
          response?.products ||
          response ||
          []

        setProducts(data)
        setFilteredProducts(data)
        setCategoryName(response?.data?.category?.name || slug)
      } catch (err) {
        console.error('Erreur chargement produits :', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [slug])

  // 🧩 Application des filtres locaux
  useEffect(() => {
    let result = [...products]

    result = result.filter((p) => {
      const price =
        parseFloat(p.price) ||
        parseFloat(p.min_price) ||
        parseFloat(p.max_price) ||
        0

      const matchesPrice =
        price >= (filters.minPrice ?? 0) &&
        price <= (filters.maxPrice ?? Infinity)

      const matchesSearch =
        !filters.search ||
        p.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        p.description?.toLowerCase().includes(filters.search.toLowerCase())

      const matchesShop =
        !filters.shopSlug || p.shop_slug === filters.shopSlug

      return matchesPrice && matchesSearch && matchesShop
    })

    setFilteredProducts(result)
  }, [filters, products])

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

  // 🔄 Callback reçu du composant SidebarResearch
  const handleFilterChange = (newFilters: {
    minPrice?: number
    maxPrice?: number
    search?: string
    shopSlug?: string
  }) => {
    setFilters({
      minPrice: newFilters.minPrice ?? 0,
      maxPrice: newFilters.maxPrice ?? Infinity,
      search: newFilters.search ?? '',
      shopSlug: newFilters.shopSlug ?? '',
    })
  }

  return (
    <ClientLayout>
    <div className="flex flex-col md:flex-row gap-6 container mx-auto px-4 py-8">
      {/* Sidebar */}
      <div className="w-full md:w-64 shrink-0">
        <SidebarResearch onFilterChange={handleFilterChange} />
      </div>

      {/* Produits */}
      <div className="flex-1">
        <h1 className="text-2xl font-bold mb-6 capitalize">
          {categoryName || slug}
        </h1>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="w-full h-64 rounded-lg" />
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug || product.id}`}
                className="group"
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="p-0">
                    <div className="relative w-full h-48">
                      <Image
                        src={product.primary_image?.url || '/placeholder.png'}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <CardTitle className="text-sm font-semibold mb-1">
                      {product.name}
                    </CardTitle>
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {product.description}
                    </p>
                    {product.min_price && (
                      <p className="mt-2 text-primary font-bold">
                        À partir de {formatPrice(product.min_price)} DZD
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">
            Aucun produit trouvé pour cette catégorie.
          </p>
        )}
      </div>
    </div>
    </ClientLayout>
  )
}
