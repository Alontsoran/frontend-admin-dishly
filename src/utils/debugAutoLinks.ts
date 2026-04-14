/**
 * Debug utility for auto-link suggestions
 * Run this in browser console: debugAutoLinks()
 */

import { getCachedPages, extractKeywords, findMatchingPages } from '@/services/pageCache'

export async function debugAutoLinks() {
  console.log('🔍 בודק מערכת קישורים אוטומטיים (SEO)...')
  console.log('==========================================')
  
  // Check localStorage cache
  const cacheKey = 'pages_autocomplete_cache'
  const timestampKey = 'pages_autocomplete_cache_timestamp'
  const cached = localStorage.getItem(cacheKey)
  const timestamp = localStorage.getItem(timestampKey)
  
  console.log('\n📦 Cache Status:')
  if (cached) {
    try {
      const pages = JSON.parse(cached)
      const age = timestamp ? Date.now() - parseInt(timestamp, 10) : 0
      const ageMinutes = Math.floor(age / 1000 / 60)
      console.log(`✅ Cache קיים: ${pages.length} דפים`)
      console.log(`   גיל: ${ageMinutes} דקות`)
      console.log(`   דוגמאות:`, pages.slice(0, 5).map((p: any) => ({
        title: p.title,
        keywords: p.keywords || [],
      })))
    } catch (e) {
      console.log('❌ Cache פגום:', e)
    }
  } else {
    console.log('❌ אין cache')
  }
  
  // Test API
  console.log('\n🌐 בדיקת API:')
  try {
    const pages = await getCachedPages()
    console.log(`✅ API עובד: ${pages.length} דפים`)
    console.log('   דוגמאות:', pages.slice(0, 5).map(p => ({
      title: p.title,
      slug: p.slug,
      keywords: p.keywords || [],
    })))
    
    // Test keyword extraction
    console.log('\n🔤 בדיקת זיהוי מילות מפתח:')
    const testText = 'אישורי הגעה לחתונה בתל אביב — שירות מקצועי לזוגות'
    console.log(`   טקסט בדיקה: "${testText}"`)
    
    const keywords = extractKeywords(testText)
    console.log(`   מילות מפתח שנמצאו (${keywords.length}):`, keywords)
    
    // Test matching
    console.log('\n🎯 בדיקת התאמות:')
    const testKeyword = 'אישורי הגעה לחתונה'
    const matches = findMatchingPages(testKeyword, pages)
    console.log(`   מילת מפתח: "${testKeyword}"`)
    console.log(`   נמצאו ${matches.length} התאמות:`)
    matches.slice(0, 5).forEach((page, i) => {
      console.log(`   ${i + 1}. ${page.title} (/${page.slug})`)
    })
    
  } catch (error: any) {
    console.log('❌ שגיאת API:', error.message)
  }
  
  // Check if RichTextEditor is mounted
  console.log('\n📝 בדיקת RichTextEditor:')
  const editors = document.querySelectorAll('[contenteditable="true"]')
  console.log(`✅ נמצאו ${editors.length} עורכים`)
  
  // Check for AutoLinkSuggestions component
  console.log('\n🔗 בדיקת AutoLinkSuggestions:')
  const suggestions = document.querySelectorAll('[class*="bg-blue-50"]')
  console.log(`✅ נמצאו ${suggestions.length} קומפוננטות הצעות`)
  
  console.log('\n✅ סיום בדיקה')
  console.log('==========================================')
  console.log('\n💡 טיפים:')
  console.log('1. פתח עורך דף עם RichTextEditor')
  console.log('2. כתוב טקסט עם שם דף קיים (למשל: "אישורי הגעה")')
  console.log('3. בדוק אם מופיעות הצעות מתחת לעורך')
  console.log('4. בדוק את ה-console ללוגים נוספים')
  console.log('\n📊 לבדיקה ידנית:')
  console.log('   - localStorage.getItem("pages_autocomplete_cache")')
  console.log('   - בדוק Network tab ל-API calls')
}

// Make it available globally
if (typeof window !== 'undefined') {
  (window as any).debugAutoLinks = debugAutoLinks
}
