'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Truck, Home } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { Separator } from '@/components/ui/separator'
import { ClientLayout } from '@/components/layout/ClientLayout'

interface OrderItem {
  product_name: string
  quantity: number
  unit_price: string | number
  subtotal: string | number
  product_image_url?: string
  variant_attributes?: Record<string, string>
}

interface ShopOrder {
  id: string
  shop_name: string
  shop_slug: string
  subtotal: string | number
  tax: string | number
  shipping_cost: string | number
  total_amount: string | number
  status: string
  items: OrderItem[]
}

interface Order {
  id: string
  order_number: string
  subtotal: string | number
  shipping_cost: string | number
  tax: string | number
  total_amount: string | number
  shipping_address: {
    name: string
    street: string
    city: string
    postal_code: string
    country: string
    phone: string
  }
  payment_status: string
  created_at: string
  shop_orders: ShopOrder[]
}

const formatPrice = (price: number | string): string => {
  const num = typeof price === 'string' ? parseFloat(price) : price
  if (isNaN(num)) return '0'
  if (num === Math.floor(num)) return num.toString()
  return num.toFixed(2)
}

export default function ConfirmationOrderPage() {
  const { orderId } = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orderId) return

    const fetchOrder = async () => {
      try {
        const res = await apiClient.getOrderByOrderNumber(orderId as string)
        console.log('✅ Order found RES:', JSON.stringify(res, null, 2))
        setOrder(res.order)
      } catch (error: any) {
        if (error.response && error.response.status === 404) {
          console.warn('Commande non trouvée')
          setOrder(null)
        } else {
          console.error('Erreur inattendue chargement commande', error)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <p>Chargement de votre commande...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <ClientLayout>
        <div className="flex flex-col justify-center items-center h-[60vh] text-center space-y-4">
          <p className="text-lg">Commande introuvable.</p>
          <Button onClick={() => router.push('/')}>
            <Home className="w-4 h-4 mr-2" />
            Retour à l'accueil
          </Button>
        </div>
      </ClientLayout>
    )
  }

  // --- Compute totals safely (in case backend doesn’t send them as numbers)
  const subtotal = order.shop_orders.reduce(
    (sum, s) => sum + parseFloat(s.subtotal as string),
    0
  )
  const tax = order.shop_orders.reduce(
    (sum, s) => sum + parseFloat(s.tax as string),
    0
  )
  const shipping = order.shop_orders.reduce(
    (sum, s) => sum + parseFloat(s.shipping_cost as string),
    0
  )
  const total = order.shop_orders.reduce(
    (sum, s) => sum + parseFloat(s.total_amount as string),
    0
  )

  return (
    <ClientLayout>
      <div className="max-w-4xl mx-auto py-10 px-4 space-y-8">
        <div className="flex items-center justify-center text-green-600 space-x-3">
          <CheckCircle className="w-8 h-8" />
          <h1 className="text-2xl font-semibold">Commande confirmée !</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Commande {order.order_number}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Passée le {new Date(order.created_at).toLocaleDateString()}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* --- Détails de la commande --- */}
              <div>
                <h3 className="text-lg font-medium mb-2">Résumé</h3>
                <div className="space-y-4">
                  {order.shop_orders.map((shopOrder, i) => (
                    <div key={i} className="border rounded-md p-4">
                      <h4 className="font-semibold mb-3">
                        {shopOrder.shop_name}
                      </h4>
                      {shopOrder.items.map((item, j) => (
                        <div
                          key={j}
                          className="flex items-center justify-between border-b py-2 last:border-b-0"
                        >
                          <div className="flex items-center space-x-3">
                            {item.product_image_url && (
                              <img
                                src={item.product_image_url}
                                alt={item.product_name}
                                className="w-14 h-14 object-cover rounded-md"
                              />
                            )}
                            <div>
                              <p className="font-medium">
                                {item.product_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Qté: {item.quantity}
                              </p>
                              {item.variant_attributes &&
                                Object.keys(item.variant_attributes).length >
                                  0 && (
                                  <p className="text-xs text-gray-500">
                                    {Object.entries(item.variant_attributes)
                                      .map(([attr, val]) => `${attr}: ${val}`)
                                      .join(', ')}
                                  </p>
                                )}
                            </div>
                          </div>
                          <p className="font-medium">
                            {formatPrice(item.subtotal)} DZD
                          </p>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* --- Totaux --- */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Sous-total</span>
                  <span>{formatPrice(subtotal)} DZD</span>
                </div>
                <div className="flex justify-between">
                  <span>Livraison</span>
                  <span>{formatPrice(shipping)} DZD</span>
                </div>
                <div className="flex justify-between">
                  <span>TVA</span>
                  <span>{formatPrice(tax)} DZD</span>
                </div>
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{formatPrice(total)} DZD</span>
                </div>
              </div>

              <Separator />

              {/* --- Adresse de livraison --- */}
              <div>
                <h3 className="text-lg font-medium mb-2 flex items-center">
                  <Truck className="w-4 h-4 mr-2" />
                  Livraison
                </h3>
                <p>{order.shipping_address.name}</p>
                <p>{order.shipping_address.street}</p>
                <p>
                  {order.shipping_address.city},{' '}
                  {order.shipping_address.postal_code}
                </p>
                <p>{order.shipping_address.country}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Téléphone : {order.shipping_address.phone}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center space-x-4">
          <Button onClick={() => router.push('/')}>
            <Home className="w-4 h-4 mr-2" />
            Retour à l'accueil
          </Button>
        </div>
      </div>
    </ClientLayout>
  )
}
