'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { apiClient } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import Image from 'next/image'

export default function CategoryPage() {
  const params = useParams()
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug
  const [products, setProducts] = useState<any[]>([])
  const [categoryName, setCategoryName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProducts() {
      if (!slug) return

      setLoading(true)
      try {
        // Appel à ton backend avec slug de catégorie ou sous-catégorie
        const response = await apiClient.getProducts({ slug })
        console.log('🟢 Produits reçus :', response)

        // Détection flexible des formats de réponse
        if (response?.ok && Array.isArray(response.data)) {
          setProducts(response.data)
        } else if (Array.isArray(response)) {
          setProducts(response)
        } else if (response?.products) {
          setProducts(response.products)
        } else {
          console.warn('⚠️ Format de réponse inattendu', response)
        }

        // Définir le nom de la catégorie si dispo
        setCategoryName(response?.data?.category?.name || slug)
      } catch (err) {
        console.error('Erreur chargement produits :', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [slug])

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 capitalize">
        {categoryName || slug}
      </h1>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="w-full h-64 rounded-lg" />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.slug || product.id}`}
              className="group"
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="p-0">
                  <div className="relative w-full h-48">
                    <Image
                      src={product.image_url || '/placeholder.png'}
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
                  {product.price && (
                    <p className="mt-2 text-primary font-bold">
                      {product.price} DA
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">Aucun produit trouvé pour cette catégorie.</p>
      )}
    </div>
  )
}
