'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { apiClient } from '@/lib/api'
import { 
  Search, 
  Filter,
  Store,
  Calendar,
  Package,
  MapPin,
  Users,
  Heart,
  ExternalLink,
  Grid3X3,
  List
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { ClientLayout } from '@/components/layout/ClientLayout'

interface Shop {
  id: string
  name: string
  slug: string
  description: string
  owner_name: string
  created_at: string
  logo_url?: string
  product_count: number
}

export default function ShopsPage() {
  const searchParams = useSearchParams()
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest')
  const [error, setError] = useState('')

  // Charger les boutiques
  useEffect(() => {
    const fetchShops = async () => {
      try {
        setLoading(true)
        const data = await apiClient.getAllShops({
          search: searchTerm || undefined,
          sortBy,
          limit: 50
        })
        setShops(data.shops)
      } catch (error: any) {
        setError('Erreur lors du chargement des boutiques')
        console.error('Erreur:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchShops()
  }, [searchTerm, sortBy])

  const stats = {
    totalShops: shops.length,
    totalProducts: shops.reduce((acc, shop) => acc + shop.product_count, 0),
    avgProductsPerShop: shops.length > 0 ? Math.round(shops.reduce((acc, shop) => acc + shop.product_count, 0) / shops.length) : 0
  }

  if (loading) {
    return (
    <ClientLayout>
      <div className="min-h-screen bg-gray-50">

        <main className="container mx-auto px-4 py-8">
          {/* Header skeleton */}
          <div className="text-center mb-12">
            <div className="h-10 bg-gray-200 rounded w-1/2 mx-auto mb-4 animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded w-1/3 mx-auto animate-pulse"></div>
          </div>

          {/* Grid skeleton */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(12)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-5 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </ClientLayout>
    )
  }

  return (
  <ClientLayout>
    <div className="min-h-screen bg-gray-50">

      <main className="container mx-auto px-4 py-8">
        {/* En-tête */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Nos créateurs
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Découvrez les designers talentueux qui créent des pièces uniques sur Fashion Market. 
            Chaque créateur a son propre style et son univers artistique.
          </p>

          {/* Statistiques */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">{stats.totalShops}</div>
              <div className="text-sm text-muted-foreground">Créateurs actifs</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">{stats.totalProducts}</div>
              <div className="text-sm text-muted-foreground">Créations disponibles</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">{stats.avgProductsPerShop}</div>
              <div className="text-sm text-muted-foreground">Créations par boutique</div>
            </div>
          </div>
        </div>

        {/* Filtres et contrôles */}
        <div className="mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                {/* Recherche */}
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Rechercher des créateurs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Tri */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">Trier par:</span>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Plus récents</SelectItem>
                        <SelectItem value="oldest">Plus anciens</SelectItem>
                        <SelectItem value="name">Nom A-Z</SelectItem>
                        <SelectItem value="products">Plus de produits</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sélecteur de vue */}
                  <div className="border rounded-md p-1">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="px-2"
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="px-2"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Message d'erreur */}
        {error && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Liste des boutiques */}
        {shops.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Store className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm ? 'Aucun créateur trouvé' : 'Aucun créateur disponible'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm 
                  ? `Aucun créateur ne correspond à "${searchTerm}"` 
                  : 'Il n\'y a pas encore de créateurs sur la plateforme'
                }
              </p>
              {searchTerm && (
                <Button onClick={() => setSearchTerm('')}>
                  Voir tous les créateurs
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1 max-w-4xl mx-auto'
          }`}>
            {shops.map((shop) => (
              <Card key={shop.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    {/* Logo/Avatar */}
                    <div className="w-12 h-12 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
                      {shop.logo_url ? (
                        <Image
                          src={shop.logo_url}
                          alt={shop.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                          {shop.name.charAt(0)}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        <Link href={`/shops/${shop.slug}`} className="line-clamp-1">
                          {shop.name}
                        </Link>
                      </CardTitle>
                      <CardDescription className="line-clamp-1">
                        Par {shop.owner_name}
                      </CardDescription>
                    </div>

                    {/* Bouton favoris */}
                    <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {/* Description */}
                    {shop.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {shop.description}
                      </p>
                    )}

                    {/* Statistiques */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Package className="h-4 w-4" />
                          <span>{shop.product_count} création{shop.product_count > 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Depuis {new Date(shop.created_at).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button className="flex-1" asChild>
                        <Link href={`/shops/${shop.slug}`}>
                          <Store className="mr-2 h-4 w-4" />
                          Voir la boutique
                        </Link>
                      </Button>
                      <Button variant="outline" size="icon" asChild>
                        <Link href={`/shops/${shop.slug}`} target="_blank">
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>

                    {/* Badge avec nombre de produits */}
                    {shop.product_count > 0 && (
                      <div className="flex justify-center">
                        <Badge variant="secondary" className="text-xs">
                          {shop.product_count === 1 ? '1 création' : `${shop.product_count} créations`}
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Call to action pour devenir créateur */}
        <div className="mt-16">
          <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-none">
            <CardContent className="py-12 text-center">
              <div className="max-w-2xl mx-auto">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="h-8 w-8 text-white" />
                </div>
                
                <h2 className="text-3xl font-bold mb-4">
                  Vous êtes créateur ?
                </h2>
                
                <p className="text-lg text-muted-foreground mb-8">
                  Rejoignez notre communauté de designers talentueux et partagez vos créations avec le monde entier. 
                  Créez votre boutique gratuitement et commencez à vendre dès aujourd'hui.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button size="lg" asChild>
                    <Link href="/register">
                      <Store className="mr-2 h-5 w-5" />
                      Créer ma boutique
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/login">
                      Se connecter
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  </ClientLayout>
  )
}