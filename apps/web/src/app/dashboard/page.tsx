// Page principale du Dashboard

'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Store, Package, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuthStore } from '@/stores/authStore'
import { apiClient } from '@/lib/api'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const data = await apiClient.getMyShops()
        setShops(data.shops)
      } catch (error) {
        console.error('Erreur chargement boutiques:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchShops()
  }, [])

  const quickActions = [
    {
      title: 'Créer une boutique',
      description: 'Lancez votre boutique de créateur',
      icon: Store,
      href: '/dashboard/shops/create',
      variant: 'default' as const,
    },
    {
      title: 'Ajouter un produit',
      description: 'Ajoutez un nouveau produit',
      icon: Package,
      href: '/dashboard/products/create',
      variant: 'outline' as const,
      disabled: shops.length === 0,
    },
  ]

/*   const stats = [
    {
      title: 'Mes boutiques',
      value: shops.length.toString(),
      description: 'Boutiques actives',
      icon: Store,
    },
    {
      title: 'Mes Produits',
      value: '0',
      description: 'Produits en ligne',
      icon: Package,
    },
    {
      title: 'Mes Commandes',
      value: '0',
      description: 'Commandes recue',
      icon: TrendingUp,
    },
  ] */
   const stats = [
    {
      title: 'Mes boutiques',
      value: shops.length.toString(),
      description: 'Boutiques actives',
      icon: Store,
    }
  ]

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Bonjour {user?.firstName} ! 👋
          </h1>
          <p className="text-muted-foreground mt-2">
            Bienvenue sur votre tableau de bord Aqnar Concept Store
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
            <CardDescription>
              Que souhaitez-vous faire aujourd'hui ?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {quickActions.map((action) => (
                <Card key={action.title} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <action.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <h3 className="font-semibold text-sm">{action.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {action.description}
                      </p>
                      <Button 
                        variant={action.variant} 
                        size="sm" 
                        asChild
                        disabled={action.disabled}
                      >
                        <Link href={action.href} className="flex items-center">
                          <Plus className="h-4 w-4 mr-2" />
                          {action.disabled ? 'Créez d\'abord une boutique' : 'Commencer'}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {shops.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-muted-foreground">
                <Store className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Aucune boutique</h3>
                <p className="mb-6">Commencez par créer votre première boutique !</p>
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
          <Card>
            <CardHeader>
              <CardTitle>Mes boutiques</CardTitle>
              <CardDescription>Vos boutiques récentes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {shops.slice(0, 3).map((shop: any) => (
                  <div key={shop.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-semibold">{shop.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {shop.description || 'Aucune description'}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/shops/${shop.id}/edit`}>
                        Gérer
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
              
              {shops.length > 3 && (
                <div className="mt-4 text-center">
                  <Button variant="outline" asChild>
                    <Link href="/dashboard/shops">Voir toutes les boutiques</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}