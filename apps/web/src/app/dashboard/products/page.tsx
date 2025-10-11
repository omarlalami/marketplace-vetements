'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { apiClient } from '@/lib/api'
import { 
  Plus, 
  Search, 
  Package, 
  Edit, 
  Trash2, 
  Eye,
  Loader2,
  Filter,
  MoreHorizontal,
  Image as ImageIcon
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface Variant {
  id: string
  stock_quantity: number
  price_modifier: number
  attribute_values: Array<{
    id: number
    attribute: string // ex: "Couleur" ou "Taille"
    value: string // ex: "Rouge", "M"
  }>
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  shop_name: string
  shop_slug: string
  category_name: string
  primary_image?: {
    url: string
    key: string
  } | null
  created_at: string
  variants?: Variant[]
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedShop, setSelectedShop] = useState('all')
  const [error, setError] = useState('')

  // Charger les données
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [shopsData] = await Promise.all([
          apiClient.getMyShops()
        ])
        
        setShops(shopsData.shops)



        // Charger les produits de toutes les boutiques
        const allProducts = []
        for (const shop of shopsData.shops) {
          try {
            //console.log('shop info : ', JSON.stringify(shop, null, 2))
            const shopProducts = await apiClient.getProducts({shop: shop.slug})
            allProducts.push(...shopProducts.products)
          } catch (err) {
            console.log(`Pas de produits pour ${shop.name}`)
          }
        }
        
        //console.log('Tout les produits recu : ', JSON.stringify(allProducts, null, 2))
        setProducts(allProducts)
        setFilteredProducts(allProducts)
      } catch (error: any) {
        setError('Erreur lors du chargement des produits')
        console.error('Erreur:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filtrer les produits
  // ici on evite d'appeler le backend pour filtrer !
  useEffect(() => {
    let filtered = products

    // Filtrer par recherche
    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.shop_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtrer par boutique
    if (selectedShop !== 'all') {
      filtered = filtered.filter(product => product.shop_name === selectedShop)
    }

    setFilteredProducts(filtered)
  }, [products, searchTerm, selectedShop])

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

  const handleDelete = async (productId: string, productName: string) => {
    try {
      setDeletingId(productId)
      await apiClient.deleteProduct(productId)
      // Retirer le produit de la liste locale
      setProducts(prev => prev.filter(p => p.id !== productId))
    } catch (error: any) {
      console.error('Erreur suppression:', error)
      setError(error.response?.data?.error || 'Erreur lors de la suppression')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Mes produits</h1>
              <p className="text-muted-foreground">Gérez vos créations</p>
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-t-lg"></div>
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
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
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mes produits</h1>
            <p className="text-muted-foreground">
              {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} 
              {products.length !== filteredProducts.length && ` sur ${products.length}`}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard/shops">
                Gérer boutiques
              </Link>
            </Button>
            {/* ✅ Afficher "Ajouter un produit" uniquement si au moins une boutique existe */}
            {shops.length > 0 && (
              <Button asChild>
                <Link href="/dashboard/products/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un produit
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Filtres */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Recherche */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Rechercher des produits..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filtre boutique */}
              <select
                value={selectedShop}
                onChange={(e) => setSelectedShop(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">Toutes les boutiques</option>
                {shops.map((shop: any) => (
                  <option key={shop.id} value={shop.name}>
                    {shop.name}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Message d'erreur */}
        {error && (
          <Card>
            <CardContent className="pt-6">
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Liste des produits */}
        {filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />

                {/* ✅ Si aucune boutique n'existe */}
                {shops.length === 0 ? (
                  <>
                    <h3 className="text-lg font-semibold mb-2">Aucune boutique trouvée</h3>
                    <p className="text-muted-foreground mb-6">
                      Vous devez d’abord créer une boutique avant de pouvoir ajouter des produits.
                    </p>
                    <Button asChild>
                      <Link href="/dashboard/shops">
                        <Plus className="mr-2 h-4 w-4" />
                        Créer ma première boutique
                      </Link>
                    </Button>
                  </>
                ) : (
                  <>
                    {/* 🟢 Cas classique : aucune boutique vide */}
                    <h3 className="text-lg font-semibold mb-2">
                      {searchTerm || selectedShop !== 'all' ? 'Aucun produit trouvé' : 'Aucun produit'}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {searchTerm || selectedShop !== 'all'
                        ? 'Essayez de modifier vos critères de recherche'
                        : 'Commencez par créer votre premier produit'}
                    </p>
                    {!searchTerm && selectedShop === 'all' && (
                      <Button asChild>
                        <Link href="/dashboard/products/create">
                          <Plus className="mr-2 h-4 w-4" />
                          Créer mon premier produit
                        </Link>
                      </Button>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="group hover:shadow-md transition-shadow overflow-hidden">
                {/* Image du produit */}
                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                  {product.primary_image?.url ? (
                    <Image
                      src={product.primary_image.url}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <ImageIcon className="h-12 w-12" />
                    </div>
                  )}
                  
                  {/* Actions en overlay */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex gap-1">
                      <Button size="icon" variant="secondary" asChild>
                        <Link href={`/products/${product.id}`} target="_blank">
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button size="icon" variant="secondary" asChild>
                        <Link href={`/dashboard/products/${product.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>

                  {/* Badge prix */}
                  {product.price && (
                    <div className="absolute bottom-2 left-2">
                      <Badge className="bg-green-600 hover:bg-green-700">
                        {formatPrice(product.price)} DZD
                      </Badge>
                    </div>
                  )}
                </div>
                
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg line-clamp-1">{product.name}</CardTitle>









                    {/* Bouton de suppression avec confirmation */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={deletingId === product.id}
                        >
                          {deletingId === product.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-red-500" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer le produit ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer <strong>"{product.name}"</strong> ?
                            <br />
                            Cette action est irréversible et supprimera également toutes les images et variantes associées.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(product.id, product.name)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>















                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{product.shop_name}</span>
                    {product.category_name && (
                      <>
                        <span>•</span>
                        <span>{product.category_name}</span>
                      </>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    {/* Description */}
                    {product.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {product.description}
                      </p>
                    )}

                    {/* Variantes */}

                  {/* Variantes */}
                  {product.variants && product.variants.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {product.variants.map((variant) => (
                        <Badge key={variant.id} variant="outline" className="text-xs">
                          {variant.attribute_values.map(av => `${av.attribute}: ${av.value}`).join(', ')}
                        </Badge>
                      ))}
                    </div>
                  )}
                    {/* Stats */}
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>
                        Créé le {new Date(product.created_at).toLocaleDateString('fr-FR')}
                      </span>
                      {product.variants && (
                        <span>
                          Stock: {product.variants.reduce((acc, v) => acc + v.stock_quantity, 0)}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1" asChild>
                        <Link href={`/dashboard/products/${product.id}/edit`}>
                          <Edit className="mr-2 h-3 w-3" />
                          Modifier
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/products/${product.id}`} target="_blank">
                          <Eye className="h-3 w-3" />
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
    </DashboardLayout>
  )
}