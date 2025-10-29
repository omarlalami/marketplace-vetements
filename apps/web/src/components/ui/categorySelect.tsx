"use client"

import React, { useMemo } from "react"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ChevronRight } from "lucide-react"

interface Category {
  id: string
  name: string
  parent_id: string | null
  children?: Category[]
}

interface Props {
  categories: Category[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function CategorySelect({
  categories,
  value,
  onChange,
  placeholder = "Choisir une catégorie",
}: Props) {
  const flatList = useMemo(() => {
    return categories.flatMap(parent => [
      { id: parent.id, label: parent.name, isParent: true },
      ...(parent.children || []).map(child => ({
        id: child.id,
        label: `${parent.name} > ${child.name}`,
        isParent: false,
      })),
    ])
  }, [categories])

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-700">Catégorie *</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full bg-white border border-gray-300 rounded-md">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="w-full max-h-80 overflow-auto bg-white shadow-lg rounded-md">
          {categories.map(parent => (
            <SelectGroup key={parent.id}>
              <SelectLabel className="font-semibold text-gray-800">
                {parent.name}
              </SelectLabel>
              {parent.children?.map(child => (
                <SelectItem
                key={child.id}
                value={child.id}
                className="pl-4 text-gray-700"
                >
                <div className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <span>{child.name}</span>
                </div>
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
