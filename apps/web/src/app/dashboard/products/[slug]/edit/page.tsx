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
import { ArrowLeft, Plus, X, Trash2, Save, Package, DollarSign, Edit2, Check } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { CategorySelect } from '@/components/ui/categorySelect'

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
  const productSlug = params.slug as string

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
  const [productId, setProductId] = useState('')
  const [editingVariant, setEditingVariant] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table')
  

  // Charger les données du produit
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [productData, categoriesData, attributesData] = await Promise.all([
          apiClient.getProduct(productSlug),
          apiClient.getCategories(),
          apiClient.getAttributes()
        ])

        const product = productData.product
        setProductId(product.id)

        setFormData({
          name: product.name || '',
          description: product.description || '',
          categoryId: product.category_id || '',
        })

        // Convertir les variantes au bon format avec attribute_id correct
        const formattedVariants = (product.variants || []).map((v: any) => ({
          id: v.id || `temp-${Date.now()}-${Math.random()}`,
          stock_quantity: v.stock_quantity || 0,
          price: parseFloat(v.price || '0'),
          attributes: (v.attributes || []).map((attr: any) => {
            // Trouver l'attribute_id correct depuis attributesData
            const foundAttr = attributesData.attributes.find((a: any) => 
              a.name === attr.attribute
            )
            return {
              value_id: attr.value_id,
              attribute_id: foundAttr?.id || '',
              attribute_name: attr.attribute || '',
              value: attr.value
            }
          })
        }))
        setVariants(formattedVariants)

        const formattedImages = (product.images || []).map((img: any, index: number) => ({
          id: img.key,
          url: img.url,
          is_primary: index === 0
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

    if (productSlug) {
      fetchData()
    }
  }, [productSlug])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addVariant = () => {
    const newVariant: Variant = {
      id: `new-${Date.now()}-${Math.random()}`,
      stock_quantity: 0,
      price: 0,
      attributes: []
    }
    setVariants(prev => [...prev, newVariant])
    setEditingVariant(newVariant.id)
  }

  const removeVariant = (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette variante ?')) return
    setVariants(prev => prev.filter(variant => variant.id !== id))
    if (editingVariant === id) setEditingVariant(null)
  }

  const updateVariantField = (variantId: string, field: 'stock_quantity' | 'price', value: number) => {
    setVariants(prev => prev.map(variant => 
      variant.id === variantId ? { ...variant, [field]: value } : variant
    ))
  }

  const updateVariantAttribute = (variantId: string, attributeId: string, valueId: string) => {
    const attribute = attributes.find(attr => attr.id === attributeId)
    const attributeValue = attribute?.values.find(val => val.id === valueId)
    
    if (!attributeValue) return

    setVariants(prev => prev.map(variant => {
      if (variant.id !== variantId) return variant

      const existingAttrIndex = variant.attributes.findIndex(
        attr => attr.attribute_id === attributeId
      )

      if (existingAttrIndex >= 0) {
        const newAttributes = [...variant.attributes]
        newAttributes[existingAttrIndex] = {
          value_id: valueId,
          attribute_id: attributeId,
          attribute_name: attribute?.name ?? '',
          value: attributeValue.value
        }
        return { ...variant, attributes: newAttributes }
      } else {
        return {
          ...variant,
          attributes: [...variant.attributes, {
            value_id: valueId,
            attribute_id: attributeId,
            attribute_name: attribute?.name ?? '',
            value: attributeValue.value
          }]
        }
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
    setExistingImages(prev => prev.filter(img => img.id !== imageKey))
    setImagesToDelete(prev => [...prev, imageKey])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        categoryId: formData.categoryId || undefined,
        variants: variants.map(v => ({
          id: v.id,
          stockQuantity: v.stock_quantity,
          price: v.price,
          attributes: v.attributes.map(attr => attr.value_id)
        }))
      }

      await apiClient.updateProduct(productId, productData)

      for (const imageKey of imagesToDelete) {
        try {
          await apiClient.deleteProductImage(productId, imageKey)
        } catch (err) {
          console.error("Erreur suppression différée:", err)
        }
      }

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

  const getAttributeIcon = (attributeName: string) => {
    const name = attributeName.toLowerCase()
    if (name.includes('size') || name.includes('taille')) return '📏'
    if (name.includes('color') || name.includes('couleur')) return '🎨'
    if (name.includes('pointure')) return '👟'
    return '⚙️'
  }

  const getColorClass = (colorName: string) => {
    const colors: Record<string, string> = {
      'noir': 'bg-black',
      'black': 'bg-black',
      'blanc': 'bg-white border border-gray-300',
      'white': 'bg-white border border-gray-300',
      'rouge': 'bg-red-500',
      'red': 'bg-red-500',
      'bleu': 'bg-blue-500',
      'blue': 'bg-blue-500',
      'vert': 'bg-green-500',
      'green': 'bg-green-500',
      'jaune': 'bg-yellow-400',
      'yellow': 'bg-yellow-400',
      'beige': 'bg-amber-100 border border-amber-300',
      'marron': 'bg-amber-700',
      'brown': 'bg-amber-700',
      'gris': 'bg-gray-400',
      'gray': 'bg-gray-400',
      'rose': 'bg-pink-400',
      'pink': 'bg-pink-400',
    }
    return colors[colorName.toLowerCase()] || 'bg-gray-300'
  }

  const getVariantLabel = (variant: Variant) => {
    if (variant.attributes.length === 0) return 'Nouvelle variante'
    return variant.attributes.map(attr => attr.value).join(' • ')
  }

  const getTotalStock = () => {
    return variants.reduce((sum, v) => sum + v.stock_quantity, 0)
  }

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: 'Rupture', color: 'bg-red-100 text-red-700 border-red-200' }
    if (quantity < 5) return { label: 'Stock faible', color: 'bg-orange-100 text-orange-700 border-orange-200' }
    return { label: 'En stock', color: 'bg-green-100 text-green-700 border-green-200' }
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
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/products">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux produits
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Formulaire principal */}
          <div className="lg:col-span-3 space-y-6">
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
                      <CategorySelect
                        categories={categories}
                        value={formData.categoryId}
                        onChange={(v) => handleInputChange('categoryId', v)}
                        placeholder="Choisir une catégorie"
                      />
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* NOUVELLE SECTION VARIANTES AMÉLIORÉE */}
            <div className="space-y-4">
             
              {/* Section Variantes */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Variantes du produit</CardTitle>
                      <CardDescription>
                        Gérez les différentes déclinaisons de votre produit
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
{/*                       <Button
                        variant={viewMode === 'grid' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                      >
                        Grille
                      </Button> 
                      <Button
                        variant={viewMode === 'table' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('table')}
                      >
                        Tableau
                      </Button>*/}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button onClick={addVariant} variant="outline" className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Ajouter une variante
                    </Button>

                    {viewMode === 'grid' ? (
                      // Vue Grille (Cards)
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {variants.map((variant, index) => {
                          const isEditing = editingVariant === variant.id
                          const colorAttr = variant.attributes.find(a => 
                            a.attribute_name.toLowerCase().includes('couleur') || 
                            a.attribute_name.toLowerCase().includes('color')
                          )

                          return (
                            <Card key={variant.id} className="relative overflow-hidden">
                              {colorAttr && (
                                <div 
                                  className={`absolute left-0 top-0 bottom-0 w-1 ${getColorClass(colorAttr.value)}`}
                                />
                              )}

                              <CardContent className="pt-6 pl-6">
                                <div className="space-y-4">
                                  {/* En-tête */}
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <h4 className="font-semibold text-sm">
                                          Variante {index + 1}
                                        </h4>
                                      </div>
                                      <p className="text-sm text-muted-foreground">
                                        {getVariantLabel(variant)}
                                      </p>
                                    </div>
                                    <div className="flex gap-1">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => setEditingVariant(isEditing ? null : variant.id)}
                                      >
                                        {isEditing ? <Check className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => removeVariant(variant.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Attributs */}
                                  <div className="space-y-2">
                                    {attributes.map(attribute => {
                                      const variantAttr = variant.attributes.find(
                                        a => a.attribute_id === attribute.id
                                      )
                                      const isColor = attribute.name.toLowerCase().includes('couleur') || 
                                                    attribute.name.toLowerCase().includes('color')

                                      return (
                                        <div key={attribute.id} className="space-y-1">
                                          <Label className="text-xs text-muted-foreground">
                                            {getAttributeIcon(attribute.name)} {attribute.name}
                                          </Label>
                                          {isEditing ? (
                                            <div className="flex gap-2">
                                              <Select
                                                value={variantAttr?.value_id || ''}
                                                onValueChange={(value) => 
                                                  updateVariantAttribute(variant.id, attribute.id, value)
                                                }
                                              >
                                                <SelectTrigger className="h-9">
                                                  <SelectValue placeholder={`Choisir ${attribute.name.toLowerCase()}`} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  {attribute.values.map(val => (
                                                    <SelectItem key={val.id} value={val.id}>
                                                      <div className="flex items-center gap-2">
                                                        {isColor && (
                                                          <div className={`h-4 w-4 rounded-full ${getColorClass(val.value)}`} />
                                                        )}
                                                        {val.value}
                                                      </div>
                                                    </SelectItem>
                                                  ))}
                                                </SelectContent>
                                              </Select>
                                              {variantAttr && (
                                                <Button
                                                  type="button"
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-9 w-9"
                                                  onClick={() => removeAttributeFromVariant(variant.id, attribute.id)}
                                                >
                                                  <X className="h-4 w-4" />
                                                </Button>
                                              )}
                                            </div>
                                          ) : (
                                            <div className="flex items-center gap-2">
                                              {isColor && variantAttr && (
                                                <div className={`h-5 w-5 rounded-full ${getColorClass(variantAttr.value)}`} />
                                              )}
                                              <Badge variant="outline" className="font-normal">
                                                {variantAttr?.value || 'Non défini'}
                                              </Badge>
                                            </div>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>

                                  {/* Prix et Stock */}
                                  <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                                    <div className="space-y-1">
                                      <Label className="text-xs text-muted-foreground">Prix (DZD)</Label>
                                      {isEditing ? (
                                        <Input
                                          type="number"
                                          step="0.01"
                                          value={variant.price}
                                          onChange={(e) => updateVariantField(variant.id, 'price', parseFloat(e.target.value) || 0)}
                                          className="h-9"
                                        />
                                      ) : (
                                        <p className="text-lg font-bold">{variant.price.toFixed(2)}</p>
                                      )}
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs text-muted-foreground">Stock</Label>
                                      {isEditing ? (
                                        <Input
                                          type="number"
                                          value={variant.stock_quantity}
                                          onChange={(e) => updateVariantField(variant.id, 'stock_quantity', parseInt(e.target.value) || 0)}
                                          className="h-9"
                                        />
                                      ) : (
                                        <p className="text-lg font-bold">{variant.stock_quantity}</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    ) : (
                      // Vue Tableau avec édition inline
                      <div className="border rounded-lg overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-muted">
                            <tr>
                              <th className="text-left p-3 text-sm font-medium whitespace-nowrap">Variante</th>
                              {attributes.map(attr => (
                                <th key={attr.id} className="text-left p-3 text-sm font-medium whitespace-nowrap">
                                  {getAttributeIcon(attr.name)} {attr.name}
                                </th>
                              ))}
                              <th className="text-left p-3 text-sm font-medium whitespace-nowrap">Prix (DZD)</th>
                              <th className="text-left p-3 text-sm font-medium whitespace-nowrap">Stock</th>
                              <th className="text-right p-3 text-sm font-medium whitespace-nowrap">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {variants.map((variant, index) => {
                              const stockStatus = getStockStatus(variant.stock_quantity)
                              const isEditing = editingVariant === variant.id
                              
                              return (
                                <tr key={variant.id} className={`border-t ${isEditing ? 'bg-blue-50' : 'hover:bg-muted/50'}`}>
                                  <td className="p-3">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-sm whitespace-nowrap">Variante {index + 1}</span>
                                    </div>
                                  </td>
                                  
                                  {/* Colonnes d'attributs */}
                                  {attributes.map(attr => {
                                    const variantAttr = variant.attributes.find(a => a.attribute_id === attr.id)
                                    const isColor = attr.name.toLowerCase().includes('couleur')
                                    
                                    return (
                                      <td key={attr.id} className="p-3">
                                        {isEditing ? (
                                          <div className="flex items-center gap-2">
                                            <Select
                                              value={variantAttr?.value_id || ''}
                                              onValueChange={(value) => 
                                                updateVariantAttribute(variant.id, attr.id, value)
                                              }
                                            >
                                              <SelectTrigger className="h-9 min-w-[120px]">
                                                <SelectValue placeholder="Choisir">
                                                  {variantAttr && (
                                                    <div className="flex items-center gap-2">
                                                      {isColor && (
                                                        <div className={`h-3 w-3 rounded-full ${getColorClass(variantAttr.value)}`} />
                                                      )}
                                                      <span>{variantAttr.value}</span>
                                                    </div>
                                                  )}
                                                </SelectValue>
                                              </SelectTrigger>
                                              <SelectContent>
                                                {attr.values.map(val => (
                                                  <SelectItem key={val.id} value={val.id}>
                                                    <div className="flex items-center gap-2">
                                                      {isColor && (
                                                        <div className={`h-4 w-4 rounded-full ${getColorClass(val.value)}`} />
                                                      )}
                                                      {val.value}
                                                    </div>
                                                  </SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                            {variantAttr && (
                                              <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 flex-shrink-0"
                                                onClick={() => removeAttributeFromVariant(variant.id, attr.id)}
                                              >
                                              </Button>
                                            )}
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-2">
                                            {isColor && variantAttr && (
                                              <div className={`h-4 w-4 rounded-full ${getColorClass(variantAttr.value)}`} />
                                            )}
                                            <span className="text-sm">{variantAttr?.value || '-'}</span>
                                          </div>
                                        )}
                                      </td>
                                    )
                                  })}
                                  
                                  {/* Prix */}
                                  <td className="p-3">
                                    {isEditing ? (
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={variant.price}
                                        onChange={(e) => updateVariantField(variant.id, 'price', parseFloat(e.target.value) || 0)}
                                        className="h-9 w-28"
                                      />
                                    ) : (
                                      <span className="font-semibold text-sm whitespace-nowrap">
                                        {variant.price.toFixed(2)} DZD
                                      </span>
                                    )}
                                  </td>
                                  
                                  {/* Stock */}
                                  <td className="p-3">
                                    {isEditing ? (
                                      <Input
                                        type="number"
                                        value={variant.stock_quantity}
                                        onChange={(e) => updateVariantField(variant.id, 'stock_quantity', parseInt(e.target.value) || 0)}
                                        className="h-9 w-20"
                                      />
                                    ) : (
                                      <span className="text-sm">{variant.stock_quantity}</span>
                                    )}
                                  </td>
                                  
                                  
                                  {/* Actions */}
                                  <td className="p-3">
                                    <div className="flex justify-end gap-1">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => setEditingVariant(isEditing ? null : variant.id)}
                                      >
                                        {isEditing ? <Check className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => removeVariant(variant.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {variants.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p className="text-lg font-medium mb-2">Aucune variante</p>
                        <p className="text-sm">Ajoutez des variantes pour gérer le stock par taille, couleur, etc.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
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