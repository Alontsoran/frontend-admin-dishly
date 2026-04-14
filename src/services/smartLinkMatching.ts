/**
 * Smart Link Matching Algorithm
 * Advanced entity linking with context awareness
 * Based on research in entity linking and semantic matching
 */

export interface PageAutocomplete {
  id: string
  title: string
  slug: string
  keywords?: string[]
  description?: string
}

export interface MatchContext {
  sourcePageId?: string
  sourcePageTitle?: string
  surroundingText?: string
  position?: number
}

export interface SmartMatch {
  page: PageAutocomplete
  score: number
  confidence: number
  matchType: 'exact' | 'semantic' | 'contextual' | 'fuzzy'
  reason: string
}

/**
 * Extract meaningful entities from text
 * Uses NLP-like techniques to find important phrases
 */
export function extractEntities(text: string): string[] {
  if (!text) return []
  
  // Remove HTML tags
  const textOnly = text.replace(/<[^>]*>/g, ' ')
  
  // Extract words (Hebrew and English)
  const words = textOnly.match(/[\u0590-\u05FF]+|[a-zA-Z]+/g) || []
  const validWords = words.filter(w => w.length >= 2)
  
  if (validWords.length === 0) return []
  
  const entities: string[] = []
  
  // Priority 1: Long phrases (4-5 words) - most specific
  for (let i = 0; i <= validWords.length - 4; i++) {
    entities.push(`${validWords[i]} ${validWords[i + 1]} ${validWords[i + 2]} ${validWords[i + 3]}`)
  }
  
  // Priority 2: 3-word phrases - very specific
  for (let i = 0; i <= validWords.length - 3; i++) {
    entities.push(`${validWords[i]} ${validWords[i + 1]} ${validWords[i + 2]}`)
  }
  
  // Priority 3: 2-word phrases - common combinations
  for (let i = 0; i <= validWords.length - 2; i++) {
    entities.push(`${validWords[i]} ${validWords[i + 1]}`)
  }
  
  // Priority 4: Single important words (filter common words)
  const commonWords = new Set(['את', 'על', 'ב', 'ל', 'מ', 'של', 'ה', 'ו', 'או', 'כי', 'אם', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'])
  const importantWords = validWords.filter(w => !commonWords.has(w.toLowerCase()))
  entities.push(...importantWords)
  
  // Return unique, sorted by length (longest first)
  return [...new Set(entities)].sort((a, b) => b.length - a.length)
}

/**
 * Calculate semantic similarity between two strings
 * Uses multiple techniques: word overlap, character similarity, position
 */
function semanticSimilarity(str1: string, str2: string): number {
  const lower1 = str1.toLowerCase().trim()
  const lower2 = str2.toLowerCase().trim()
  
  // Exact match
  if (lower1 === lower2) return 1.0
  
  // Word-level similarity
  const words1 = lower1.split(/\s+/)
  const words2 = lower2.split(/\s+/)
  
  // Jaccard similarity (word overlap)
  const set1 = new Set(words1)
  const set2 = new Set(words2)
  const intersection = new Set([...set1].filter(x => set2.has(x)))
  const union = new Set([...set1, ...set2])
  const jaccard = intersection.size / union.size
  
  // Character-level similarity (for typos)
  const charSimilarity = characterSimilarity(lower1, lower2)
  
  // Position-based similarity (words in same order)
  let positionScore = 0
  if (words1.length > 0 && words2.length > 0) {
    let matches = 0
    const minLen = Math.min(words1.length, words2.length)
    for (let i = 0; i < minLen; i++) {
      if (words1[i] === words2[i]) matches++
    }
    positionScore = matches / minLen
  }
  
  // Weighted combination
  return (jaccard * 0.5) + (charSimilarity * 0.3) + (positionScore * 0.2)
}

/**
 * Character-level similarity (Levenshtein-based)
 */
function characterSimilarity(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length)
  if (maxLen === 0) return 1.0
  
  const distance = levenshteinDistance(str1, str2)
  return 1 - (distance / maxLen)
}

/**
 * Levenshtein distance
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
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + 1
        )
      }
    }
  }
  
  return matrix[len1][len2]
}

/**
 * Context-aware matching
 * Considers the surrounding text and page context
 */
function contextualScore(
  entity: string,
  page: PageAutocomplete,
  context: MatchContext
): number {
  let score = 0
  
  // Prevent self-linking
  if (context.sourcePageId === page.id) {
    return -1000 // Strong negative score
  }
  
  // Title matching with context
  const titleLower = page.title.toLowerCase()
  const entityLower = entity.toLowerCase()
  
  // Exact title match
  if (titleLower === entityLower) {
    score += 100
  }
  
  // Title contains entity
  if (titleLower.includes(entityLower)) {
    const position = titleLower.indexOf(entityLower)
    // Beginning of title is better
    const positionBonus = position === 0 ? 20 : 10
    score += 80 + positionBonus
  }
  
  // Entity contains title (for partial matches)
  if (entityLower.includes(titleLower)) {
    score += 60
  }
  
  // Word-level matching
  const entityWords = entityLower.split(/\s+/)
  const titleWords = titleLower.split(/\s+/)
  
  // All entity words in title
  const allWordsMatch = entityWords.every(ew => 
    titleWords.some(tw => tw === ew || tw.includes(ew) || ew.includes(tw))
  )
  
  if (allWordsMatch && entityWords.length > 1) {
    const exactMatches = entityWords.filter(ew => titleWords.includes(ew)).length
    const matchRatio = exactMatches / entityWords.length
    score += 50 + (matchRatio * 20)
  }
  
  // Semantic similarity
  const semantic = semanticSimilarity(entity, page.title)
  if (semantic > 0.7) {
    score += semantic * 40
  }
  
  // Slug matching
  const slugLower = page.slug.toLowerCase()
  if (slugLower === entityLower) {
    score += 90
  } else if (slugLower.includes(entityLower)) {
    score += 70
  }
  
  // Keywords matching
  if (page.keywords && page.keywords.length > 0) {
    const keywordMatch = page.keywords.some(k => 
      k.toLowerCase() === entityLower || 
      k.toLowerCase().includes(entityLower) ||
      entityLower.includes(k.toLowerCase())
    )
    if (keywordMatch) {
      score += 65
    }
  }
  
  // Description matching (lower weight)
  if (page.description) {
    const descLower = page.description.toLowerCase()
    if (descLower.includes(entityLower)) {
      score += 25
    }
  }
  
  // Context-based scoring
  if (context.surroundingText) {
    const contextLower = context.surroundingText.toLowerCase()
    // If surrounding text mentions the page title, boost score
    if (contextLower.includes(titleLower)) {
      score += 15
    }
  }
  
  return score
}

/**
 * Find best matches with smart algorithm
 */
export function findSmartMatches(
  entity: string,
  pages: PageAutocomplete[],
  context: MatchContext = {},
  maxResults: number = 1
): SmartMatch[] {
  if (!entity || entity.length < 2) return []
  
  const matches: SmartMatch[] = []
  
  for (const page of pages) {
    // Skip self-linking
    if (context.sourcePageId === page.id) {
      continue
    }
    
    const score = contextualScore(entity, page, context)
    
    if (score > 30) { // Minimum threshold
      const confidence = Math.min(1.0, score / 100)
      
      let matchType: SmartMatch['matchType'] = 'fuzzy'
      let reason = ''
      
      if (score >= 90) {
        matchType = 'exact'
        reason = 'התאמה מדויקת'
      } else if (score >= 70) {
        matchType = 'semantic'
        reason = 'התאמה סמנטית'
      } else if (score >= 50) {
        matchType = 'contextual'
        reason = 'התאמה קונטקסטואלית'
      } else {
        reason = 'התאמה חלקית'
      }
      
      matches.push({
        page,
        score,
        confidence,
        matchType,
        reason,
      })
    }
  }
  
  // Sort by score (descending)
  matches.sort((a, b) => b.score - a.score)
  
  // Return top results
  return matches.slice(0, maxResults)
}

/**
 * Disambiguate between multiple matches
 * Returns the best match based on score and confidence
 */
export function disambiguate(matches: SmartMatch[]): SmartMatch | null {
  if (matches.length === 0) return null
  if (matches.length === 1) return matches[0]
  
  // Prefer exact matches
  const exactMatch = matches.find(m => m.matchType === 'exact')
  if (exactMatch && exactMatch.score >= 90) return exactMatch
  
  // Prefer highest score with good confidence
  const highConfidence = matches.filter(m => m.confidence >= 0.7)
  if (highConfidence.length > 0) {
    return highConfidence[0]
  }
  
  // Return best match
  return matches[0]
}

