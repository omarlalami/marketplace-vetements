'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { apiClient } from '@/lib/api'

interface SidebarResearchProps {
  onFilterChange: (filters: {
    minPrice?: number
    maxPrice?: number
    search?: string
    shopSlug?: string
  }) => void
}

export function SidebarResearch({ onFilterChange }: SidebarResearchProps) {
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [search, setSearch] = useState('')
  const [shopSlug, setShopSlug] = useState('')
  const [shops, setShops] = useState<{ slug: string; name: string }[]>([])
  const [loadingShops, setLoadingShops] = useState(false)

  // 🔹 Charger toutes les boutiques
  useEffect(() => {
    async function fetchShops() {
      setLoadingShops(true)
      try {
        const response = await apiClient.getAllShops()
        const data =
          response?.data?.shops ||
          response?.shops ||
          response ||
          []
        setShops(data)
      } catch (err) {
        console.error('Erreur chargement des shops :', err)
      } finally {
        setLoadingShops(false)
      }
    }

    fetchShops()
  }, [])

  const handleApply = () => {
    onFilterChange({
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      search: search || undefined,
      shopSlug: shopSlug || undefined,
    })
  }

  const handleReset = () => {
    setMinPrice('')
    setMaxPrice('')
    setSearch('')
    setShopSlug('')
    onFilterChange({})
  }

  return (
    <aside className="p-4 bg-white border rounded-xl shadow-sm space-y-5 w-full md:w-64">
      <h2 className="text-lg font-semibold">Filtres</h2>

      {/* 🔍 Recherche par nom / description */}
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Recherche</label>
        <Input
          type="text"
          placeholder="Nom ou description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* 🏪 Filtre par boutique */}
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Boutique</label>
        <Select
          value={shopSlug}
          onValueChange={(value) => setShopSlug(value)}
        >
          <SelectTrigger>
            <SelectValue placeholder={loadingShops ? 'Chargement...' : 'Toutes les boutiques'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les boutiques</SelectItem>
            {shops.map((shop) => (
              <SelectItem key={shop.slug} value={shop.slug}>
                {shop.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 💰 Filtres de prix */}
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Prix minimum</label>
        <Input
          type="number"
          placeholder="Ex: 1000"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Prix maximum</label>
        <Input
          type="number"
          placeholder="Ex: 5000"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
        />
      </div>

      {/* 🔘 Boutons */}
      <div className="flex gap-2 pt-2">
        <Button className="flex-1" onClick={handleApply}>
          Appliquer
        </Button>
        <Button variant="outline" className="flex-1" onClick={handleReset}>
          Réinitialiser
        </Button>
      </div>
    </aside>
  )
}
