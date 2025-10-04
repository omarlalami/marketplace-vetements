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
  attributeId: string
  attributeValueIds: string[]
  stockQuantity: number
  priceModifier: number
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
  const [shops, setShops] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [attributes, setAttributes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [shopsData, categoriesData, attributesData] = await Promise.all([
          apiClient.getMyShops(),
          apiClient.getCategories(),
          apiClient.getAttributes() // ⚡ nouvel appel backend
        ])
        setShops(shopsData.shops)
        setCategories(categoriesData.categories)
        setAttributes(attributesData.attributes)
      } catch (error) {
        console.error('Erreur chargement données:', error)
      }
    }
    fetchData()
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addVariant = () => {
    const newVariant: Variant = {
      id: Date.now().toString(),
      attributeId: '',
      attributeValueIds: [],
      stockQuantity: 0,
      priceModifier: 0
    }
    setVariants(prev => [...prev, newVariant])
  }

  const updateVariant = (id: string, field: keyof Variant, value: any) => {
    setVariants(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v))
  }

  const removeVariant = (id: string) => {
    setVariants(prev => prev.filter(v => v.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        shopId: formData.shopId,
        categoryId: formData.categoryId || undefined,
        price: formData.price ? parseFloat(formData.price) : undefined,
        variants: variants.map(v => ({
          stockQuantity: v.stockQuantity,
          priceModifier: v.priceModifier,
          attributeValueIds: v.attributeValueIds
        }))
      }

      const response = await apiClient.createProduct(productData)
      const productId = response.product.id

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

  const flatCategories = categories.flatMap((c: any) => [c, ...(c.children || [])])

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Retour */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/products">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux produits
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Form principal */}
            <Card>
              <CardHeader>
                <CardTitle>Informations générales</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && <div className="text-red-600">{error}</div>}

                  <div className="space-y-2">
                    <Label htmlFor="name">Nom du produit *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label>Boutique *</Label>
                      <Select value={formData.shopId} onValueChange={(v) => handleInputChange('shopId', v)}>
                        <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                        <SelectContent>
                          {shops.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Catégorie</Label>
                      <Select value={formData.categoryId} onValueChange={(v) => handleInputChange('categoryId', v)}>
                        <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                        <SelectContent>
                          {flatCategories.map((c: any) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Prix (€)</Label>
                    <Input type="number" step="0.01" value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)} />
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Variantes */}
            <Card>
              <CardHeader>
                <CardTitle>Variantes</CardTitle>
              </CardHeader>
              <CardContent>
                <Button type="button" onClick={addVariant} variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" /> Ajouter une variante
                </Button>

                <div className="space-y-4 mt-4">
                  {variants.map((variant) => {
                    const attribute = attributes.find(a => a.id === variant.attributeId)
                    return (
                      <div key={variant.id} className="p-4 border rounded-lg space-y-4">
                        <div className="flex justify-between items-center">
                          <Badge variant="outline">{attribute?.name || "Nouvelle variante"}</Badge>
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeVariant(variant.id)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          {/* Choix de l'attribut */}
                          <div>
                            <Label>Attribut</Label>
                            <Select
                              value={variant.attributeId}
                              onValueChange={(v) => updateVariant(variant.id, "attributeId", v)}
                            >
                              <SelectTrigger><SelectValue placeholder="Choisir un attribut" /></SelectTrigger>
                              <SelectContent>
                                {attributes.map(attr => (
                                  <SelectItem key={attr.id} value={attr.id}>{attr.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Choix des valeurs */}
                          {variant.attributeId && (
                            <div>
                              <Label>Valeur</Label>
                              <Select
                                value={variant.attributeValueIds[0] || ""}
                                onValueChange={(v) => updateVariant(variant.id, "attributeValueIds", [v])}
                              >
                                <SelectTrigger><SelectValue placeholder="Choisir une valeur" /></SelectTrigger>
                                <SelectContent>
                                  {attributes
                                    .find(attr => attr.id === variant.attributeId)
                                    ?.values.map((val: any) => (
                                      <SelectItem key={val.id} value={val.id}>{val.value}</SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          <div>
                            <Label>Stock</Label>
                            <Input type="number" min="0"
                              value={variant.stockQuantity}
                              onChange={(e) => updateVariant(variant.id, "stockQuantity", parseInt(e.target.value) || 0)} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Images du produit</CardTitle>
              </CardHeader>
              <CardContent>
                <ImageUpload onImagesChange={setSelectedImages} maxFiles={10} maxSizePerFile={5} />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <Button onClick={handleSubmit} disabled={loading || !formData.name || !formData.shopId} className="w-full">
                  {loading ? 'Création...' : 'Créer le produit'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
