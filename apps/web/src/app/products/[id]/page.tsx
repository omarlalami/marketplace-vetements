'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { apiClient } from '@/lib/api'
import { useCartStore } from '@/stores/cartStore'
import {
  Check,
  MessageCircle,
  ShoppingBag,
  ShoppingCart,
  Shield,
  Truck,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { ClientLayout } from '@/components/layout/ClientLayout'

interface ProductImage {
  id: string
  url: string
  is_primary: boolean
}

interface ProductVariant {
  id: string
  stock_quantity: number
  price_modifier: number
  attributes: Array<{
    attribute: string
    value: string
  }>
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  shop_name: string
  shop_slug: string
  category_name: string
  created_at: string
  variants?: ProductVariant[]
  images?: ProductImage[]
}

export default function ProductDetailPage() {
  const params = useParams()
  const productId = params.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string>('')
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({})
  const [quantity, setQuantity] = useState(1)
  const [error, setError] = useState('')
  const [addedToCart, setAddedToCart] = useState(false)

  const addItem = useCartStore((state) => state.addItem)

  // Charger produit
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        const data = await apiClient.getProduct(productId)
        setProduct(data.product)

        if (data.product.images?.length > 0) {
          const primary = data.product.images.find((img: ProductImage) => img.is_primary)
          setSelectedImage(primary?.url || data.product.images[0].url)
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Produit introuvable')
      } finally {
        setLoading(false)
      }
    }
    if (productId) fetchProduct()
  }, [productId])

  // Extraire les types d’attributs (Couleur, Taille, etc.)
  const attributeTypes = Array.from(
    new Set(product?.variants?.flatMap((v) => v.attributes.map((a) => a.attribute)) || [])
  )

  const handleSelectAttribute = (attrName: string, value: string) => {
    setSelectedAttributes((prev) => ({ ...prev, [attrName]: value }))
  }

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

  // Trouver la variante correspondant à la sélection actuelle
  const selectedVariant = product?.variants?.find((v) =>
    v.attributes.every((a) => selectedAttributes[a.attribute] === a.value)
  )

  const finalPrice =
    product && selectedVariant
      ? (selectedVariant.price_modifier || 0)
      : product?.price

  const handleAddToCart = () => {
    if (!product) return

    if (attributeTypes.length > 0 && attributeTypes.some((a) => !selectedAttributes[a])) {
      alert('Veuillez sélectionner toutes les options avant d’ajouter au panier.')
      return
    }

    addItem({
      productId: product.id,
      name: product.name,
      price: finalPrice || 0,
      image: selectedImage,
      shopName: product.shop_name,
      shopSlug: product.shop_slug,
      selectedVariants: selectedAttributes,
    })

    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  if (loading) return <div className="text-center py-20 text-gray-500">Chargement...</div>

  if (error || !product)
    return (
      <ClientLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Card>
            <CardContent className="text-center p-6">
              <p className="text-red-500 mb-4">{error}</p>
              <Button asChild>
                <Link href="/products">Voir tous les produits</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </ClientLayout>
    )

  return (
    <ClientLayout>
      <main className="container mx-auto px-4 py-8 grid gap-8 lg:grid-cols-2">
        {/* Images */}
        <div>
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
            {selectedImage ? (
              <Image
                src={selectedImage}
                alt={product.name}
                width={600}
                height={600}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <ShoppingBag className="h-12 w-12 opacity-50" />
              </div>
            )}
          </div>

          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 mt-3">
              {product.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img.url)}
                  className={`w-20 h-20 rounded-md overflow-hidden border-2 ${
                    selectedImage === img.url ? 'border-black' : 'border-transparent'
                  }`}
                >
                  <Image
                    src={img.url}
                    alt={product.name}
                    width={100}
                    height={100}
                    className="object-cover w-full h-full"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Infos produit */}
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-xl text-green-600 font-semibold">
            {formatPrice(finalPrice ?? product.price ?? 0)} DZD
          </p>

          {/* Sélection d’attributs façon Nike */}
          {attributeTypes.length > 0 && (
            <div className="space-y-6">
              {attributeTypes.map((attrName) => {
                const values =
                  product?.variants
                    ?.filter((variant) =>
                      Object.entries(selectedAttributes).every(([key, val]) => {
                        if (key === attrName) return true
                        return variant.attributes.some(
                          (a) => a.attribute === key && a.value === val
                        )
                      })
                    )
                    ?.flatMap((variant) =>
                      variant.attributes
                        .filter((a) => a.attribute === attrName)
                        .map((a) => a.value)
                    )
                    ?.filter((v, i, arr) => arr.indexOf(v) === i) || []

                return (
                  <div key={attrName}>
                    <label className="block text-base font-medium mb-2 capitalize">
                      {attrName}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {values.map((val) => {
                        const isSelected = selectedAttributes[attrName] === val

                        const isAvailable = product?.variants?.some((variant) =>
                          variant.attributes.every((a) => {
                            if (a.attribute === attrName) return a.value === val
                            return (
                              !selectedAttributes[a.attribute] ||
                              selectedAttributes[a.attribute] === a.value
                            )
                          }) && variant.stock_quantity > 0
                        )

                        const handleClick = () => {
                          if (isSelected) {
                            setSelectedAttributes((prev) => {
                              const updated = { ...prev }
                              delete updated[attrName]
                              return updated
                            })
                          } else {
                            handleSelectAttribute(attrName, val)
                          }
                        }

                        if (attrName.toLowerCase() === 'couleur') {
                          return (
                            <button
                              key={val}
                              type="button"
                              onClick={handleClick}
                              disabled={!isAvailable}
                              className={`px-4 py-2 rounded-md border text-sm font-medium transition-all 
                                ${
                                  isSelected
                                    ? 'border-black bg-black text-white'
                                    : 'border-gray-300 bg-white text-gray-800 hover:border-black'
                                }
                                ${!isAvailable ? 'opacity-40 cursor-not-allowed' : ''}
                              `}
                            >
                              {val}
                            </button>
                          )
                        }

                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={handleClick}
                            disabled={!isAvailable}
                            className={`px-4 py-2 rounded-md border text-sm font-medium transition-all 
                              ${
                                isSelected
                                  ? 'border-black bg-black text-white'
                                  : 'border-gray-300 bg-white text-gray-800 hover:border-black'
                              }
                              ${!isAvailable ? 'opacity-40 cursor-not-allowed' : ''}
                            `}
                          >
                            {val}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}

              {/* Résumé de la sélection */}
              <div className="mt-6 border-t pt-4 text-sm text-gray-700 space-y-1">
                {Object.keys(selectedAttributes).length > 0 ? (
                  <>
                    <div>
                      <strong>Votre sélection :</strong>{' '}
                      {Object.entries(selectedAttributes)
                        .map(([attr, val]) => `${attr}: ${val}`)
                        .join(', ')}
                    </div>

                    {(() => {
                      const matchedVariant = product?.variants?.find((variant) =>
                        variant.attributes.every(
                          (a) => selectedAttributes[a.attribute] === a.value
                        )
                      )

                      if (matchedVariant) {
                        return (
                          <>
                            <div>
                              <strong>Stock :</strong>{' '}
                              {matchedVariant.stock_quantity}
                            </div>
                            <div>
                              <strong>Prix :</strong>{' '}
                              {formatPrice(matchedVariant.price_modifier)} DZD
                            </div>
                          </>
                        )
                      }

                      return (
                        <div className="text-gray-500">
                          Cette combinaison n’est pas disponible.
                        </div>
                      )
                    })()}
                  </>
                ) : (
                  <div className="text-gray-500">Aucune variante sélectionnée.</div>
                )}
              </div>
            </div>
          )}

          {/* Quantité */}
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              variant="outline"
              size="icon"
            >
              -
            </Button>
            <span>{quantity}</span>
            <Button
              onClick={() => setQuantity(quantity + 1)}
              variant="outline"
              size="icon"
            >
              +
            </Button>
          </div>

          {/* Actions */}
          <Button onClick={handleAddToCart} disabled={addedToCart} className="w-full">
            {addedToCart ? (
              <>
                <Check className="mr-2 h-5 w-5" /> Ajouté !
              </>
            ) : (
              <>
                <ShoppingCart className="mr-2 h-5 w-5" /> Ajouter au panier
              </>
            )}
          </Button>

            <Button 
              variant="secondary" 
              size="lg" 
              className="w-full"
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Contacter le créateur
            </Button>
            
            <Button variant="outline" size="lg" className="w-full" asChild>
              <Link href={`/shops/${product.shop_slug}`}>
                Voir la boutique
              </Link>
            </Button>

          <div className="border-t pt-4 space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" /> Créateur vérifié
            </div>
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-blue-500" /> Livraison personnalisée
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-purple-500" /> Support direct
            </div>
          </div>
        </div>
      </main>
    </ClientLayout>
  )
}
