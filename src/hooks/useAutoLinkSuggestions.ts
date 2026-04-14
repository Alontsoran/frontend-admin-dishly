import { useState, useEffect } from 'react'
import { getCachedPages, findMatchingPages, extractKeywords, PageAutocomplete } from '@/services/pageCache'

export interface LinkSuggestion {
  keyword: string
  page: PageAutocomplete
  startIndex: number
  endIndex: number
}

export function useAutoLinkSuggestions(text: string) {
  const [pages, setPages] = useState<PageAutocomplete[]>([])
  const [suggestions, setSuggestions] = useState<LinkSuggestion[]>([])
  const [loading, setLoading] = useState(true)

  // Load pages from cache
  useEffect(() => {
    let mounted = true
    
    getCachedPages().then((cachedPages) => {
      if (mounted) {
        setPages(cachedPages)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
    }
  }, [])

  // Find suggestions in text using SEO-aware algorithm
  useEffect(() => {
    if (!text || pages.length === 0) {
      setSuggestions([])
      return
    }

    const foundSuggestions: LinkSuggestion[] = []
    
    // Remove HTML tags for text matching, but keep original for position tracking
    const textOnly = text.replace(/<[^>]*>/g, ' ')
    
    // Extract keywords and phrases from text (SEO-aware)
    const keywords = extractKeywords(text)
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 AutoLink SEO Debug:', {
        textLength: text.length,
        textOnlyLength: textOnly.length,
        keywordsCount: keywords.length,
        keywords: keywords.slice(0, 10),
        pagesCount: pages.length,
      })
    }
    
      // For each keyword/phrase, find best matching pages
      keywords.forEach((keyword) => {
        // Note: sourcePageId not available in hook, but will be filtered in RichTextEditor
        const matchingPages = findMatchingPages(keyword, pages)
      
      if (matchingPages.length > 0) {
        // Use the best match (first in sorted list)
        const bestMatch = matchingPages[0]
        
        // Find all occurrences of this keyword in the text (case-insensitive)
        const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const regex = new RegExp(escapedKeyword, 'gi')
        let match
        
        // Reset regex lastIndex for multiple matches
        regex.lastIndex = 0
        
        while ((match = regex.exec(textOnly)) !== null) {
          // Map plain text position to HTML position
          let htmlIndex = 0
          let textIndex = 0
          let tagDepth = 0
          
          for (let i = 0; i < text.length && textIndex <= match.index; i++) {
            if (text[i] === '<') {
              // Check if it's a closing tag
              if (i + 1 < text.length && text[i + 1] === '/') {
                tagDepth--
              } else {
                tagDepth++
              }
              // Skip HTML tag
              while (i < text.length && text[i] !== '>') i++
              continue
            }
            
            // Only count text outside HTML tags
            if (tagDepth === 0) {
              if (textIndex === match.index) {
                htmlIndex = i
                break
              }
              textIndex++
            }
          }
          
          // Check if already inside a link
          const beforeText = text.substring(Math.max(0, htmlIndex - 200), htmlIndex)
          const isInsideLink = beforeText.includes('<a ') && 
            (beforeText.lastIndexOf('</a>') < beforeText.lastIndexOf('<a ') || !beforeText.includes('</a>'))
          
          if (!isInsideLink) {
            foundSuggestions.push({
              keyword: match[0],
              page: bestMatch,
              startIndex: htmlIndex,
              endIndex: htmlIndex + match[0].length,
            })
          }
        }
      }
    })

    // Remove duplicates (same position) and prefer longer keywords
    const uniqueSuggestions = foundSuggestions
      .sort((a, b) => {
        // First sort by position
        if (a.startIndex !== b.startIndex) {
          return a.startIndex - b.startIndex
        }
        // If same position, prefer longer keyword (more specific)
        return b.keyword.length - a.keyword.length
      })
      .filter((s, index, self) => {
        // Remove if overlaps with a longer keyword at same position
        if (index > 0) {
          const prev = self[index - 1]
          if (prev.startIndex === s.startIndex && prev.keyword.length > s.keyword.length) {
            return false
          }
        }
        // Remove exact duplicates
        return index === self.findIndex((t) => 
          t.startIndex === s.startIndex && t.endIndex === s.endIndex && t.page.id === s.page.id
        )
      })

    if (process.env.NODE_ENV === 'development') {
      if (uniqueSuggestions.length > 0) {
        console.log('✅ נמצאו הצעות SEO:', uniqueSuggestions.map(s => ({
          keyword: s.keyword,
          page: s.page.title,
          score: 'calculated'
        })))
      } else {
        console.log('ℹ️ לא נמצאו התאמות')
      }
    }

    setSuggestions(uniqueSuggestions)
  }, [text, pages])

  return { suggestions, loading, pages }
}

