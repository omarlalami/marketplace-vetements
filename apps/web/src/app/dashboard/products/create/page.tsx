'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ImageUpload } from '@/components/ui/image-upload'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { apiClient } from '@/lib/api'
import { ArrowLeft, Plus } from 'lucide-react'
import Link from 'next/link'

export default function CreateProductPage() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shopId: '',
    categoryId: '',
    price: '',
  })

  const [shops, setShops] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [attributes, setAttributes] = useState<any[]>([])
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string[]>>({})
  const [generatedVariants, setGeneratedVariants] = useState<any[]>([])
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  // 🟢 Charger données initiales
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [shopsData, categoriesData, attributesData] = await Promise.all([
          apiClient.getMyShops(),
          apiClient.getCategories(),
          apiClient.getAttributes(),
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

  // 🟠 Gérer changements input principal
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // 🟣 Ajouter / retirer une valeur d’attribut
  const toggleAttributeValue = (attrId: string, valId: string) => {
    setSelectedAttributes(prev => {
      const current = prev[attrId] || []
      const exists = current.includes(valId)
      return {
        ...prev,
        [attrId]: exists
          ? current.filter(v => v !== valId)
          : [...current, valId],
      }
    })
  }

  // 🧮 Génération automatique des variantes (produit cartésien)
  useEffect(() => {
    const all = Object.entries(selectedAttributes)
      .filter(([_, vals]) => vals.length > 0)
      .map(([attrId, vals]) => vals.map(v => ({ attrId, valueId: v })))

    if (all.length === 0) {
      setGeneratedVariants([])
      return
    }

    const combine = (arr: any[][]): any[][] =>
      arr.reduce((a, b) => a.flatMap(x => b.map(y => [...x, y])), [[]])

    const combinations = combine(all)
    const variants = combinations.map((attrs, i) => ({
      id: `auto-${i}`,
      attributes: attrs,
      stockQuantity: 0,
      priceModifier: 0,
    }))

    setGeneratedVariants(variants)
  }, [selectedAttributes])

  // 🔵 Gestion du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (generatedVariants.length > 0 && generatedVariants.some(v => v.attributes.length === 0)) {
        setError('Toutes les variantes doivent contenir au moins un attribut.')
        setLoading(false)
        return
      }

      const productData = {
        name: formData.name,
        description: formData.description,
        shopId: formData.shopId,
        categoryId: formData.categoryId || undefined,
        price: formData.price ? parseFloat(formData.price) : undefined,
        variants: generatedVariants.map(v => ({
          stockQuantity: v.stockQuantity,
          priceModifier: v.priceModifier,
          attributeValueIds: v.attributes.map((a: { valueId: string }) => a.valueId),
        })),
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
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Bouton retour */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/products">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux produits
            </Link>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Informations générales */}
            <Card>
              <CardHeader>
                <CardTitle>Informations générales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && <div className="text-red-600">{error}</div>}

                <div>
                  <Label>Nom du produit *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Boutique *</Label>
                    <Select
                      value={formData.shopId}
                      onValueChange={(v) => handleInputChange('shopId', v)}
                    >
                      <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                      <SelectContent>
                        {shops.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Catégorie</Label>
                    <Select
                      value={formData.categoryId}
                      onValueChange={(v) => handleInputChange('categoryId', v)}
                    >
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
                  <Label>Prix de base (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Sélection des attributs */}
            <Card>
              <CardHeader>
                <CardTitle>Attributs du produit</CardTitle>
                 <CardDescription>
                  Gérez les combinaisons d'attributs (taille, couleur, etc.)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {attributes.map(attr => (
                  <div key={attr.id}>
                    <Label className="font-semibold">{attr.name}</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {attr.values.map((val: any) => {
                        const selected = selectedAttributes[attr.id]?.includes(val.id)
                        return (
                          <Button
                            key={val.id}
                            variant={selected ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => toggleAttributeValue(attr.id, val.id)}
                            type="button"
                          >
                            {val.value}
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Variantes générées */}
            {generatedVariants.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Variantes générées automatiquement</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {generatedVariants.map((variant) => (
                    <div key={variant.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {variant.attributes.map((a: any, i: number) => {
                          const attrDef = attributes.find(at => at.id === a.attrId)
                          const valDef = attrDef?.values.find((v: any) => v.id === a.valueId)
                          return (
                            <Badge key={i} variant="secondary">
                              {attrDef?.name}: {valDef?.value}
                            </Badge>
                          )
                        })}
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <Label>Stock</Label>
                          <Input
                            type="number"
                            value={variant.stockQuantity}
                            onChange={(e) =>
                              setGeneratedVariants(prev =>
                                prev.map(v =>
                                  v.id === variant.id
                                    ? { ...v, stockQuantity: parseInt(e.target.value) || 0 }
                                    : v
                                )
                              )
                            }
                          />
                        </div>
                        <div>
                          <Label>Prix (+/-)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={variant.priceModifier}
                            onChange={(e) =>
                              setGeneratedVariants(prev =>
                                prev.map(v =>
                                  v.id === variant.id
                                    ? { ...v, priceModifier: parseFloat(e.target.value) || 0 }
                                    : v
                                )
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Images du produit</CardTitle>
              </CardHeader>
              <CardContent>
                <ImageUpload
                  onImagesChange={setSelectedImages}
                  maxFiles={10}
                  maxSizePerFile={5}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <Button
                  type="submit"
                  disabled={loading || !formData.name || !formData.shopId}
                  className="w-full"
                >
                  {loading ? 'Création...' : 'Créer le produit'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
