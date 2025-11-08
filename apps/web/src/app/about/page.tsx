'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { apiClient } from '@/lib/api'
import { ClientLayout } from '@/components/layout/ClientLayout'
import {
  ArrowRight,
  Star,
  Users,
  Palette,
  ShoppingBag,
  Zap,
  Globe
} from 'lucide-react'
import Image from 'next/image'

// === Types ===
interface Testimonial {
  name: string
  comment: string
  rating: number
}

export default function AboutPage() {

  // === Composant interne ===
  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
        />
      ))}
    </div>
  )

  // === Données statiques ===
  const features = [
    { icon: Palette, title: 'Créateurs uniques', description: 'Découvrez des designers talentueux et authentiques' },
    { icon: Zap, title: 'Mode authentique', description: 'Supportez les créateurs locaux et l\'artisanat algérien' },
    { icon: Globe, title: 'Livraison partout', description: 'Livraison sécurisée à travers toute l\'Algérie' }
  ]

  const testimonials: Testimonial[] = [
    { name: 'Yasmine', comment: 'J\'adore découvrir des pièces uniques de créateurs algériens. La qualité est exceptionnelle!', rating: 5 },
    { name: 'Ahmed', comment: 'Plateforme simple et paiements sécurisés. Très satisfait de mes achats!', rating: 5 },
    { name: 'Fatima', comment: 'Supporter les créateurs locaux tout en trouvant des pièces magnifiques.', rating: 4.5 }
  ]

  // === Render ===
  return (
  <ClientLayout>
    <div className="min-h-screen bg-white">
      {/* HERO SECTION */}
      <section className="relative bg-gradient-to-br from-purple-50 via-white to-blue-50 py-20 sm:py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-20 right-20 w-72 h-72 bg-purple-200 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-72 h-72 bg-blue-200 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-gray-900 mb-6">
              La marketplace des{' '}
              <span className="bg-gradient-to-r from-green-600 via-orange-500 to-red-600 bg-clip-text text-transparent">
                créateurs de mode algériens
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Découvrez des pièces uniques créées par des designers passionnés. Supportez l'artisanat local et exprimez votre style authentique.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700" asChild>
                <Link href="/products">
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  Découvrir les créations
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6" asChild>
                <Link href="/register">
                  <Palette className="mr-2 h-5 w-5" />
                  Devenir créateur
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
              <div>
                <p className="text-2xl font-bold text-purple-600">50+</p>
                <p className="text-sm text-gray-600">Créateurs</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">500+</p>
                <p className="text-sm text-gray-600">Produits</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">2K+</p>
                <p className="text-sm text-gray-600">Clients</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 sm:grid-cols-3 max-w-4xl mx-auto">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="mx-auto mb-6 h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* TESTIMONIALS */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Avis de nos clients</h2>
            <p className="text-gray-600">Ils aiment déjà Fashion Market</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((test, i) => (
              <Card key={i} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="mb-3">
                    <StarRating rating={test.rating} />
                  </div>
                  <p className="text-gray-700 mb-4 italic">"{test.comment}"</p>
                  <p className="font-semibold text-gray-900">— {test.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SECONDARY CTA */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Prêt à partager vos créations ?</h2>
            <p className="text-xl text-gray-600 mb-8">
              Rejoignez notre communauté et vendez vos créations. Créez votre boutique en quelques minutes et commencez à monétiser votre talent.
            </p>

            <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700" asChild>
              <Link href="/register" className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Créer ma boutique Officiel
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      {/* <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-4">À propos</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/about" className="hover:text-white">À propos de nous</Link></li>
                <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/faq" className="hover:text-white">FAQ</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Légal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/terms" className="hover:text-white">Conditions</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Confidentialité</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Nous suivre</h4>
              <div className="flex gap-4">
                <a href="#" className="text-gray-400 hover:text-white">Facebook</a>
                <a href="#" className="text-gray-400 hover:text-white">Instagram</a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2025 Fashion Market. Tous droits réservés.</p>
          </div>
        </div>
      </footer> */}
    </div>
    </ClientLayout>
  )
}