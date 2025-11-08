'use client'

import React from 'react'
import { useCheckoutStore } from '@/stores/checkoutStore'
import { useCartStore } from '@/stores/cartStore'
import { apiClient } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { ClientLayout } from '@/components/layout/ClientLayout'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function CheckoutPage() {
  const { items, getTotalPrice, clearCart } = useCartStore()
  const total = getTotalPrice()
  const router = useRouter()

  const { address, setAddress, isSubmitting, setIsSubmitting, error, setError } = useCheckoutStore()

  const submitOrder = async () => {
    setIsSubmitting(true)
    setError(null)

    const payload = { items, address, total }

    try {
      const result = await apiClient.createOrder(payload)

      if (!result.ok) {
        // 🔹 Affiche proprement le message backend (ex: "Stock insuffisant pour Pulma")
        setError(result.message || 'Erreur pendant la validation de la commande')
        setIsSubmitting(false)
        return
      }

      // Vider le panier
      clearCart()
      
      // Rediriger vers la page de confirmation
      router.push(`/order/confirmation/${result.order.order_number}`)
      setIsSubmitting(false)

    } catch (err: any) {
      console.error('Erreur submit order', err)
      setError(err.response?.data?.message || err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!items || items.length === 0) {
    return (
      <ClientLayout>
        <div className="p-6 text-center">
          <h2 className="text-xl font-semibold">Votre panier est vide</h2>
          <p className="text-gray-600">
            Ajoutez des produits avant de passer à la commande.
          </p>
        </div>
      </ClientLayout>
    )
  }

  return (
    <ClientLayout>
      <div className="min-h-screen bg-gray-50 px-4 py-10">
        <div className="grid lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* Formulaire */}
          <Card>
            <CardHeader>
              <CardTitle>Finalisation commande</CardTitle>
              <CardDescription>Renseignez vos informations</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  submitOrder()
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Prénom</Label>
                    <Input
                      value={address.firstName || ''}
                      onChange={(e) =>
                        setAddress({ ...address, firstName: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label>Nom</Label>
                    <Input
                      value={address.lastName || ''}
                      onChange={(e) =>
                        setAddress({ ...address, lastName: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label>Adresse</Label>
                  <Input
                    value={address.line || ''}
                    onChange={(e) =>
                      setAddress({ ...address, line: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Ville</Label>
                    <Input
                      value={address.city || ''}
                      onChange={(e) =>
                        setAddress({ ...address, city: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label>Code postal</Label>
                    <Input
                      value={address.postalCode || ''}
                      onChange={(e) =>
                        setAddress({ ...address, postalCode: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Pays</Label>
                    <Input
                      value={address.country || ''}
                      onChange={(e) =>
                        setAddress({ ...address, country: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label>Téléphone</Label>
                    <Input
                      type="tel"
                      value={address.phone || ''}
                      onChange={(e) =>
                        setAddress({ ...address, phone: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={address.email || ''}
                    onChange={(e) =>
                      setAddress({ ...address, email: e.target.value })
                    }
                    required
                  />
                </div>

                {error && (
                  <div className="text-red-600 text-sm bg-red-50 border border-red-300 p-2 rounded">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2"
                >
                  {isSubmitting
                    ? 'Validation en cours...'
                    : 'Passer la commande'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Résumé commande */}
          <Card>
            <CardHeader>
              <CardTitle>Résumé de la commande</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border-b pb-3"
                  >
                    <div className="flex items-center gap-3">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-14 h-14 object-cover rounded-md border"
                        />
                      )}

                      <div>
                        <p className="font-medium text-gray-800">{item.name}</p>

                        {item.selectedVariants && (
                          <p className="text-xs text-gray-500">
                            {Object.entries(item.selectedVariants)
                              .map(([key, val]) => `${key}: ${val}`)
                              .join(', ')}
                          </p>
                        )}

                        {item.shopName && (
                          <p className="text-xs text-gray-400">
                            Boutique : {item.shopName}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        {item.quantity} × {item.price.toFixed(2)} €
                      </p>
                      <p className="font-semibold">
                        {(item.price * item.quantity).toFixed(2)} €
                      </p>
                    </div>
                  </div>
                ))}

                <div className="flex justify-between items-center text-lg font-semibold pt-2">
                  <span>Total</span>
                  <span>{total.toFixed(2)} €</span>
                </div>
              </div>

              <p className="text-sm text-gray-500 text-center">
                {items.length} article{items.length > 1 ? 's' : ''} dans le
                panier
              </p>
              <p className="font-medium text-gray-800 text-center">
                Les choix de livraisons seront communiqués par les différentes
                Boutiques
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </ClientLayout>
  )
}
