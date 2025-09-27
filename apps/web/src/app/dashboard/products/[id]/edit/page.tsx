
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
import { ArrowLeft, Plus, X, Trash2, Save } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface Variant {
  id: string
  name: string
  type: 'size' | 'color' | 'custom'
  value: string
  stockQuantity: number
}

interface ProductImage {
  id: string
  url: string
  is_primary: boolean
}

export default function EditProductPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    price: '',
  })
  
  const [variants, setVariants] = useState<Variant[]>([])
  const [existingImages, setExistingImages] = useState<ProductImage[]>([])
  const [newImages, setNewImages] = useState<File[]>([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Charger les données du produit
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [productData, categoriesData] = await Promise.all([
          apiClient.getProductForEdit(productId),
          apiClient.getCategories()
        ])

        const product = productData.product
        
        setFormData({
          name: product.name || '',
          description: product.description || '',
          categoryId: product.category_id || '',
          price: product.price ? product.price.toString() : '',
        })

        // Convertir les variantes au bon format
        const formattedVariants = (product.variants || []).map((v: any, index: number) => ({
          id: `existing-${index}`,
          name: v.name,
          type: v.type,
          value: v.value,
          stockQuantity: v.stock_quantity
        }))
        setVariants(formattedVariants)

        // Images existantes
        setExistingImages(product.images || [])
        setCategories(categoriesData.categories)
        
      } catch (error: any) {
        setError(error.response?.data?.error || 'Erreur lors du chargement')
        console.error('Erreur chargement produit:', error)
      } finally {
        setLoading(false)
      }
    }

    if (productId) {
      fetchData()
    }
  }, [productId])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addVariant = (type: 'size' | 'color' | 'custom') => {
    const newVariant: Variant = {
      id: `new-${Date.now()}`,
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

  const handleDeleteExistingImage = async (imageId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette image ?')) return

    try {
      await apiClient.deleteProductImage(productId, imageId)
      setExistingImages(prev => prev.filter(img => img.id !== imageId))
    } catch (error) {
      console.error('Erreur suppression image:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      // Mettre à jour le produit
      const productData = {
        name: formData.name,
        description: formData.description,
        categoryId: formData.categoryId || undefined,
        price: formData.price ? parseFloat(formData.price) : undefined,
        variants: variants.map(v => ({
          name: v.name,
          type: v.type,
          value: v.value,
          stockQuantity: v.stockQuantity
        }))
      }

      await apiClient.updateProduct(productId, productData)

      // Upload des nouvelles images si présentes
      if (newImages.length > 0) {
        await apiClient.uploadProductImages(productId, newImages)
      }

      router.push('/dashboard/products')
    } catch (error: any) {
      setError(error.response?.data?.error || 'Erreur lors de la mise à jour')
    } finally {
      setSaving(false)
    }
  }

  const flatCategories = categories.flatMap((category: any) => [
    category,
    ...(category.children || [])
  ])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="h-10 bg-gray-200 rounded"></div>
                    <div className="h-20 bg-gray-200 rounded"></div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="h-10 bg-gray-200 rounded"></div>
                      <div className="h-10 bg-gray-200 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-32 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

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
                <CardTitle>Modifier le produit</CardTitle>
                <CardDescription>
                  Modifiez les informations de votre produit
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
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Variantes */}
            <Card>
              <CardHeader>
                <CardTitle>Variantes</CardTitle>
                <CardDescription>
                  Gérez les tailles, couleurs et autres variantes
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
                      <p className="mb-2">Aucune variante</p>
                      <p className="text-sm">Ajoutez des tailles, couleurs ou autres options</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Images et actions */}
          <div className="space-y-6">
            {/* Images existantes */}
            {existingImages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Images actuelles</CardTitle>
                  <CardDescription>
                    {existingImages.length} image{existingImages.length > 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {existingImages.map((image) => (
                      <div key={image.id} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                          <Image
                            src={image.url}
                            alt="Image produit"
                            fill
                            className="object-cover"
                          />
                        </div>
                        
                        {image.is_primary && (
                          <Badge className="absolute top-2 left-2 text-xs">
                            Principal
                          </Badge>
                        )}
                        
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                          onClick={() => handleDeleteExistingImage(image.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Nouvelles images */}
            <Card>
              <CardHeader>
                <CardTitle>Ajouter des images</CardTitle>
                <CardDescription>
                  Ajoutez de nouvelles photos pour votre produit
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUpload
                  onImagesChange={setNewImages}
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
                    disabled={saving || !formData.name}
                    className="w-full"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
                  </Button>
                  
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/dashboard/products">
                      Annuler
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Aperçu */}
            {formData.name && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Aperçu modifié</CardTitle>
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
                    {existingImages.length + newImages.length} image{(existingImages.length + newImages.length) > 1 ? 's' : ''}
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
