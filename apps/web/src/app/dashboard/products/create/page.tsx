
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ImageUpload } from '@/components/ui/image-upload'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { apiClient } from '@/lib/api'
import { ArrowLeft, Plus, X } from 'lucide-react'
import Link from 'next/link'

interface Variant {
  id: string
  name: string
  type: 'size' | 'color' | 'custom'
  value: string
  stockQuantity: number
}

export default function CreateProductPage() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shopId: '',
    categoryId: '',
    price: '',
  })
  
  const [variants, setVariants] = useState<Variant[]>([])
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [shops, setShops] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const router = useRouter()

  // Charger les boutiques et catégories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [shopsData, categoriesData] = await Promise.all([
          apiClient.getMyShops(),
          apiClient.getCategories()
        ])
        setShops(shopsData.shops)
        setCategories(categoriesData.categories)
      } catch (error) {
        console.error('Erreur chargement données:', error)
      }
    }
    fetchData()
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addVariant = (type: 'size' | 'color' | 'custom') => {
    const newVariant: Variant = {
      id: Date.now().toString(),
      name: type === 'size' ? 'Taille' : type === 'color' ? 'Couleur' : 'Variante',
      type,
      value: '',
      stockQuantity: 0
    }
    setVariants(prev => [...prev, newVariant])
  }

  const updateVariant = (id: string, field: keyof Variant, value: string | number) => {
    setVariants(prev => prev.map(variant => 
      variant.id === id ? { ...variant, [field]: value } : variant
    ))
  }

  const removeVariant = (id: string) => {
    setVariants(prev => prev.filter(variant => variant.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Créer le produit
      const productData = {
        name: formData.name,
        description: formData.description,
        shopId: formData.shopId,
        categoryId: formData.categoryId || undefined,
        price: formData.price ? parseFloat(formData.price) : undefined,
        variants: variants.map(v => ({
          name: v.name,
          type: v.type,
          value: v.value,
          stockQuantity: v.stockQuantity
        }))
      }

      const response = await apiClient.createProduct(productData)
      const productId = response.product.id

      // Upload des images si présentes
      if (selectedImages.length > 0) {
        await apiClient.uploadProductImages(productId, selectedImages)
      }

      router.push('/dashboard/products')
    } catch (error: any) {
      setError(error.response?.data?.error || 'Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  const flatCategories = categories.flatMap((category: any) => [
    category,
    ...(category.children || [])
  ])

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/products">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux produits
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Formulaire principal */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations générales</CardTitle>
                <CardDescription>
                  Les informations de base de votre produit
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="name">Nom du produit *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Ex: T-shirt vintage brodé"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Décrivez votre produit, les matériaux, l'inspiration..."
                      rows={4}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Boutique *</Label>
                      <Select 
                        value={formData.shopId} 
                        onValueChange={(value) => handleInputChange('shopId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir une boutique" />
                        </SelectTrigger>
                        <SelectContent>
                          {shops.map((shop: any) => (
                            <SelectItem key={shop.id} value={shop.id}>
                              {shop.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Catégorie</Label>
                      <Select 
                        value={formData.categoryId} 
                        onValueChange={(value) => handleInputChange('categoryId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir une catégorie" />
                        </SelectTrigger>
                        <SelectContent>
                          {flatCategories.map((category: any) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Prix (€)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Variantes */}
            <Card>
              <CardHeader>
                <CardTitle>Variantes</CardTitle>
                <CardDescription>
                  Ajoutez des tailles, couleurs ou autres variantes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => addVariant('size')}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Taille
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => addVariant('color')}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Couleur
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => addVariant('custom')}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Autre
                    </Button>
                  </div>

                  {variants.map((variant) => (
                    <div key={variant.id} className="p-4 border rounded-lg space-y-4">
                      <div className="flex justify-between items-center">
                        <Badge variant="outline">
                          {variant.type === 'size' && '📏 Taille'}
                          {variant.type === 'color' && '🎨 Couleur'}
                          {variant.type === 'custom' && '⚙️ Variante'}
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeVariant(variant.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <Label>Valeur *</Label>
                          <Input
                            value={variant.value}
                            onChange={(e) => updateVariant(variant.id, 'value', e.target.value)}
                            placeholder={
                              variant.type === 'size' ? 'Ex: M, L, XL' : 
                              variant.type === 'color' ? 'Ex: Rouge, Bleu' : 
                              'Ex: Coton, Lin'
                            }
                          />
                        </div>
                        
                        <div>
                          <Label>Stock</Label>
                          <Input
                            type="number"
                            min="0"
                            value={variant.stockQuantity}
                            onChange={(e) => updateVariant(variant.id, 'stockQuantity', parseInt(e.target.value) || 0)}
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {variants.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="mb-2">Aucune variante ajoutée</p>
                      <p className="text-sm">Ajoutez des tailles, couleurs ou autres options pour votre produit</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Images et actions */}
          <div className="space-y-6">
            {/* Upload d'images */}
            <Card>
              <CardHeader>
                <CardTitle>Images du produit</CardTitle>
                <CardDescription>
                  Ajoutez des photos attractives de votre produit
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUpload
                  onImagesChange={setSelectedImages}
                  maxFiles={10}
                  maxSizePerFile={5}
                />
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <Button 
                    onClick={handleSubmit}
                    disabled={loading || !formData.name || !formData.shopId}
                    className="w-full"
                  >
                    {loading ? 'Création...' : 'Créer le produit'}
                  </Button>
                  
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/dashboard/products">
                      Annuler
                    </Link>
                  </Button>

                  {!formData.shopId && (
                    <p className="text-sm text-amber-600 text-center">
                      ⚠️ Vous devez d'abord sélectionner une boutique
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Aperçu */}
            {formData.name && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Aperçu</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="font-medium">{formData.name}</p>
                  {formData.price && (
                    <p className="text-lg font-bold text-green-600">
                      {formData.price}€
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {variants.length} variante{variants.length > 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedImages.length} image{selectedImages.length > 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
