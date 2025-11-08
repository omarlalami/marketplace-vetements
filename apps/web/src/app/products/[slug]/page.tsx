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
  ChevronDown,
  ChevronUp,
  Package,
  Heart,
  Share2,
  AlertCircle,
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
  price: string
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
  const [showDescription, setShowDescription] = useState(true)
  const [showDeliveryInfo, setShowDeliveryInfo] = useState(false)

  const addItem = useCartStore((state) => state.addItem)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        const data = await apiClient.getProduct(productSlug)
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

  // Obtenir tous les types d'attributs uniques
  const attributeTypes = Array.from(
    new Set(product?.variants?.flatMap((v) => v.attributes.map((a) => a.attribute)) || [])
  )

  // Obtenir toutes les valeurs uniques pour un attribut donné
  const getUniqueValuesForAttribute = (attrName: string): string[] => {
    const values = product?.variants
      ?.flatMap((variant) =>
        variant.attributes
          .filter((a) => a.attribute === attrName)
          .map((a) => a.value)
      )
      .filter((v, i, arr) => arr.indexOf(v) === i) || []
    return values
  }

  // Vérifier si une valeur est disponible étant donné les sélections actuelles
  const isValueAvailable = (attrName: string, value: string): boolean => {
    // Créer une sélection temporaire avec cette valeur
    const tempSelection = { ...selectedAttributes, [attrName]: value }
    
    // Vérifier s'il existe au moins un variant qui correspond
    return product?.variants?.some((variant) => {
      return Object.entries(tempSelection).every(([key, val]) => {
        return variant.attributes.some((a) => a.attribute === key && a.value === val)
      })
    }) || false
  }

  // Obtenir le stock pour une combinaison spécifique
  const getStockForValue = (attrName: string, value: string): number => {
    const tempSelection = { ...selectedAttributes, [attrName]: value }
    
    const matchingVariants = product?.variants?.filter((variant) => {
      return Object.entries(tempSelection).every(([key, val]) => {
        return variant.attributes.some((a) => a.attribute === key && a.value === val)
      })
    }) || []

    if (matchingVariants.length === 0) return 0
    return Math.max(...matchingVariants.map(v => v.stock_quantity))
  }

  const handleSelectAttribute = (attrName: string, value: string) => {
    // Si on clique sur la même valeur, on la désélectionne
    if (selectedAttributes[attrName] === value) {
      const newSelection = { ...selectedAttributes }
      delete newSelection[attrName]
      setSelectedAttributes(newSelection)
      return
    }

    const newSelection = { ...selectedAttributes, [attrName]: value }
    
    // Vérifier si cette sélection mène à un variant valide
    const hasValidVariant = product?.variants?.some((variant) => {
      return Object.entries(newSelection).every(([key, val]) => {
        return variant.attributes.some((a) => a.attribute === key && a.value === val)
      })
    })

    if (hasValidVariant) {
      setSelectedAttributes(newSelection)
    } else {
      // Si pas valide, réinitialiser les autres sélections
      setSelectedAttributes({ [attrName]: value })
    }
  }

  const formatPrice = (price: number | string): string => {
    const num = typeof price === 'string' ? parseFloat(price) : price
    if (isNaN(num)) return '0'
    return num.toLocaleString('fr-DZ', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
  }

  // Trouver le variant sélectionné
  const selectedVariant = product?.variants?.find((v) =>
    attributeTypes.every((attrType) => {
      const selectedValue = selectedAttributes[attrType]
      if (!selectedValue) return false
      return v.attributes.some((a) => a.attribute === attrType && a.value === selectedValue)
    })
  )

  // Vérifier si toutes les sélections sont faites
  const allAttributesSelected = attributeTypes.every((attr) => selectedAttributes[attr])

  const isOutOfStock = selectedVariant ? selectedVariant.stock_quantity <= 0 : false

  // Toujours afficher un prix par défaut (le plus bas ou le prix du produit principal)
  const finalPrice = (() => {
    if (selectedVariant) return parseFloat(selectedVariant.price)
    if (product?.variants && product.variants.length > 0) {
      const prices = product.variants.map(v => parseFloat(v.price))
      return Math.min(...prices.filter(p => !isNaN(p)))
    }
    return product?.price || 0
  })()

  const handleAddToCart = () => {
    if (!product) return

    if (!allAttributesSelected) {
      alert('Veuillez sélectionner toutes les options avant d\'ajouter au panier.')
      return
    }

    if (!selectedVariant) {
      alert("La combinaison choisie n'est pas disponible.")
      return
    }

    if (selectedVariant.stock_quantity <= 0) {
      alert("Ce produit est en rupture de stock.")
      return
    }

    addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      name: product.name,
      price: finalPrice,
      image: selectedImage,
      shopName: product.shop_name,
      shopSlug: product.shop_slug,
      selectedVariants: selectedAttributes,
      quantity,
    })

    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2500)
  }

  if (loading)
    return (
      <ClientLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-500">Chargement du produit...</p>
          </div>
        </div>
      </ClientLayout>
    )

  if (error || !product)
    return (
      <ClientLayout>
        <div className="min-h-screen flex items-center justify-center px-4">
          <Card className="max-w-md w-full">
            <CardContent className="text-center p-8">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Produit introuvable</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button asChild className="w-full">
                <Link href="/products">Voir tous les produits</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </ClientLayout>
    )

  return (
    <ClientLayout>
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
          <span className="text-gray-400">{product.category_name}</span>
          <span>/</span>
          <span className="text-gray-900 font-medium">{product.name}</span>
        </nav>

        <div className="grid gap-8 lg:gap-12 lg:grid-cols-2">
          {/* Galerie d'images */}
          <div className="space-y-4">
            <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden relative group">
              {selectedImage ? (
                <>
                  <Image
                    src={selectedImage}
                    alt={product.name}
                    width={700}
                    height={700}
                    className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                    priority
                  />
                  {/* Actions flottantes */}
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="bg-white/90 backdrop-blur-sm hover:bg-white"
                    >
                      <Heart className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="bg-white/90 backdrop-blur-sm hover:bg-white"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <ShoppingBag className="h-16 w-16 opacity-50 mb-2" />
                <p className="text-sm">Pas d'image</p>
              </div>
                
              )}
              {isOutOfStock && allAttributesSelected && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm">
                  <div className="text-center">
                    <div className="bg-red-500 text-white px-8 py-4 rounded-xl font-bold text-xl shadow-lg">
                      Rupture de stock
                    </div>
                    <p className="text-white mt-3 text-sm">Cette combinaison n'est plus disponible</p>
                  </div>
                </div>
              )}
            </div>

            {/* Miniatures */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {product.images.map((img) => (
                  <button
                    key={img.key}
                    onClick={() => setSelectedImage(img.url)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === img.url
                        ? 'border-black ring-2 ring-black ring-offset-2 scale-105'
                        : 'border-gray-200 hover:border-gray-400'
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

          {/* Informations produit */}
          <div className="space-y-6">
            {/* En-tête */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Link
                  href={`/shops/${product.shop_slug}`}
                  className="text-sm font-semibold text-gray-600 hover:text-black transition-colors px-3 py-1 bg-gray-100 rounded-full"
                >
                  {product.shop_name}
                </Link>
              </div>
              
              <h1 className="text-3xl lg:text-4xl font-bold mb-4 leading-tight">
                {product.name}
              </h1>

              {/* Prix */}
              <div className="flex items-baseline gap-3 mb-4">
                <p className="text-4xl font-bold text-gray-900">
                  {formatPrice(finalPrice)} <span className="text-2xl">DZD</span>
                </p>
                {selectedVariant && product.price && selectedVariant.price !== product.price.toString() && (
                  <span className="text-lg text-gray-400 line-through">
                    {formatPrice(product.price)} DZD
                  </span>
                )}
              </div>

              {/* Indicateur de stock */}
              {selectedVariant && (
                <div className="flex items-center gap-2 mb-4">
                  {selectedVariant.stock_quantity === 0 ? (
                    <>
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-red-600 font-medium">
                        Rupture de stock
                      </span>
                    </>
                  ) : selectedVariant.stock_quantity < 5 ? (
                    <>
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-orange-600 font-medium">
                        Plus que {selectedVariant.stock_quantity} en stock - Commandez vite !
                      </span>
                    </>
                  ) : (
                    <>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Sélection des attributs */}
            {attributeTypes.map((attrName) => {
              const values = getUniqueValuesForAttribute(attrName)

              return (
                <div key={attrName} className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-bold uppercase tracking-wider text-gray-700">
                      {attrName}
                    </label>
                    {selectedAttributes[attrName] && (
                      <span className="text-sm font-semibold text-gray-900 px-3 py-1 bg-gray-100 rounded-full">
                        {selectedAttributes[attrName]}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {values.map((val) => {
                      const isSelected = selectedAttributes[attrName] === val
                      const isAvailable = isValueAvailable(attrName, val)
                      const stock = getStockForValue(attrName, val)

                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => isAvailable && handleSelectAttribute(attrName, val)}
                          disabled={!isAvailable}
                          className={`relative px-6 py-3 rounded-xl border-2 font-medium transition-all ${
                            isSelected
                              ? 'border-black bg-black text-white shadow-lg scale-105'
                              : !isAvailable
                              ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed line-through'
                              : 'border-gray-300 bg-white text-gray-800 hover:border-black hover:shadow-md active:scale-95'
                          }`}
                        >
                          {val}
                          {isAvailable && stock < 5 && stock > 0 && !isSelected && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full"></span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                  
                  {!selectedAttributes[attrName] && (
                    <p className="text-xs text-gray-500 mt-2">
                      Veuillez sélectionner une option
                    </p>
                  )}
                </div>
              )
            })}

            {/* Quantité */}
            <div className="flex items-center gap-6 border-t pt-6">
              <span className="text-sm font-bold uppercase tracking-wider text-gray-700">
                Quantité
              </span>
              <div className="flex items-center gap-2 border-2 border-gray-300 rounded-xl overflow-hidden">
                <Button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 hover:bg-gray-100 rounded-none"
                  disabled={quantity <= 1}
                >
                  <span className="text-xl font-bold">−</span>
                </Button>
                <span className="w-16 text-center font-bold text-lg">{quantity}</span>
                <Button
                  onClick={() => setQuantity(quantity + 1)}
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 hover:bg-gray-100 rounded-none"
                  disabled={selectedVariant ? quantity >= selectedVariant.stock_quantity : false}
                >
                  <span className="text-xl font-bold">+</span>
                </Button>
              </div>
              {selectedVariant && quantity >= selectedVariant.stock_quantity && (
                <span className="text-xs text-orange-600 font-medium">
                  Stock maximum atteint
                </span>
              )}
            </div>

            {/* Actions principales */}
            <div className="space-y-3 border-t pt-6">
              <Button
                onClick={handleAddToCart}
                disabled={!allAttributesSelected || addedToCart || isOutOfStock}
                className="w-full h-14 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                size="lg"
              >
                {!allAttributesSelected ? (
                  <>
                    <AlertCircle className="mr-2 h-5 w-5" />
                    Sélectionnez une taille / couleur
                  </>
                ) : isOutOfStock ? (
                  <>
                    <Shield className="mr-2 h-5 w-5" />
                    Rupture de stock
                  </>
                ) : addedToCart ? (
                  <>
                    <Check className="mr-2 h-5 w-5" />
                    Ajouté au panier !
                  </>
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Ajouter au panier
                  </>
                )}
              </Button>

              <Button 
                variant="outline" 
                size="lg" 
                className="w-full h-12 rounded-xl border-2 hover:bg-gray-50"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Contacter le créateur
              </Button>
            </div>

            {/* Badges informatifs */}
            <div className="grid grid-cols-1 gap-3 border-t pt-6">
              <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <Shield className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm text-green-900">
                    Créateur vérifié
                  </p>
                  <p className="text-xs text-green-700 mt-0.5">
                    Produit authentique garanti par {product.shop_name}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                <Truck className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm text-blue-900">
                    Livraison dans toute l'Algérie
                  </p>
                  <p className="text-xs text-blue-700 mt-0.5">
                    Délais et frais selon votre wilaya
                  </p>
                </div>
              </div>
            </div>

            {/* Description dépliable */}
            {product.description && (
              <div className="border-t pt-6">
                <button
                  onClick={() => setShowDescription(!showDescription)}
                  className="flex items-center justify-between w-full text-left font-bold text-lg hover:text-gray-700 transition-colors"
                >
                  <span>Description du produit</span>
                  {showDescription ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>
                {showDescription && (
                  <div className="mt-4 prose prose-sm max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {product.description}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Info livraison dépliable */}
            <div className="border-t pt-6">
              <button
                onClick={() => setShowDeliveryInfo(!showDeliveryInfo)}
                className="flex items-center justify-between w-full text-left font-bold text-lg hover:text-gray-700 transition-colors"
              >
                <span>Livraison & Retours</span>
                {showDeliveryInfo ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </button>
              {showDeliveryInfo && (
                <div className="mt-4 space-y-4 text-sm text-gray-700">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="font-semibold mb-2 flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      Livraison
                    </p>
                    <p className="text-gray-600">
                      Disponible dans toute l'Algérie. Les délais et frais varient selon votre wilaya. 
                      Livraison assurée par nos partenaires de confiance.
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="font-semibold mb-2 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Retours
                    </p>
                    <p className="text-gray-600">
                      Politique de retour définie par le créateur. Contactez {product.shop_name} pour 
                      plus d'informations sur les conditions de retour et d'échange.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Lien boutique */}
            <div className="border-t pt-6">
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full h-14 rounded-xl border-2 hover:bg-gray-50 font-semibold" 
                asChild
              >
                <Link href={`/shops/${product.shop_slug}`} className="flex items-center justify-center gap-2">
                  <Package className="h-5 w-5" />
                  Découvrir tous les produits de {product.shop_name}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </ClientLayout>
  )
}