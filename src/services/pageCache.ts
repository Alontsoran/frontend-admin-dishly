import { api } from './api'

export interface PageAutocomplete {
  id: string
  title: string
  slug: string
  keywords?: string[]
  description?: string
}

const CACHE_KEY = 'pages_autocomplete_cache'
const CACHE_TIMESTAMP_KEY = 'pages_autocomplete_cache_timestamp'
const CACHE_DURATION = 1000 * 60 * 60 // 1 hour

/**
 * Get cached pages or fetch from API
 */
export async function getCachedPages(): Promise<PageAutocomplete[]> {
  // Check cache first
  const cached = localStorage.getItem(CACHE_KEY)
  const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY)
  
  if (cached && timestamp) {
    const age = Date.now() - parseInt(timestamp, 10)
    if (age < CACHE_DURATION) {
      try {
        return JSON.parse(cached)
      } catch {
        // Invalid cache, continue to fetch
      }
    }
  }

  // Fetch from API
  try {
    const response = await api.get('/pages/autocomplete')
    const pages = response.data.data || []
    
    // Update cache
    localStorage.setItem(CACHE_KEY, JSON.stringify(pages))
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString())
    
    return pages
  } catch (error) {
    console.error('Error fetching pages for autocomplete:', error)
    // Return cached data even if expired, as fallback
    if (cached) {
      try {
        return JSON.parse(cached)
      } catch {
        return []
      }
    }
    return []
  }
}

/**
 * Invalidate cache (call after page create/update/delete)
 */
export function invalidatePageCache() {
  localStorage.removeItem(CACHE_KEY)
  localStorage.removeItem(CACHE_TIMESTAMP_KEY)
}

/**
 * Find matching pages by keyword with smart algorithm
 * Uses context-aware entity linking
 */
export function findMatchingPages(
  keyword: string, 
  pages: PageAutocomplete[],
  sourcePageId?: string
): PageAutocomplete[] {
  if (!keyword || keyword.length < 2) return []
  
  try {
    // Use smart matching algorithm
    const { findSmartMatches, disambiguate } = require('./smartLinkMatching')
    const matches = findSmartMatches(
      keyword, 
      pages, 
      { sourcePageId },
      1 // Only best match
    )
    
    // Disambiguate and return best match
    const bestMatch = disambiguate(matches)
    if (bestMatch && bestMatch.score >= 50) { // Minimum quality threshold
      return [bestMatch.page]
    }
    
    return []
  } catch (error) {
    console.error('Smart matching error, using fallback:', error)
    // Fallback to simple matching
    return findMatchingPagesSimple(keyword, pages)
  }
}

/**
 * Simple fallback matching
 */
function findMatchingPagesSimple(keyword: string, pages: PageAutocomplete[]): PageAutocomplete[] {
  const lowerKeyword = keyword.toLowerCase().trim()
  
  const scoredPages = pages
    .map(page => {
      const lowerTitle = page.title.toLowerCase()
      const lowerSlug = page.slug.toLowerCase()
      let score = 0
      
      if (lowerTitle === lowerKeyword) score = 100
      else if (lowerTitle.includes(lowerKeyword)) score = 60
      if (lowerSlug === lowerKeyword) score = Math.max(score, 90)
      else if (lowerSlug.includes(lowerKeyword)) score = Math.max(score, 50)
      
      return { page, score }
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
  
  return scoredPages.map(item => item.page)
}

/**
 * Extract keywords and phrases from text (Smart entity extraction)
 */
export function extractKeywords(text: string): string[] {
  if (!text) return []
  
  try {
    // Use smart entity extraction
    const { extractEntities } = require('./smartLinkMatching')
    return extractEntities(text)
  } catch (error) {
    // Fallback to simple extraction
    return extractKeywordsSimple(text)
  }
}

/**
 * Simple fallback extraction
 */
function extractKeywordsSimple(text: string): string[] {
  const textOnly = text.replace(/<[^>]*>/g, ' ')
  const words = textOnly.match(/[\u0590-\u05FF]+|[a-zA-Z]+/g) || []
  const validWords = words.filter(w => w.length >= 2)
  const singleKeywords = [...new Set(validWords)]
  
  const twoWordPhrases: string[] = []
  for (let i = 0; i < validWords.length - 1; i++) {
    twoWordPhrases.push(`${validWords[i]} ${validWords[i + 1]}`)
  }
  
  const threeWordPhrases: string[] = []
  for (let i = 0; i < validWords.length - 2; i++) {
    threeWordPhrases.push(`${validWords[i]} ${validWords[i + 1]} ${validWords[i + 2]}`)
  }
  
  return [...new Set([...threeWordPhrases, ...twoWordPhrases, ...singleKeywords])]
}

