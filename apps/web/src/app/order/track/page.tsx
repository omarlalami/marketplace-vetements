'use client'

import { useState } from 'react'
import { apiClient } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Truck, Mail, Hash, PackageCheck, Clock } from 'lucide-react'
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
  shop_name: string
  status: string
  items: OrderItem[]
}

interface Order {
  order_number: string
  order_status: string
  payment_status: string
  total_amount: string | number
  order_date: string
  shipping_address: {
    name: string
    email: string
    phone: string
    street: string
    city: string
    postal_code: string
    country: string
  }
  shop_orders: ShopOrder[]
}

export default function OrderTrackingPage() {
  const [email, setEmail] = useState('')
  const [orderNumber, setOrderNumber] = useState('')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

const handleTrack = async () => {
  setLoading(true)
  setError(null)
  setOrder(null)

  const res = await apiClient.getOrderTracking(orderNumber, email)

  if (!res.ok) {
    setError(res.message || 'Commande introuvable.')
  } else {
    setOrder(res.order)
  }

  setLoading(false)
}

  const formatPrice = (price: string | number) => {
    const num = typeof price === 'string' ? parseFloat(price) : price
    return isNaN(num) ? '0' : num.toFixed(2)
  }

  return (
    <ClientLayout>
      <div className="max-w-3xl mx-auto py-10 px-4">
        <h1 className="text-2xl font-semibold text-center mb-8">
          🔎 Suivi de commande
        </h1>

        {/* Formulaire */}
        <Card className="mb-10">
          <CardHeader>
            <CardTitle>Entrez vos informations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Numéro de commande (ex : ORD-2025-656446)"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Adresse e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <Button
                disabled={loading || !email || !orderNumber}
                onClick={handleTrack}
              >
                {loading ? 'Chargement...' : 'Suivre ma commande'}
              </Button>
            </div>

            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
          </CardContent>
        </Card>

        {/* Affichage du suivi */}
        {order && (
          <Card>
            <CardHeader>
            <div className="flex items-center justify-between">
                <CardTitle>Commande {order.order_number}</CardTitle>
                <p className="text-sm text-muted-foreground">
                Passée le {new Date(order.order_date).toLocaleDateString()}
                </p>
            </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* --- Statut --- */}
              <div className="flex flex-col items-start gap-2">
                {/*<div className="flex items-center gap-2">
                  <PackageCheck className="w-5 h-5 text-green-600" />
                  <p>
                    Statut de la commande :{' '}
                    <span className="font-semibold"> {order.order_status} Recu</span>  
                  </p>
                </div>*/}
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <p>
                    Paiement :{' '}
                    <span className="font-semibold">
                      {/* {order.payment_status} */} A la livraison
                    </span>
                  </p>
                </div>
              </div>

              <Separator />

              {/* --- Produits --- */}
              {order.shop_orders.map((shop, i) => (
                <div key={i} className="border rounded-md p-4 mb-3">
                    {/* Ligne Boutique + Statut */}
                    <div className="flex items-center justify-between mb-3">
                    <p className="font-semibold">
                        Boutique : {shop.shop_name}
                    </p>
                    <p className="text-sm text-gray-600">
                        {/*Statut : <span className="font-medium"> Recu  {shop.status} </span>*/}
                    </p>
                    </div>
<Separator />
                    {/* Produits */}
                    {shop.items.map((item, j) => (
                    <div
                        key={j}
                        className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                        <div className="flex items-center gap-3">
                        {item.product_image_url && (
                            <img
                            src={item.product_image_url || '/placeholder-image.png'}
                            alt={item.product_name}
                            className="w-12 h-12 object-cover rounded-md"
                            />
                        )}
                        <div>
                            <p className="font-medium">{item.product_name}</p>
                            {item.variant_attributes &&
                            Object.keys(item.variant_attributes).length > 0 && (
                                <p className="text-xs text-muted-foreground">
                                {Object.entries(item.variant_attributes)
                                    .map(([k, v]) => `${k}: ${v}`)
                                    .join(', ')}
                                </p>
                            )}
                            <p className="text-sm text-muted-foreground">
                            Qté : {item.quantity} × {item.unit_price} DA
                            </p>
                        </div>
                        </div>
                        <p className="font-medium">{formatPrice(item.subtotal)} DZD</p>
                    </div>
                    ))}
                </div>
                ))}

              {/* <Separator /> */}

              {/* --- Livraison --- */}
              {/* <div>
                <h3 className="text-lg font-medium mb-2 flex items-center">
                  <Truck className="w-4 h-4 mr-2" /> Livraison
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
                <p className="text-sm text-muted-foreground">
                  Email : {order.shipping_address.email}
                </p>
              </div> */}

              {/* <Separator /> */}

              {/* --- Total --- */}
              <div className="text-right font-semibold text-lg">
                Total : {formatPrice(order.total_amount)} DZD
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ClientLayout>
  )
}
