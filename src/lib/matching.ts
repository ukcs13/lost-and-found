import { Database } from '@/types/supabase'

type Item = Database['public']['Tables']['items']['Row']

export interface MatchResult {
  item: Item
  score: number
  reasons: string[]
}

// Tokenize text into set of words
function tokenize(text: string): Set<string> {
  return new Set(
    text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2) // Ignore short words
  )
}

// Jaccard Similarity
function getJaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  const intersection = new Set([...setA].filter(x => setB.has(x)))
  const union = new Set([...setA, ...setB])
  if (union.size === 0) return 0
  return intersection.size / union.size
}

// Haversine Distance (km)
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Radius of earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function findMatches(sourceItem: Item, candidates: Item[]): MatchResult[] {
  const matches: MatchResult[] = []
  
  const sourceTokens = tokenize(`${sourceItem.title} ${sourceItem.description}`)

  for (const candidate of candidates) {
    // Skip if same ID
    if (candidate.id === sourceItem.id) continue
    
    // Skip if same type (lost matches found, found matches lost)
    if (candidate.type === sourceItem.type) continue

    let score = 0
    const reasons: string[] = []

    // 1. Text Matching (40%)
    const candidateTokens = tokenize(`${candidate.title} ${candidate.description}`)
    const textScore = getJaccardSimilarity(sourceTokens, candidateTokens)
    score += textScore * 40
    if (textScore > 0.1) reasons.push(`Text similarity: ${Math.round(textScore * 100)}%`)

    // 2. Category Matching (30%)
    if (sourceItem.category === candidate.category) {
      score += 30
      reasons.push('Category match')
    }

    // 3. Location Matching (30%)
    if (sourceItem.latitude && sourceItem.longitude && candidate.latitude && candidate.longitude) {
      const dist = getDistanceKm(sourceItem.latitude, sourceItem.longitude, candidate.latitude, candidate.longitude)
      // Exponential decay: score is high if close, drops off quickly
      // e.g. 0km -> 30pts, 5km -> ~18pts, 10km -> ~11pts
      const locScore = 30 * Math.exp(-dist / 10) 
      score += locScore
      if (dist < 50) reasons.push(`Location nearby (${dist.toFixed(1)}km)`)
    }

    if (score > 15) { // Threshold
      matches.push({ item: candidate, score, reasons })
    }
  }

  return matches.sort((a, b) => b.score - a.score)
}
