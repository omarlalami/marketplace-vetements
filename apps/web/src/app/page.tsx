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
interface Product {
  id: string
  slug: string
  name: string
  shop_name?: string
  description?: string
  rating?: number
  category_name: string
  reviews?: number
  price?: number
  min_price: number
  max_price: number
  primary_image?: { url: string; key: string } | null // 👈 objet, pas tableau
}
interface Category {
  id: string
  slug: string
  name: string
  count?: number
}
interface LocalCategory extends Category {
  image: string
}
interface Testimonial {
  name: string
  comment: string
  rating: number
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<LocalCategory[]>([])
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)

  // === Produits ===
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData] = await Promise.all([apiClient.getProducts({ limit: 4 })])
        setProducts(productsData.products)
      } catch (error) {
        console.error('Erreur:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // === Catégories ===
// === Catégories (statiques) ===
useEffect(() => {
  const staticCategories: LocalCategory[] = [
    { id: "36d6d666-ef0a-49ba-9c33-13e0613e4484", slug: "accessoires", name: "Accessoires", count: 0, image: "/placeholder-accessoires.jpg" },
    { id: "84cbc544-ed24-4fc5-8a64-2cd48559a84a", slug: "enfant", name: "Enfant", count: 0, image: "/placeholder-enfant.jpg" },
    { id: "3f463b05-f68a-4918-8a23-7fdb9d8bbf6e", slug: "femme", name: "Femme", count: 0, image: "/placeholder-femme.jpg" },
    { id: "a2dfcda7-e555-4888-9319-50574f1e1424", slug: "homme", name: "Homme", count: 0, image: "/placeholder-homme.png" },
  ]

  setCategories(staticCategories)
}, [])

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
  // === Newsletter ===
  const handleNewsletterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log('Newsletter:', email)
    setEmail('')
  }

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

const creators = [
  {
    name: 'MadeInDZ',
    desc: 'Sacs et accessoires artisanaux',
    products: 8,
    image: '/placeholder-madeindz.avif',
  },
  {
    name: 'Sahara Mode',
    desc: 'Écharpes et foulards traditionnels',
    products: 12,
    image: '/placeholder-saharamode.jpg',
  },
  {
    name: 'OranVibes',
    desc: 'Casquettes et accessoires modernes',
    products: 15,
    image: '/placeholder-oran.jpg',
  },
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

      {/* FEATURED PRODUCTS SECTION */}

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Produits en vedette</h2>
            <p className="text-gray-600">Les créations les plus populaires du moment</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => {
            const imageUrl =
              product.primary_image && product.primary_image.url
                ? product.primary_image.url
                : '/placeholder-product.jpg'


              return (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="group"
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
                    {/* IMAGE */}
                    <div className="relative w-full h-48 bg-gray-100 overflow-hidden">
                      <Image
                        src={imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw,
                              (max-width: 1200px) 50vw,
                              25vw"
                        onError={(e) => {
                          // Fallback si l'image échoue
                          (e.target as HTMLImageElement).src = '/placeholder-product.jpg'
                        }}
                      />

                    {(product.min_price || product.max_price) && (
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-white text-black hover:bg-white">
                          {formatPrice(product.min_price ?? 0)} DZD
                        </Badge>
                      </div>
                    )}
                    </div>
                    {/* CONTENT */}
                    <CardContent className="p-4 flex-1 flex flex-col">
                      <CardTitle className="text-base font-semibold mb-1 line-clamp-2">
                        {product.name}
                      </CardTitle>
                      <p className="text-xs text-gray-500 mb-2">{product.shop_name}</p>
                      {product.category_name && (
                        <p className="text-sm text-muted-foreground">
                          {product.category_name}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* CREATORS SPOTLIGHT */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Créateurs en vedette</h2>
            <p className="text-gray-600">Découvrez les talents qui façonnent la mode algérienne</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {creators.map((creator, i) => (
              <Card key={i} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-40 overflow-hidden">
                  <Image
                    src={creator.image}
                    alt={creator.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-10 transition"></div>
                </div>
                <CardContent className="p-6 text-center">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{creator.name}</h3>
                  <p className="text-gray-600 mb-4">{creator.desc}</p>
                  <p className="text-sm text-purple-600 font-medium mb-4">{creator.products} produits</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES SECTION */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Explorez par catégorie</h2>
            <p className="text-gray-600">Trouvez exactement ce que vous cherchez</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <Link key={cat.id} href={`/${cat.slug}`} className="group">
                <div className="bg-white rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow">
                  <div className="relative h-40 overflow-hidden">
                    <Image
                      src={cat.image}
                      alt={cat.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-10 transition"></div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">{cat.name}</h3>
                  </div>
                </div>
              </Link>
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