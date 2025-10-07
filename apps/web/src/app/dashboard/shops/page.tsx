// Page de gestion des boutiques

'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { apiClient } from '@/lib/api'
import { Plus, Store, Calendar, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default function ShopsPage() {
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const data = await apiClient.getMyShops()
        setShops(data.shops)
      } catch (error: any) {
        setError(error.response?.data?.error || 'Erreur de chargement')
      } finally {
        setLoading(false)
      }
    }

    fetchShops()
  }, [])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Mes boutiques</h1>
              <p className="text-muted-foreground">Gérez vos boutiques de créateur</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mes boutiques</h1>
            <p className="text-muted-foreground">Gérez vos boutiques de créateur</p>
          </div>
          <Button asChild>
            <Link href="/dashboard/shops/create">
              <Plus className="mr-2 h-4 w-4" />
              Créer une boutique
            </Link>
          </Button>
        </div>

        {error && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-red-600">
                {error}
              </div>
            </CardContent>
          </Card>
        )}

        {shops.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Store className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune boutique</h3>
                <p className="text-muted-foreground mb-6">
                  Vous n'avez pas encore créé de boutique. Commencez dès maintenant !
                </p>
                <Button asChild>
                  <Link href="/dashboard/shops/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Créer ma première boutique
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {shops.map((shop: any) => (
              <Card key={shop.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{shop.name}</CardTitle>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/shops/${shop.slug}`} target="_blank">
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {shop.description || 'Aucune description'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="mr-2 h-4 w-4" />
                      Créée le {new Date(shop.created_at).toLocaleDateString('fr-FR')}
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1" asChild>
                        <Link href={`/dashboard/shops/${shop.id}/edit`}>
                          Gérer
                        </Link>
                      </Button>
{/*                       <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/shops/${shop.id}/products`}>
                          Produits
                        </Link>
                      </Button> */}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}