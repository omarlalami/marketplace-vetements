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

interface AttributeValue {
  id: string
  value: string
}

interface Attribute {
  id: string
  name: string
  values: AttributeValue[]
}

interface VariantAttributeValue {
  value_id: string
  attribute_id: string
  attribute_name: string
  value: string
}

interface Variant {
  id: string
  stock_quantity: number
  price: number
  attributes: VariantAttributeValue[]
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
  })
  
  const [variants, setVariants] = useState<Variant[]>([])
  const [existingImages, setExistingImages] = useState<ProductImage[]>([])
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([])
  const [newImages, setNewImages] = useState<File[]>([])
  const [categories, setCategories] = useState([])
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Charger les données du produit
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [productData, categoriesData, attributesData] = await Promise.all([
          apiClient.getProduct(productId),
          apiClient.getCategories(),
          apiClient.getAttributes()
        ])

        //console.log("produit get for edit", JSON.stringify( await apiClient.getProductForEdit(productId), null, 2))
        //console.log("produit get classic", JSON.stringify( await apiClient.getProduct(productId), null, 2))

        const product = productData.product
        
        setFormData({
          name: product.name || '',
          description: product.description || '',
          categoryId: product.category_id || '',
        })

        // Convertir les variantes au bon format
        const formattedVariants = (product.variants || []).map((v: any) => ({
          id: v.id || `temp-${Date.now()}-${Math.random()}`,
          stock_quantity: v.stock_quantity || 0,
          price: parseFloat(v.price || '0'),
          attributes: (v.attributes || []).map((attr: any) => ({
            value_id: attr.value_id,
            attribute_id: attr.value_id || '',
            attribute_name: attr.attribute || '',
            value: attr.value
          }))
        }))
        setVariants(formattedVariants)

        // Images existantes
        // ✅ Use images from getProduct
        const formattedImages = (product.images || []).map((img: any, index: number) => ({
          id: img.key,
          url: img.url,
          is_primary: index === 0 // mark the first image as primary if needed
        }))
        setExistingImages(formattedImages)
        setCategories(categoriesData.categories)
        setAttributes(attributesData.attributes)
        
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

  const addVariant = () => {
    const newVariant: Variant = {
      id: `new-${Date.now()}-${Math.random()}`,
      stock_quantity: 0,
      price: 0,
      attributes: []
    }
    setVariants(prev => [...prev, newVariant])
  }

  const removeVariant = (id: string) => {
    setVariants(prev => prev.filter(variant => variant.id !== id))
  }

  const updateVariantField = (variantId: string, field: 'stock_quantity' | 'price', value: number) => {
    setVariants(prev => prev.map(variant => 
      variant.id === variantId ? { ...variant, [field]: value } : variant
    ))
  }

  const addAttributeToVariant = (variantId: string, attributeId: string) => {
    const attribute = attributes.find(attr => attr.id === attributeId)
    if (!attribute || attribute.values.length === 0) return

    const newAttr: VariantAttributeValue = {
      value_id: attribute.values[0].id,
      attribute_id: attributeId,
      attribute_name: attribute.name,
      value: attribute.values[0].value
    }

    setVariants(prev => prev.map(variant => {
      if (variant.id !== variantId) return variant
      
      // Vérifier si l'attribut existe déjà
      const hasAttribute = variant.attributes.some(attr => attr.attribute_id === attributeId)
      if (hasAttribute) return variant

      return {
        ...variant,
        attributes: [...variant.attributes, newAttr]
      }
    }))
  }

  const updateVariantAttribute = (variantId: string, attributeId: string, valueId: string) => {
    const attribute = attributes.find(attr => attr.id === attributeId)
    const attributeValue = attribute?.values.find(val => val.id === valueId)
    
    if (!attributeValue) return

    setVariants(prev => prev.map(variant => {
      if (variant.id !== variantId) return variant

      return {
        ...variant,
        attributes: variant.attributes.map(attr => 
          attr.attribute_id === attributeId 
            ? { ...attr, value_id: valueId, value: attributeValue.value }
            : attr
        )
      }
    }))
  }

  const removeAttributeFromVariant = (variantId: string, attributeId: string) => {
    setVariants(prev => prev.map(variant => {
      if (variant.id !== variantId) return variant

      return {
        ...variant,
        attributes: variant.attributes.filter(attr => attr.attribute_id !== attributeId)
      }
    }))
  }

  const handleDeleteExistingImage = async (imageKey: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette image ?')) return

    // Retirer visuellement l’image
    setExistingImages(prev => prev.filter(img => img.id !== imageKey))

    // Marquer pour suppression lors du "save"
    setImagesToDelete(prev => [...prev, imageKey])
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
        variants: variants.map(v => ({
          id: v.id, // ✅ Envoie aussi l’ID de la variante
          stockQuantity: v.stock_quantity,
          price: v.price,
          attributes: v.attributes.map(attr => attr.value_id)
        }))
      }
      //console.log("donne envoyer du formulaire")
      //console.log(productData)
      await apiClient.updateProduct(productId, productData)

      // 2️⃣ Supprimer les images marquées
      for (const imageKey of imagesToDelete) {
        try {
          await apiClient.deleteProductImage(productId, imageKey)
        } catch (err) {
          console.error("Erreur suppression différée:", err)
        }
      }

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

  const getAvailableAttributes = (variant: Variant) => {
    const usedAttributeIds = variant.attributes.map(attr => attr.attribute_id)
    return attributes.filter(attr => !usedAttributeIds.includes(attr.id))
  }

  const getAttributeIcon = (attributeName: string) => {
    const name = attributeName.toLowerCase()
    if (name.includes('size') || name.includes('taille')) return '📏'
    if (name.includes('color') || name.includes('couleur')) return '🎨'
    if (name.includes('pointure')) return '👟'
    return '⚙️'
  }

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

                   {/* A REMPLACER PAR SELECTION BOUTIQUE
                    <div className="space-y-2">
                      <Label htmlFor="price">Prix de base (DZD)</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formatPrice(formData.price)}
                        onChange={(e) => handleInputChange('price', e.target.value)}
                        onBlur={(e) => {
                          // Formater quand l'utilisateur quitte le champ
                          const formatted = formatPrice(e.target.value);
                          handleInputChange('price', formatted);
                        }}
                        placeholder="0.00"
                      />
                    </div> */}
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Variantes */}
            <Card>
              <CardHeader>
                <CardTitle>Variantes</CardTitle>
                <CardDescription>
                  Gérez les combinaisons d'attributs (taille, couleur, etc.)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={addVariant}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter une finition
                  </Button>

                  {variants.map((variant, index) => (
                    <div key={variant.id} className="p-4 border rounded-lg space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">Finition {index + 1} dispo en : </span>
                          {variant.attributes.map(attr => (
                            <Badge key={attr.attribute_id} variant="secondary" className="text-xs">
                              {getAttributeIcon(attr.attribute_name)} {attr.value}
                            </Badge>
                          ))}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeVariant(variant.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      
                      {/* Attributs de la variante */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Attributs</Label>
                        
                        {variant.attributes.map((attr) => {
                          const attribute = attributes.find(a => a.id === attr.attribute_id)
                          if (!attribute) return null

                          return (
                            <div key={attr.attribute_id} className="flex gap-2 items-center">
                              <div className="flex-1">
                                <Select
                                  value={attr.value_id}
                                  onValueChange={(value) => updateVariantAttribute(variant.id, attr.attribute_id, value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue>
                                      {getAttributeIcon(attr.attribute_name)} {attr.attribute_name}: {attr.value}
                                    </SelectValue>
                                  </SelectTrigger>
                                  <SelectContent>
                                    {attribute.values.map((val) => (
                                      <SelectItem key={val.id} value={val.id}>
                                        {val.value}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeAttributeFromVariant(variant.id, attr.attribute_id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )
                        })}

                        {/* Ajouter un attribut */}
                        {getAvailableAttributes(variant).length > 0 && (
                          <Select
                            value=""
                            onValueChange={(value) => addAttributeToVariant(variant.id, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="+ Ajouter un attribut" />
                            </SelectTrigger>
                            <SelectContent>
                              {getAvailableAttributes(variant).map((attr) => (
                                <SelectItem key={attr.id} value={attr.id}>
                                  {getAttributeIcon(attr.name)} {attr.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>

                      {/* Stock et prix */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <Label>Stock</Label>
                          <Input
                            type="number"
                            min="0"
                            value={variant.stock_quantity}
                            onChange={(e) => updateVariantField(variant.id, 'stock_quantity', parseInt(e.target.value) || 0)}
                            placeholder="0"
                          />
                        </div>
                        
                        <div>
                          <Label>Prix</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={variant.price}
                            onChange={(e) => updateVariantField(variant.id, 'price', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                          />

                        </div>
                      </div>
                    </div>
                  ))}

                  {variants.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="mb-2">Aucune variante</p>
                      <p className="text-sm">Ajoutez des variantes pour gérer le stock par taille, couleur, etc.</p>
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
            {existingImages.length < 3 && (
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
                  maxFiles={3 - existingImages.length}
                  maxSizePerFile={5}
                />
              </CardContent>
            </Card>
            )}

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

          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}