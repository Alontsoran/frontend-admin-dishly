/**
 * Advanced link matching algorithm
 * Uses multiple techniques for better keyword matching:
 * - Fuzzy matching (Levenshtein distance)
 * - Partial matching
 * - Multi-word phrase extraction
 * - Context-aware scoring
 * - Disambiguation
 */

export interface PageAutocomplete {
  id: string
  title: string
  slug: string
  keywords?: string[]
  description?: string
}

export interface MatchResult {
  page: PageAutocomplete
  score: number
  matchType: 'exact' | 'fuzzy' | 'partial' | 'phrase' | 'synonym'
  matchedText: string
  confidence: number
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length
  const len2 = str2.length
  const matrix: number[][] = []

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,     // deletion
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j - 1] + 1  // substitution
        )
      }
    }
  }

  return matrix[len1][len2]
}

/**
 * Calculate similarity ratio (0-1) between two strings
 */
function similarityRatio(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length)
  if (maxLen === 0) return 1
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase())
  return 1 - (distance / maxLen)
}

/**
 * Extract all possible phrases from text (1-4 words)
 */
export function extractAdvancedKeywords(text: string): string[] {
  if (!text) return []
  
  // Remove HTML tags
  const textOnly = text.replace(/<[^>]*>/g, ' ')
  
  // Extract words (Hebrew and English)
  const words = textOnly.match(/[\u0590-\u05FF]+|[a-zA-Z]+/g) || []
  const validWords = words.filter(w => w.length >= 2)
  
  if (validWords.length === 0) return []
  
  const phrases: string[] = []
  
  // Extract 1-word phrases
  phrases.push(...validWords)
  
  // Extract 2-word phrases
  for (let i = 0; i < validWords.length - 1; i++) {
    phrases.push(`${validWords[i]} ${validWords[i + 1]}`)
  }
  
  // Extract 3-word phrases
  for (let i = 0; i < validWords.length - 2; i++) {
    phrases.push(`${validWords[i]} ${validWords[i + 1]} ${validWords[i + 2]}`)
  }
  
  // Extract 4-word phrases (for longer terms)
  for (let i = 0; i < validWords.length - 3; i++) {
    phrases.push(`${validWords[i]} ${validWords[i + 1]} ${validWords[i + 2]} ${validWords[i + 3]}`)
  }
  
  // Return unique phrases, sorted by length (longer first)
  return [...new Set(phrases)].sort((a, b) => b.length - a.length)
}

/**
 * Advanced matching with multiple techniques
 */
