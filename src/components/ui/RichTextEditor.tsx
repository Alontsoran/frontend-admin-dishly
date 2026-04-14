'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link,
  Image,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Code2,
  Eye,
} from 'lucide-react'
import { cn } from '@/utils/cn'

// Debug helper
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  import('@/utils/debugAutoLinks').then(({ debugAutoLinks }) => {
    (window as any).debugAutoLinks = debugAutoLinks
  })
}

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  sourcePageId?: string // For preventing self-linking
}

export default function RichTextEditor({ value, onChange, placeholder, sourcePageId }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const htmlTextareaRef = useRef<HTMLTextAreaElement>(null)
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkText, setLinkText] = useState('')
  const [isInitialized, setIsInitialized] = useState(false)
  const [showHtmlView, setShowHtmlView] = useState(false)
  const savedSelectionRef = useRef<Range | null>(null)

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const handleFormat = (command: string) => {
    execCommand(command)
  }

  const handleHeading = (level: string) => {
    execCommand('formatBlock', level)
  }

  const handleAlign = (alignment: string) => {
    execCommand(alignment)
  }

  const handleLink = () => {
    const selection = window.getSelection()
    if (selection && selection.toString() && selection.rangeCount > 0) {
      // Save the selection
      savedSelectionRef.current = selection.getRangeAt(0).cloneRange()
      setLinkText(selection.toString())
      setIsLinkDialogOpen(true)
    } else {
      alert('אנא בחר טקסט תחילה')
    }
  }

  const insertLink = (url?: string, text?: string) => {
    const finalUrl = url || linkUrl
    const finalText = text || linkText
    
    if (finalUrl && finalText && savedSelectionRef.current) {
      // Restore the saved selection
      const selection = window.getSelection()
      if (selection) {
        selection.removeAllRanges()
        selection.addRange(savedSelectionRef.current)
        
        // Create link HTML
        const linkHtml = `<a href="${finalUrl}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline;">${finalText}</a>`
        
        // Insert the link
        const range = selection.getRangeAt(0)
        range.deleteContents()
        
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = linkHtml
        const linkNode = tempDiv.firstChild
        
        if (linkNode) {
          range.insertNode(linkNode)
          
          // Move cursor after the link
          range.setStartAfter(linkNode)
          range.collapse(true)
          selection.removeAllRanges()
          selection.addRange(range)
        }
        
        // Update content
        if (editorRef.current) {
          onChange(editorRef.current.innerHTML)
        }
      }
      
      // Close dialog
      setIsLinkDialogOpen(false)
      setLinkUrl('')
      setLinkText('')
      savedSelectionRef.current = null
    }
  }

  const handleImage = () => {
    const url = prompt('הזן כתובת URL של תמונה:')
    if (url) {
      execCommand('insertImage', url)
    }
  }

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  // Auto-apply links function
  const autoApplyLinks = useCallback(() => {
    const editor = editorRef.current
    if (!editor || !value) return

    // Import hook logic directly for auto-apply
    import('@/services/pageCache').then(({ getCachedPages, extractKeywords, findMatchingPages }) => {
      getCachedPages().then((pages) => {
        if (pages.length === 0 || !editorRef.current) return

        const keywords = extractKeywords(value)
        
        // Find best matches (only high-quality matches)
        const appliedLinks = new Set<string>() // Track already applied links
        let appliedCount = 0
        const MAX_AUTO_LINKS = 5 // Maximum auto-links per text
        
        // Process keywords in reverse order (longer phrases first)
        const sortedKeywords = [...keywords].sort((a, b) => b.length - a.length)
        
        let currentContent = value
        
        for (const keyword of sortedKeywords) {
          if (appliedCount >= MAX_AUTO_LINKS) break
          
          // Pass sourcePageId to prevent self-linking
          const matches = findMatchingPages(keyword, pages, sourcePageId)
          if (matches.length === 0) continue
          
          const bestMatch = matches[0]
          
          // Double-check: prevent self-linking
          if (sourcePageId && bestMatch.id === sourcePageId) {
            continue
          }
          
          const linkKey = `${bestMatch.id}-${keyword}`
          
          // Skip if already applied
          if (appliedLinks.has(linkKey)) continue
          
          // Check if keyword exists in text and not already linked or in headings (H1-H6)
          const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const regex = new RegExp(`(?!<a[^>]*>.*?)(${escapedKeyword})(?![^<]*</a>)`, 'gi')
          let match
          
          // Find all matches and filter out those inside headings
          while ((match = regex.exec(currentContent)) !== null) {
            // Check if we're inside a heading tag (H1-H6)
            const beforeMatch = currentContent.substring(Math.max(0, match.index - 500), match.index)
            
            // Find all opening heading tags before this position
            const headingOpenMatches = beforeMatch.match(/<h[1-6][^>]*>/gi) || []
            // Find all closing heading tags before this position
            const headingCloseMatches = beforeMatch.match(/<\/h[1-6]>/gi) || []
            
            // If there are more opening tags than closing tags, we're inside a heading
            const isInsideHeading = headingOpenMatches.length > headingCloseMatches.length
            
            if (!isInsideHeading) {
              // Apply link - replace only this occurrence
              const linkHtml = `<a href="/${bestMatch.slug}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline;">${keyword}</a>`
              currentContent = currentContent.substring(0, match.index) + 
                              linkHtml + 
                              currentContent.substring(match.index + match[0].length)
              
              // Update regex lastIndex to continue from after the link
              regex.lastIndex = match.index + linkHtml.length
              
              appliedLinks.add(linkKey)
              appliedCount++
              
              if (process.env.NODE_ENV === 'development') {
                console.log(`✅ הוסף קישור אוטומטי: "${keyword}" → ${bestMatch.title}`)
              }
              
              // Only apply first match per keyword to avoid duplicates
              break
            }
          }
        }
        
        // Apply all changes at once
        if (currentContent !== value && editorRef.current) {
          editorRef.current.innerHTML = currentContent
          onChange(currentContent)
          
          if (appliedCount > 0 && process.env.NODE_ENV === 'development') {
            console.log(`✅ נוספו ${appliedCount} קישורים אוטומטיים`)
          }
        }
      }).catch((error) => {
        console.error('Error in auto-apply links:', error)
      })
    })
  }, [value, onChange])

  // Auto-apply links with debounce
  const autoApplyTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  useEffect(() => {
    // Clear previous timeout
    if (autoApplyTimeoutRef.current) {
      clearTimeout(autoApplyTimeoutRef.current)
    }

    // Only auto-apply if there's content and we're not in HTML view
    if (!value || showHtmlView || !editorRef.current) {
      return
    }

    // Debounce: wait 3 seconds after user stops typing
    autoApplyTimeoutRef.current = setTimeout(() => {
      autoApplyLinks()
    }, 3000)

    return () => {
      if (autoApplyTimeoutRef.current) {
        clearTimeout(autoApplyTimeoutRef.current)
      }
    }
  }, [value, showHtmlView, autoApplyLinks])

  // Initialize content only once
  useEffect(() => {
    if (editorRef.current && !isInitialized) {
      editorRef.current.innerHTML = value || ''
      setIsInitialized(true)
    }
  }, [value, isInitialized])

  // Handle HTML view toggle
  const toggleHtmlView = () => {
    if (showHtmlView) {
      // Switching from HTML view to visual editor
      if (htmlTextareaRef.current && editorRef.current) {
        const htmlContent = htmlTextareaRef.current.value
        editorRef.current.innerHTML = htmlContent
        onChange(htmlContent)
      }
    }
    setShowHtmlView(!showHtmlView)
  }

  // Update HTML textarea when value changes (only if not in HTML view)
  useEffect(() => {
    if (htmlTextareaRef.current && !showHtmlView && editorRef.current) {
      htmlTextareaRef.current.value = editorRef.current.innerHTML || value || ''
    }
  }, [value, showHtmlView])

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-1">
        <div className="flex gap-1 border-l pl-2">
          <button
            type="button"
            onClick={() => handleHeading('h1')}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="כותרת 1"
          >
            <Heading1 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleHeading('h2')}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="כותרת 2"
          >
            <Heading2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleHeading('h3')}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="כותרת 3"
          >
            <Heading3 className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-1 border-l pl-2">
          <button
            type="button"
            onClick={() => handleFormat('bold')}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="מודגש"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleFormat('italic')}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="נטוי"
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleFormat('underline')}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="קו תחתון"
          >
            <Underline className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-1 border-l pl-2">
          <button
            type="button"
            onClick={() => handleAlign('justifyRight')}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="יישור לימין"
          >
            <AlignRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleAlign('justifyCenter')}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="יישור למרכז"
          >
            <AlignCenter className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleAlign('justifyLeft')}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="יישור לשמאל"
          >
            <AlignLeft className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-1 border-l pl-2">
          <button
            type="button"
            onClick={() => handleFormat('insertUnorderedList')}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="רשימת תבליטים"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleFormat('insertOrderedList')}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="רשימה ממוספרת"
          >
            <ListOrdered className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-1 border-l pl-2">
          <button
            type="button"
            onClick={handleLink}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="הוסף קישור"
          >
            <Link className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleImage}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="הוסף תמונה"
          >
            <Image className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('formatBlock', 'pre')}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="קוד"
          >
            <Code className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-1 border-l pl-2">
          <button
            type="button"
            onClick={toggleHtmlView}
            className={cn(
              "p-2 hover:bg-gray-200 rounded transition-colors",
              showHtmlView && "bg-blue-100 hover:bg-blue-200"
            )}
            title={showHtmlView ? "הצג עורך ויזואלי" : "הצג תגיות HTML"}
          >
            {showHtmlView ? <Eye className="h-4 w-4" /> : <Code2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Editor or HTML View */}
      {showHtmlView ? (
        <div className="p-4 bg-gray-50">
          <div className="mb-2 text-sm text-gray-600 font-medium">תגיות HTML:</div>
          <textarea
            ref={htmlTextareaRef}
            className="w-full min-h-[200px] p-4 font-mono text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            defaultValue={value || ''}
            onChange={(e) => {
              onChange(e.target.value)
            }}
            dir="ltr"
            style={{ direction: 'ltr', textAlign: 'left' }}
            placeholder="הזן HTML כאן..."
          />
          <div className="mt-2 text-xs text-gray-500">
            💡 טיפ: לאחר עריכה, לחץ על כפתור העין כדי לחזור לעורך הויזואלי
          </div>
        </div>
      ) : (
        <div
          ref={editorRef}
          contentEditable
          className="min-h-[200px] p-4 focus:outline-none text-right"
          onInput={handleInput}
          data-placeholder={placeholder}
          dir="rtl"
          style={{ direction: 'rtl', textAlign: 'right' }}
        />
      )}

      {/* Link Dialog */}
      {isLinkDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">הוסף קישור</h3>
            <div className="space-y-4">
              <div>
                <label className="form-label">טקסט</label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">כתובת URL</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  dir="ltr"
                  className="form-input"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsLinkDialogOpen(false)}
                  className="btn btn-outline btn-sm"
                >
                  ביטול
                </button>
                <button
                  type="button"
                  onClick={() => insertLink()}
                  className="btn btn-primary btn-sm"
                >
                  הוסף
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
