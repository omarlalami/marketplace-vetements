'use client'

import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { apiClient } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Grid, List, Store, PackageSearch, Package, Calendar } from 'lucide-react'
import Link from 'next/link'
import { ClientLayout } from '@/components/layout/ClientLayout'

// 🔖 Types
interface Shop {
  name: string
  slug: string
  description: string
  logo_url?: string
  created_at: string
  product_count: number
}

// Composant qui utilise useSearchParams (doit être dans Suspense)
function ShopsContent() {
  const searchParams = useSearchParams()

  const [shops, setShops] = useState<Shop[]>([])
  const [filteredShops, setFilteredShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest')

  // 🧩 1. Chargement initial des shops (une seule fois)
  useEffect(() => {
    const fetchShops = async () => {
      try {
        setLoading(true)
        const data = await apiClient.getAllShops() // limite large
        setShops(data)
        setFilteredShops(data)
        //console.log('Tout les shopp recu : ', JSON.stringify(data, null, 2))

      } catch (error) {
        console.error('Erreur lors du chargement des boutiques :', error)
        setError('Erreur lors du chargement des boutiques')
      } finally {
        setLoading(false)
      }
    }

    fetchShops()
  }, [])

  const stats = {
    totalShops: shops.length,
    totalProducts: shops.reduce((acc, shop) => {
      const count = Number(shop.product_count) || 0
      return acc + count
    }, 0),
  }

  // 🔍 2. Filtrage local à chaque modification (searchTerm ou sortBy)
  useEffect(() => {
    let filtered = [...shops]

    // 🔹 Recherche texte
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (shop) =>
          shop.name.toLowerCase().includes(term) ||
          shop.description?.toLowerCase().includes(term)
      )
    }

    // 🔹 Tri local
    switch (sortBy) {
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'products':
        filtered.sort((a, b) => (b.product_count || 0) - (a.product_count || 0))
        break
      default: // newest
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
    }

    setFilteredShops(filtered)
  }, [shops, searchTerm, sortBy])

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
    <div className="max-w-7xl mx-auto p-4">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto mb-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">{stats.totalShops}</div>
            <div className="text-sm text-muted-foreground">Créateurs actifs</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">{stats.totalProducts}</div>
            <div className="text-sm text-muted-foreground">Créations disponibles</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-center gap-4 mb-10 gap-4 mb-10 bg-white/50 backdrop-blur-sm p-4 rounded-xl border shadow-sm">
        {/* 🔍 Barre de recherche */}
        <div className="relative w-full md:w-1/2 md:mx-auto">
          <PackageSearch className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Rechercher un créateur ou une boutique..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 rounded-lg focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* ⚙️ Filtres et affichage */}
        <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 w-full md:w-auto">
          {/* Sélecteur de tri */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[190px] rounded-lg">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Plus récents</SelectItem>
              <SelectItem value="oldest">Plus anciens</SelectItem>
              <SelectItem value="name">Nom A-Z</SelectItem>
              <SelectItem value="products">Plus de produits</SelectItem>
            </SelectContent>
          </Select>

          {/* Modes d'affichage */}
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
              className="rounded-lg transition-colors"
              title="Vue en grille"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
              className="rounded-lg transition-colors"
              title="Vue en liste"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 🏪 Résultats */}
      {filteredShops.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Store className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune boutique trouvée</h3>
              <p className="text-muted-foreground">
                Essayez un autre mot clé ou vérifiez l'orthographe.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div
          className={`grid ${
            viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'grid-cols-1 gap-4'
          }`}
        >
          {filteredShops.map((shop) => (
            <Card key={shop.slug} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-4">
                  {shop.logo_url ? (
                    <img
                      src={shop.logo_url}
                      alt={shop.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-lg font-bold">{shop.name.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-lg">{shop.name}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 📝 Description */}
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {shop.description || shop.name + ' Official Store'}
                </p>

                {/* 📦 Infos boutique */}
                <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-3">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    <span className="font-medium">
                      {shop.product_count} création{shop.product_count > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>
                      Depuis{' '}
                      {new Date(shop.created_at).toLocaleDateString('fr-FR', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* 🏪 Bouton centré avec fond coloré */}
                <div className="flex justify-center pt-3">
                  <Link href={`/shops/${shop.slug}`}>
                    <Button
                      size="sm"
                      className="bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors rounded-xl px-6"
                    >
                      <Store className="mr-2 h-4 w-4" />
                      Voir la boutique
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
    </ClientLayout>
  )
}

// Composant principal avec Suspense boundary
export default function ShopsPage() {
  return (
    <ClientLayout>
      <Suspense fallback={
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
      }>
        <ShopsContent />
      </Suspense>
    </ClientLayout>
  )
}