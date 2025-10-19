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
  Search, 
  Eye,
  Loader2,
  Trash2,
  ShoppingBag,
  CreditCard,
  Truck,
  MapPin
} from 'lucide-react'
import Link from 'next/link'

interface OrderItem {
  id: string
  product_name: string
  product_image_url?: string
  variant_attributes?: Record<string, any>
  quantity: number
  unit_price: number | string
  subtotal: number | string
}

interface ShippingAddress {
  email?: string
  address?: string
  street?: string
  city?: string
  zipcode?: string
  postal_code?: string
  phone: string
  country?: string
  name: string
  [key: string]: any
}

interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  total_amount: number | string
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  payment_status: string
  payment_method?: string
  shop_name: string
  shop_slug: string
  items?: OrderItem[]
  created_at: string
  updated_at: string
  global_order_created_at?: string
  shipping_address: ShippingAddress
  notes?: string
}

interface Shop {
  id: string
  name: string
  slug: string
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
}

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
}

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  completed: 'Payée',
  failed: 'Échouée',
  refunded: 'Remboursée',
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedShop, setSelectedShop] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('all')
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const shopsData = await apiClient.getMyShops()
        //console.log('recu shopsData:', JSON.stringify(shopsData, null, 2))
        setShops(shopsData.shops)

        const allOrders: Order[] = []
        for (const shop of shopsData.shops) {
          try {
            const shopOrders = await apiClient.getOrdersByShop(shop.id)
            //console.log('recu shopOrders:', JSON.stringify(shopOrders, null, 2))
            
            // Transformer les données API pour matcher l'interface Order
            const transformedOrders = shopOrders.map((order: any) => ({
              ...order,
              shop_name: order.shop_name || shop.name,
              shop_slug: order.shop_slug || shop.slug,
              total_amount: parseFloat(String(order.total_amount)) || 0,
              items: (order.items || []).map((item: any) => ({
                ...item,
                unit_price: parseFloat(String(item.unit_price)) || 0,
                subtotal: parseFloat(String(item.subtotal)) || 0,
              }))
            }))
            
            allOrders.push(...transformedOrders)
          } catch (err) {
            console.log(`No orders for ${shop.name}`)
          }
        }

        allOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        setOrders(allOrders)
        setFilteredOrders(allOrders)
      } catch (error: any) {
        setError('Erreur lors du chargement des commandes')
        console.error('Erreur:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    let filtered = orders

    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.shipping_address?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.shipping_address?.phone.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedShop !== 'all') {
      filtered = filtered.filter(order => order.shop_name === selectedShop)
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(order => order.status === selectedStatus)
    }

    if (selectedPaymentStatus !== 'all') {
      filtered = filtered.filter(order => order.payment_status === selectedPaymentStatus)
    }

    setFilteredOrders(filtered)
  }, [orders, searchTerm, selectedShop, selectedStatus, selectedPaymentStatus])

  const formatPrice = (price: number | string): string => {
    const num = typeof price === 'string' ? parseFloat(price) : price
    if (isNaN(num)) return '0'
    if (num === Math.floor(num)) {
      return num.toString()
    }
    return num.toFixed(2)
  }

  const getShippingAddress = (addr?: ShippingAddress): { street: string; city: string; zipcode: string; phone: string } => {
    if (!addr) return { street: '', city: '', zipcode: '', phone: '' }
    return {
      street: addr.address || addr.street || '',
      city: addr.city || '',
      zipcode: addr.postal_code || addr.zipcode || '',
      phone: addr.phone || '',
    }
  }

  const handleDelete = async (orderId: string) => {
    try {
      setDeletingId(orderId)
      setOrders(prev => prev.filter(o => o.id !== orderId))
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
              <h1 className="text-3xl font-bold tracking-tight">Mes commandes</h1>
              <p className="text-muted-foreground">Gérez vos commandes</p>
            </div>
          </div>
          
          <div className="grid gap-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="pt-6">
                  <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mes commandes</h1>
            <p className="text-muted-foreground">
              {filteredOrders.length} commande{filteredOrders.length > 1 ? 's' : ''}
              {orders.length !== filteredOrders.length && ` sur ${orders.length}`}
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Rechercher par numéro de commande, nom client ou numéro de téléphone ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <select
                  value={selectedShop}
                  onChange={(e) => setSelectedShop(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="all">Toutes les boutiques</option>
                  {shops.map((shop) => (
                    <option key={shop.id} value={shop.name}>
                      {shop.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* <div className="flex flex-col sm:flex-row gap-4">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="all">Tous les statuts</option>
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedPaymentStatus}
                  onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="all">Tous les statuts de paiement</option>
                  {Object.entries(PAYMENT_STATUS_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div> */}
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card>
            <CardContent className="pt-6">
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            </CardContent>
          </Card>
        )}

        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <ShoppingBag className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm || selectedShop !== 'all' || selectedStatus !== 'all' || selectedPaymentStatus !== 'all'
                    ? 'Aucune commande trouvée' 
                    : 'Aucune commande'}
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm || selectedShop !== 'all' || selectedStatus !== 'all' || selectedPaymentStatus !== 'all'
                    ? 'Essayez de modifier vos critères de recherche'
                    : 'Vous n\'avez pas encore de commandes'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const addr = getShippingAddress(order.shipping_address)
              return (
                <Card key={order.id} className="group hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-3 flex-wrap">
                            <h3 className="font-semibold text-lg">
                              Commande #{order.order_number}
                            </h3>
                            {/* <Badge className={STATUS_COLORS[order.status] || STATUS_COLORS['pending']}>
                              {STATUS_LABELS[order.status] || order.status}
                            </Badge>
                            <Badge className={PAYMENT_STATUS_COLORS[order.payment_status] || PAYMENT_STATUS_COLORS['pending']}>
                              <CreditCard className="h-3 w-3 mr-1" />
                              {PAYMENT_STATUS_LABELS[order.payment_status] || order.payment_status}
                            </Badge> */}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
                            <div>
                              <p className="font-medium text-foreground mb-1">Client</p>
                              <p>{order.shipping_address?.name}</p>
                              
                              <p>{order.shipping_address?.phone}</p>
                            </div>

                            <div>
                              <p className="font-medium text-foreground mb-1">Boutique</p>
                              <p>{order.shop_name}</p>
                            </div>

                            {order.payment_method && (
                              <div>
                                <p className="font-medium text-foreground mb-1">Méthode de paiement</p>
                                {/* <p className="capitalize">{order.payment_method}</p> */}
                                <p className="capitalize">A la livraison</p>
                              </div>
                            )}

                            <div>
                              <p className="font-medium text-foreground mb-1">Date de commande</p>
                              <p>
                                {new Date(order.global_order_created_at || order.created_at).toLocaleDateString('fr-FR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>

                            {(addr.street || addr.city || addr.phone) && (
                              <div className="sm:col-span-2">
                                <p className="font-medium text-foreground mb-1 flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  Adresse de livraison
                                </p>
                                <div className="text-sm">
                                  {addr.street && <p>{addr.street}</p>}
                                  {addr.city && addr.zipcode && (
                                    <p>{addr.zipcode} {addr.city}</p>
                                  )}
                                  {addr.phone && <p>{addr.phone}</p>}
                                </div>
                              </div>
                            )}

                            {order.notes && (
                              <div className="sm:col-span-2">
                                <p className="font-medium text-foreground mb-1">Notes</p>
                                <p className="italic">{order.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600 mb-4">
                            {formatPrice(order.total_amount)} DZD
                          </div>

                          {/* <div className="flex gap-2">
                            <Button size="icon" variant="outline" asChild>
                              <Link href={`/dashboard/orders/${order.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  disabled={deletingId === order.id}
                                >
                                  {deletingId === order.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Supprimer la commande ?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Êtes-vous sûr de vouloir supprimer la commande <strong>#{order.order_number}</strong> ?
                                    <br />
                                    Cette action est irréversible.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(order.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Supprimer
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div> */}
                        </div>
                      </div>

                      {order.items && order.items.length > 0 && (
                        <div className="pt-4 border-t">
                          <p className="text-sm font-semibold mb-3">Articles de la commande:</p>
                          <div className="space-y-2">
                            {order.items.map((item) => (
                              <div key={item.id} className="flex items-start gap-4 p-3 bg-gray-50 rounded-md">
                                {item.product_image_url && (
                                  <img 
                                    src={item.product_image_url} 
                                    alt={item.product_name}
                                    className="h-12 w-12 object-cover rounded"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm">{item.product_name}</p>
                                  {item.variant_attributes && Object.keys(item.variant_attributes).length > 0 && (
                                    <p className="text-xs text-muted-foreground">
                                      {Object.entries(item.variant_attributes).map(([key, val]) => `${key}: ${val}`).join(', ')}
                                    </p>
                                  )}
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Quantité: {item.quantity} × {formatPrice(item.unit_price)} DZD
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-sm">{formatPrice(item.subtotal)} DZD</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}