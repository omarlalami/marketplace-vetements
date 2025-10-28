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
  key: string
  url: string
  is_primary: boolean
}

interface ProductVariant {
  id: string
  stock_quantity: number
  price: string // string in API
  attributes: Array<{
    attribute: string
    value: string
  }>
}

interface Product {
  id: string
  slug: string
  name: string
  description: string | null
  price: number
  shop_name: string
  shop_slug: string
  category_name: string
  variants?: ProductVariant[]
  images?: ProductImage[]
}

export default function ProductDetailPage() {
  const params = useParams()
  const productSlug = params.slug as string

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
        const data = await apiClient.getProduct(productSlug)
        //console.log('🟢 produits recu : ', JSON.stringify(data, null, 2))
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
    if (productSlug) fetchProduct()
  }, [productSlug])

  const attributeTypes = Array.from(
    new Set(product?.variants?.flatMap((v) => v.attributes.map((a) => a.attribute)) || [])
  )

  const handleSelectAttribute = (attrName: string, value: string) => {
    setSelectedAttributes((prev) => ({ ...prev, [attrName]: value }))
  }

  const formatPrice = (price: number | string): string => {
    const num = typeof price === 'string' ? parseFloat(price) : price
    if (isNaN(num)) return '0'
    return num % 1 === 0 ? num.toString() : num.toFixed(2)
  }

  // Trouver la variante correspondant à la sélection actuelle
  const selectedVariant = product?.variants?.find((v) =>
    v.attributes.every((a) => selectedAttributes[a.attribute] === a.value)
  )
  
  // ✅ Déterminer si le produit est en rupture de stock
  const isOutOfStock =
    selectedVariant
      ? selectedVariant.stock_quantity <= 0
      : product?.variants?.length === 1 &&
        product.variants[0].stock_quantity <= 0

  // ✅ Correction du prix final
  const finalPrice =
    product && selectedVariant
      ? parseFloat(selectedVariant.price)
      : product?.price || 0

  const handleAddToCart = () => {
    if (!product) return

    if (attributeTypes.length > 0 && attributeTypes.some((a) => !selectedAttributes[a])) {
      alert('Veuillez sélectionner la Couleur/Pointure/Taille avant d’ajouter au panier.')
      return
    }

    if (!selectedVariant && attributeTypes.length > 0) {
      alert("La combinaison choisie n'est pas disponible.")
      return
    }

    // ✅ Add the correct variantId for backend
    addItem({
      productId: product.id,
      variantId: selectedVariant ? selectedVariant.id : product.id, // if simple product, fallback
      name: product.name,
      price: finalPrice,
      image: selectedImage,
      shopName: product.shop_name,
      shopSlug: product.shop_slug,
      selectedVariants: selectedAttributes,
      quantity,
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
                  key={img.key}
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
          {selectedVariant ? (          
            <p className="text-xl text-green-600 font-semibold">
              {formatPrice(finalPrice)} DZD
            </p>
          ) : null}

          {/* Sélection d’attributs */}
          {attributeTypes.length > 0 && (
            <div className="space-y-6">
              {attributeTypes.map((attrName) => {
                const values =
                  product?.variants
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
                        const handleClick = () => handleSelectAttribute(attrName, val)

                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={handleClick}
                            className={`px-4 py-2 rounded-md border text-sm font-medium transition-all 
                              ${
                                isSelected
                                  ? 'border-black bg-black text-white'
                                  : 'border-gray-300 bg-white text-gray-800 hover:border-black'
                              }`}
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

                    {selectedVariant ? (
                      <>
                        <div>
                          <strong>Stock :</strong> {selectedVariant.stock_quantity}
                        </div>
                        <div>
                          <strong>Prix :</strong>{' '}
                          {formatPrice(selectedVariant.price)} DZD
                        </div>
                      </>
                    ) : (
                      <div className="text-gray-500">
                        Cette combinaison n’est pas disponible.
                      </div>
                    )}
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
          <Button
            onClick={handleAddToCart}
            disabled={addedToCart || isOutOfStock}
            className="w-full"
          >
            {isOutOfStock ? (
              <>
                <Shield className="mr-2 h-5 w-5" /> Rupture de stock
              </>
            ) : addedToCart ? (
              <>
                <Check className="mr-2 h-5 w-5" /> Ajouté !
              </>
            ) : (
              <>
                <ShoppingCart className="mr-2 h-5 w-5" /> Ajouter au panier
              </>
            )}
          </Button>


          <Button variant="secondary" size="lg" className="w-full">
            <MessageCircle className="mr-2 h-5 w-5" />
            Contacter le créateur
          </Button>

          <Button variant="outline" size="lg" className="w-full" asChild>
            <Link href={`/shops/${product.shop_slug}`}>Voir la boutique</Link>
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
