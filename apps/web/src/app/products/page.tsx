'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { apiClient } from '@/lib/api'
import { 
  Search, 
  Filter, 
  Heart,
  SlidersHorizontal,
  Grid,
  List
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface Product {
  id: string
  name: string
  description: string
  price: number
  shop_name: string
  shop_slug: string
  category_name: string
  primary_image: string
  created_at: string
}

interface Filters {
  search: string
  category: string
  minPrice: string
  maxPrice: string
  sortBy: string
}

export default function ProductsPage() {
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  
  const [filters, setFilters] = useState<Filters>({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sortBy: searchParams.get('sort') || 'newest'
  })

  // Charger les produits et catégories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [productsData, categoriesData] = await Promise.all([
          apiClient.getProducts({
            search: filters.search || undefined,
            category: filters.category || undefined,
            minPrice: filters.minPrice ? parseFloat(filters.minPrice) : undefined,
            maxPrice: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
          }),
          apiClient.getCategories()
        ])
        
        let sortedProducts = [...productsData.products]
        
        // Tri
        switch (filters.sortBy) {
          case 'price-asc':
            sortedProducts.sort((a, b) => (a.price || 0) - (b.price || 0))
            break
          case 'price-desc':
            sortedProducts.sort((a, b) => (b.price || 0) - (a.price || 0))
            break
          case 'name':
            sortedProducts.sort((a, b) => a.name.localeCompare(b.name))
            break
          case 'newest':
          default:
            sortedProducts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        }
        
        setProducts(sortedProducts)
        setCategories(categoriesData.categories)
      } catch (error) {
        console.error('Erreur chargement produits:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [filters])

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      sortBy: 'newest'
    })
  }

  const flatCategories = categories.flatMap((category: any) => [
    category,
    ...(category.children || [])
  ])

  const hasActiveFilters = filters.category || filters.minPrice || filters.maxPrice || filters.search

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Navigation placeholder */}
        <header className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(12)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-square bg-gray-200"></div>
                <CardContent className="p-4">
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation simple */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-primary">
              Fashion Market
            </Link>
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/products" className="font-medium text-primary">
                Produits
              </Link>
              <Link href="/shops" className="text-muted-foreground hover:text-foreground">
                Créateurs
              </Link>
              <Link href="/login" className="text-muted-foreground hover:text-foreground">
                Se connecter
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar filtres */}
          <aside className={`lg:w-80 space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">Filtres</h3>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Effacer
                    </Button>
                  )}
                </div>

                <div className="space-y-6">
                  {/* Recherche */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Recherche</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Nom, description..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Catégorie */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Catégorie</label>
                    <Select 
                      value={filters.category} 
                      onValueChange={(value) => handleFilterChange('category', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Toutes les catégories" />
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

                  {/* Prix */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Prix (€)</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filters.minPrice}
                        onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filters.maxPrice}
                        onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Tri */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Trier par</label>
                    <Select 
                      value={filters.sortBy} 
                      onValueChange={(value) => handleFilterChange('sortBy', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Plus récents</SelectItem>
                        <SelectItem value="price-asc">Prix croissant</SelectItem>
                        <SelectItem value="price-desc">Prix décroissant</SelectItem>
                        <SelectItem value="name">Nom A-Z</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Contenu principal */}
          <div className="flex-1">
            {/* En-tête avec résultats */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold mb-1">
                  {hasActiveFilters ? 'Résultats de recherche' : 'Tous les produits'}
                </h1>
                <p className="text-muted-foreground">
                  {products.length} produit{products.length > 1 ? 's' : ''} trouvé{products.length > 1 ? 's' : ''}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Bouton filtres mobile */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="lg:hidden"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filtres
                </Button>

                {/* Sélecteur de vue */}
                <div className="border rounded-md p-1 hidden sm:block">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="px-2"
                  >
                    <Grid className="h-4 w-4" />
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

            {/* Grille de produits */}
            {products.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <div className="text-muted-foreground mb-4">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Aucun produit trouvé</p>
                    <p>Essayez de modifier vos critères de recherche</p>
                  </div>
                  {hasActiveFilters && (
                    <Button onClick={clearFilters} className="mt-4">
                      Voir tous les produits
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3' 
                  : 'grid-cols-1'
              }`}>
                {products.map((product) => (
                  <Card key={product.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                    <Link href={`/products/${product.id}`}>
                      {/* Image */}
                      <div className={`bg-gray-100 relative overflow-hidden ${
                        viewMode === 'grid' ? 'aspect-square' : 'h-48 sm:h-32'
                      }`}>
                        {product.primary_image ? (
                          <Image
                            src={product.primary_image}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400">
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-200 rounded mb-2 mx-auto"></div>
                              <p className="text-sm">Pas d'image</p>
                            </div>
                          </div>
                        )}
                        
                        {/* Badge prix */}
                        {product.price && (
                          <div className="absolute top-3 left-3">
                            <Badge className="bg-white text-black hover:bg-white">
                              {product.price}€
                            </Badge>
                          </div>
                        )}
                        
                        {/* Bouton favoris */}
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="icon" variant="secondary" className="h-8 w-8">
                            <Heart className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Link>
                    
                    {/* Contenu */}
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <Link href={`/products/${product.id}`}>
                          <h3 className="font-semibold text-lg line-clamp-1 hover:text-primary transition-colors">
                            {product.name}
                          </h3>
                        </Link>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Link 
                            href={`/shops/${product.shop_slug}`}
                            className="hover:text-primary transition-colors"
                          >
                            {product.shop_name}
                          </Link>
                          {product.category_name && (
                            <>
                              <span>•</span>
                              <span>{product.category_name}</span>
                            </>
                          )}
                        </div>
                        
                        {product.description && viewMode === 'list' && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {product.description}
                          </p>
                        )}
                        
                        <div className="flex justify-between items-center pt-2">
                          {product.price ? (
                            <span className="text-xl font-bold text-green-600">
                              {product.price}€
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">Prix sur demande</span>
                          )}
                          
                          <Button size="sm" asChild>
                            <Link href={`/products/${product.id}`}>
                              Voir détails
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}