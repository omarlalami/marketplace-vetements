'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { apiClient } from '@/lib/api'
import { useCartStore } from '@/stores/cartStore'
import { 
  ArrowLeft, 
  Heart, 
  Share2, 
  Star,
  ShoppingBag,
  Truck,
  Shield,
  MessageCircle,
  ShoppingCart,
  Check
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { ClientLayout } from '@/components/layout/ClientLayout'

interface ProductImage {
  id: string
  url: string
  is_primary: boolean
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
  variants?: Array<{
    id: string
    name: string
    type: string
    value: string
    stock_quantity: number
  }>
  images?: ProductImage[]
}

export default function ProductDetailPage() {
  const params = useParams()
  const productId = params.id as string
  
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string>('')
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [addedToCart, setAddedToCart] = useState(false)

  // Zustand store
  const addItem = useCartStore((state) => state.addItem)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        const data = await apiClient.getProduct(productId)
        setProduct(data.product)
        
        // Définir l'image sélectionnée par défaut
        if (data.product.images?.length > 0) {
          const primaryImage = data.product.images.find((img: ProductImage) => img.is_primary)
          setSelectedImage(primaryImage?.url || data.product.images[0].url)
        }
      } catch (error: any) {
        setError(error.response?.data?.error || 'Produit non trouvé')
      } finally {
        setLoading(false)
      }
    }

    if (productId) {
      fetchProduct()
    }
  }, [productId])

  const handleVariantChange = (type: string, value: string) => {
    setSelectedVariants(prev => ({
      ...prev,
      [type]: value
    }))
  }

  const handleAddToCart = () => {
    if (!product) return

    // Vérifier si toutes les variantes sont sélectionnées
    const variantTypes = [...new Set(product.variants?.map(v => v.type) || [])]
    if (variantTypes.length > 0 && variantTypes.some(type => !selectedVariants[type])) {
      alert('Veuillez sélectionner toutes les options disponibles')
      return
    }

    // Ajouter au panier
    for (let i = 0; i < quantity; i++) {
      addItem({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: selectedImage,
        shopName: product.shop_name,
        shopSlug: product.shop_slug,
        selectedVariants: Object.keys(selectedVariants).length > 0 ? selectedVariants : undefined
      })
    }

    // Animation de confirmation
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  const getVariantsByType = (type: string) => {
    return product?.variants?.filter(v => v.type === type) || []
  }

  const variantTypes = [...new Set(product?.variants?.map(v => v.type) || [])]

  if (loading) {
    return (
      <ClientLayout>
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-4 py-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="aspect-square bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="space-y-6">
              <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
              </div>
            </div>
          </div>
        </main>
      </div>
      </ClientLayout>
    )
  }

  if (error || !product) {
    return (
      <ClientLayout>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <div className="text-red-500 mb-4">
              <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h2 className="text-xl font-semibold mb-2">Produit introuvable</h2>
              <p className="text-muted-foreground">{error}</p>
            </div>
            <Button asChild>
              <Link href="/products">
                Voir tous les produits
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      </ClientLayout>
    )
  }

  const images = product.images || []
  const hasMultipleImages = images.length > 1

  return (
    <ClientLayout>
    <div className="min-h-screen bg-gray-50">

      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/products">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux produits
            </Link>
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-2 xl:grid-cols-5">
          {/* Galerie d'images */}
          <div className="xl:col-span-3">
            <div className="space-y-4">
              {/* Image principale */}
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                {selectedImage ? (
                  <Image
                    src={selectedImage}
                    alt={product.name}
                    width={800}
                    height={800}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-center">
                      <ShoppingBag className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p>Aucune image disponible</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Miniatures */}
              {hasMultipleImages && (
                <div className="grid grid-cols-4 gap-2">
                  {images.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => setSelectedImage(image.url)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedImage === image.url 
                          ? 'border-primary' 
                          : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <Image
                        src={image.url}
                        alt={`${product.name} ${index + 1}`}
                        width={100}
                        height={100}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Informations produit */}
          <div className="xl:col-span-2">
            <div className="space-y-6">
              {/* En-tête */}
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Link 
                    href={`/shops/${product.shop_slug}`}
                    className="hover:text-primary transition-colors font-medium"
                  >
                    {product.shop_name}
                  </Link>
                  {product.category_name && (
                    <>
                      <span>•</span>
                      <span>{product.category_name}</span>
                    </>
                  )}
                </div>
                
                <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
                
                {product.price ? (
                  <div className="text-3xl font-bold text-green-600 mb-6">
                    {product.price}€
                  </div>
                ) : (
                  <div className="text-lg text-muted-foreground mb-6">
                    Prix sur demande
                  </div>
                )}
              </div>

              {/* Actions rapides */}
              <div className="flex gap-3">
                <Button variant="outline" size="icon">
                  <Heart className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="icon">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>

              {/* Variantes */}
              {variantTypes.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Options disponibles</h3>
                  {variantTypes.map((type) => {
                    const variants = getVariantsByType(type)
                    const typeLabel = type === 'size' ? 'Taille' : type === 'color' ? 'Couleur' : 'Option'
                    
                    return (
                      <div key={type} className="space-y-2">
                        <label className="text-sm font-medium">{typeLabel}</label>
                        <Select
                          value={selectedVariants[type] || ''}
                          onValueChange={(value) => handleVariantChange(type, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={`Choisir ${typeLabel.toLowerCase()}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {variants.map((variant) => (
                              <SelectItem key={variant.id} value={variant.value}>
                                <div className="flex justify-between items-center w-full">
                                  <span>{variant.value}</span>
                                  <span className="text-xs text-muted-foreground ml-2">
                                    Stock: {variant.stock_quantity}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Quantité */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Quantité</label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    -
                  </Button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* Actions principales */}
              <div className="space-y-3">
                <Button 
                  size="lg" 
                  className="w-full"
                  onClick={handleAddToCart}
                  disabled={addedToCart}
                >
                  {addedToCart ? (
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
              </div>

              {/* Garanties */}
              <div className="border-t pt-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Shield className="h-5 w-5 text-green-600" />
                    <span>Créateur vérifié</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Truck className="h-5 w-5 text-blue-600" />
                    <span>Livraison personnalisée</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <MessageCircle className="h-5 w-5 text-purple-600" />
                    <span>Support créateur direct</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-3">Description</h3>
                  <div className="prose prose-sm max-w-none text-muted-foreground">
                    {product.description.split('\n').map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Informations */}
              <div className="border-t pt-6">
                <h3 className="font-semibold mb-3">Informations produit</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Créé le</span>
                    <span>{new Date(product.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                  {product.category_name && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Catégorie</span>
                      <span>{product.category_name}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Référence</span>
                    <span className="font-mono text-xs">{product.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
    </ClientLayout>
  )
}