function findMatches(keyword: string, page: PageAutocomplete): MatchResult[] {
  const results: MatchResult[] = []
  const lowerKeyword = keyword.toLowerCase().trim()
  const lowerTitle = page.title.toLowerCase()
  const lowerSlug = page.slug.toLowerCase()
  const lowerDescription = (page.description || '').toLowerCase()
  const lowerKeywords = (page.keywords || []).map(k => k.toLowerCase())
  
  // 1. Exact match in title (highest priority)
  if (lowerTitle === lowerKeyword) {
    results.push({
      page,
      score: 100,
      matchType: 'exact',
      matchedText: page.title,
      confidence: 1.0,
    })
  }
  
  // 2. Title contains keyword (exact phrase)
  if (lowerTitle.includes(lowerKeyword) && lowerTitle !== lowerKeyword) {
    const position = lowerTitle.indexOf(lowerKeyword)
    const positionScore = position === 0 ? 0.9 : 0.7 // Beginning of title is better
    results.push({
      page,
      score: 80 * positionScore,
      matchType: 'phrase',
      matchedText: page.title,
      confidence: 0.85,
    })
  }
  
  // 3. Slug exact match
  if (lowerSlug === lowerKeyword) {
    results.push({
      page,
      score: 90,
      matchType: 'exact',
      matchedText: page.slug,
      confidence: 0.95,
    })
  }
  
  // 4. Slug contains keyword
  if (lowerSlug.includes(lowerKeyword) && lowerSlug !== lowerKeyword) {
    results.push({
      page,
      score: 70,
      matchType: 'partial',
      matchedText: page.slug,
      confidence: 0.75,
    })
  }
  
  // 5. Keywords array match
  if (lowerKeywords.includes(lowerKeyword)) {
    results.push({
      page,
      score: 75,
      matchType: 'exact',
      matchedText: lowerKeyword,
      confidence: 0.8,
    })
  }
  
  // 6. Fuzzy matching on title (for typos/variations)
  const titleSimilarity = similarityRatio(lowerKeyword, lowerTitle)
  if (titleSimilarity >= 0.7 && titleSimilarity < 1.0) {
    results.push({
      page,
      score: 60 * titleSimilarity,
      matchType: 'fuzzy',
      matchedText: page.title,
      confidence: titleSimilarity,
    })
  }
  
  // 7. Partial word matching (keyword is part of title words or vice versa)
  const titleWords = lowerTitle.split(/\s+/)
  const keywordWords = lowerKeyword.split(/\s+/)
  
  // Check if all keyword words appear in title
  const allWordsMatch = keywordWords.every(kw => 
    titleWords.some(tw => tw.includes(kw) || kw.includes(tw))
  )
  
  if (allWordsMatch && lowerTitle !== lowerKeyword) {
    const matchRatio = keywordWords.filter(kw => 
      titleWords.some(tw => tw === kw)
    ).length / keywordWords.length
    
    results.push({
      page,
      score: 50 + (matchRatio * 20),
      matchType: 'partial',
      matchedText: page.title,
      confidence: 0.6 + (matchRatio * 0.2),
    })
  }
  
  // 8. Description match
  if (lowerDescription.includes(lowerKeyword)) {
    results.push({
      page,
      score: 30,
      matchType: 'partial',
      matchedText: page.description || '',
      confidence: 0.5,
    })
  }
  
  // 9. Multi-word phrase matching (check if title contains all words from keyword)
  if (keywordWords.length > 1) {
    const wordsInTitle = keywordWords.filter(kw => lowerTitle.includes(kw)).length
    const phraseMatchRatio = wordsInTitle / keywordWords.length
    
    if (phraseMatchRatio >= 0.6) {
      results.push({
        page,
        score: 40 + (phraseMatchRatio * 20),
        matchType: 'phrase',
        matchedText: page.title,
        confidence: 0.55 + (phraseMatchRatio * 0.2),
      })
    }
  }
  
  return results
}

/**
 * Find best matching pages for a keyword with advanced algorithm
 */
export function findBestMatches(
  keyword: string,
  pages: PageAutocomplete[],
  maxResults: number = 5
): MatchResult[] {
  if (!keyword || keyword.length < 2) return []
  
  const allMatches: MatchResult[] = []
  
  // Find matches for all pages
  for (const page of pages) {
    const matches = findMatches(keyword, page)
    allMatches.push(...matches)
  }
  
  // Sort by score (descending) and confidence
  const sortedMatches = allMatches
    .sort((a, b) => {
      // Primary sort: score
      if (b.score !== a.score) {
        return b.score - a.score
      }
      // Secondary sort: confidence
      return b.confidence - a.confidence
    })
    .filter((match, index, self) => {
      // Remove duplicates (same page)
      return index === self.findIndex(m => m.page.id === match.page.id)
    })
    .slice(0, maxResults)
  
  // Filter out low-confidence matches
  return sortedMatches.filter(m => m.confidence >= 0.5 && m.score >= 30)
}

/**
 * Disambiguate between multiple matches
 * Returns the best match based on context and scoring
 */
export function disambiguateMatches(matches: MatchResult[]): MatchResult | null {
  if (matches.length === 0) return null
  if (matches.length === 1) return matches[0]
  
  // Prefer exact matches
  const exactMatch = matches.find(m => m.matchType === 'exact')
  if (exactMatch) return exactMatch
  
  // Prefer highest score
  return matches[0]
}

