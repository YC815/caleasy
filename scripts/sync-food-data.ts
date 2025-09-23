import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

interface FoodData {
  id: string
  name: string
  category: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

function parseCsvLine(line: string): string[] {
  return line.split(',').map(cell => cell.trim())
}

function parseFood(row: string[]): FoodData | null {
  if (row.length !== 7) {
    console.warn(`Skip invalid row: ${row.join(',')}`)
    return null
  }

  const [id, name, category, calories, protein, carbs, fat] = row

  if (!id || id === '000000' || !name || !category) {
    return null
  }

  return {
    id,
    name,
    category,
    calories: parseInt(calories),
    protein: parseFloat(protein),
    carbs: parseFloat(carbs),
    fat: parseFloat(fat)
  }
}

async function syncFoodData() {
  try {
    console.log('🚀 Starting CSV sync...')

    const csvPath = join(process.cwd(), 'public', 'food_data.csv')
    const csvContent = readFileSync(csvPath, 'utf-8')
    const lines = csvContent.split('\n').filter(line => line.trim())

    console.log(`📄 Found ${lines.length} lines in CSV`)

    const header = lines[0]
    console.log(`📋 Header: ${header}`)

    const foods: FoodData[] = []

    for (let i = 1; i < lines.length; i++) {
      const row = parseCsvLine(lines[i])
      const food = parseFood(row)
      if (food) {
        foods.push(food)
      }
    }

    console.log(`✅ Parsed ${foods.length} valid food items`)

    let created = 0
    let updated = 0
    const batchSize = 50

    for (let i = 0; i < foods.length; i += batchSize) {
      const batch = foods.slice(i, i + batchSize)

      console.log(`⚡ Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(foods.length / batchSize)}`)

      const promises = batch.map(async (food) => {
        try {
          const existing = await prisma.food.findUnique({
            where: { id: food.id }
          })

          await prisma.food.upsert({
            where: { id: food.id },
            update: {
              name: food.name,
              category: food.category,
              caloriesPer100g: food.calories,
              proteinPer100g: food.protein,
              carbsPer100g: food.carbs,
              fatPer100g: food.fat,
              isPublished: true
            },
            create: {
              id: food.id,
              name: food.name,
              category: food.category,
              caloriesPer100g: food.calories,
              proteinPer100g: food.protein,
              carbsPer100g: food.carbs,
              fatPer100g: food.fat,
              isPublished: true
            }
          })

          return existing ? 'updated' : 'created'
        } catch (error) {
          console.error(`❌ Failed to sync food ${food.id}: ${error}`)
          throw error
        }
      })

      const results = await Promise.all(promises)
      created += results.filter(r => r === 'created').length
      updated += results.filter(r => r === 'updated').length
    }

    console.log(`🎉 Sync completed:`)
    console.log(`   • Created: ${created} items`)
    console.log(`   • Updated: ${updated} items`)
    console.log(`   • Total: ${foods.length} items`)

  } catch (error) {
    console.error('❌ Sync failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  syncFoodData()
}

export { syncFoodData }