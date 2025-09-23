"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

type FoodSearchInputProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function FoodSearchInput({ value, onChange, placeholder = "搜尋食物..." }: FoodSearchInputProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10"
      />
    </div>
  )
}