// Page de mise à jour de boutique

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { apiClient } from '@/lib/api'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function UpdateShopPage() {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()
  const params = useParams()
  const shopId = params.id as string

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const response = await apiClient.getShopForEdit(shopId)
        setFormData({
          name: response.shop.name || '',
          description: response.shop.description || ''
        })
      } catch (error: any) {
        setError(error.response?.data?.error || 'Erreur lors du chargement de la boutique')
      } finally {
        setFetching(false)
      }
    }

    if (shopId) {
      fetchShop()
    }
  }, [shopId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await apiClient.updateShop(shopId, formData)
      router.push('/dashboard/shops')
    } catch (error: any) {
      setError(error.response?.data?.error || 'Erreur lors de la mise à jour')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/shops">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux boutiques
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Modifier votre boutique</CardTitle>
            <CardDescription>
              Mettez à jour les informations de votre boutique
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium">
                  Nom de la boutique *
                </label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ma Boutique Créative"
                  required
                  minLength={2}
                  maxLength={50}
                />
                <p className="text-sm text-muted-foreground">
                  Ce nom sera visible sur votre page publique
                </p>
                {formData.name.length > 0 && (formData.name.length < 2 || formData.name.length > 50) && (
                  <p className="text-sm text-red-500">
                    Le nom doit contenir entre 2 et 50 caractères.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="block text-sm font-medium">
                  Description
                </label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Décrivez votre univers créatif, votre style, vos inspirations..."
                  rows={4}
                  maxLength={300}
                />
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    Présentez votre boutique aux visiteurs (optionnel)
                  </p>
                  <p className={`text-xs ${formData.description.length > 290 ? 'text-red-500' : 'text-muted-foreground'}`}>
                    {formData.description.length}/300
                  </p>
                </div>
                {formData.description.length > 300 && (
                  <p className="text-sm text-red-500">
                    La description ne peut pas dépasser 300 caractères.
                  </p>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={loading || !formData.name || formData.name.length < 2} className="flex-1">
                  {loading ? 'Mise à jour...' : 'Enregistrer les modifications'}
                </Button>
                <Button variant="outline" type="button" asChild>
                  <Link href="/dashboard/shops">Annuler</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}