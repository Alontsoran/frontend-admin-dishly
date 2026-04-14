import { useState, useEffect } from 'react'
import { Link2, X, Check } from 'lucide-react'
import { useAutoLinkSuggestions, LinkSuggestion } from '@/hooks/useAutoLinkSuggestions'

interface AutoLinkSuggestionsProps {
  text: string
  onApplyLink: (suggestion: LinkSuggestion) => void
  onDismiss?: (suggestion: LinkSuggestion) => void
}

export default function AutoLinkSuggestions({ text, onApplyLink, onDismiss }: AutoLinkSuggestionsProps) {
  const { suggestions, loading, pages } = useAutoLinkSuggestions(text)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  // Filter out dismissed suggestions
  const visibleSuggestions = suggestions.filter(
    (s) => !dismissed.has(`${s.startIndex}-${s.endIndex}`)
  )

  const handleDismiss = (suggestion: LinkSuggestion) => {
    setDismissed((prev) => new Set([...prev, `${suggestion.startIndex}-${suggestion.endIndex}`]))
    onDismiss?.(suggestion)
  }

  // Debug logging
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔗 AutoLinkSuggestions:', {
        textLength: text?.length || 0,
        loading,
        pagesCount: pages.length,
        suggestionsCount: suggestions.length,
        visibleCount: visibleSuggestions.length,
      })
    }
  }, [text, loading, pages.length, suggestions.length, visibleSuggestions.length])

  if (loading) {
    return (
      <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500">
        טוען הצעות קישורים...
      </div>
    )
  }

  if (visibleSuggestions.length === 0) {
    return null
  }

  return (
    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center gap-2 mb-3">
        <Link2 className="h-4 w-4 text-blue-600" />
        <h4 className="text-sm font-semibold text-blue-900">
          הצעות לקישורים אוטומטיים ({visibleSuggestions.length})
        </h4>
      </div>
      
      <div className="space-y-2">
        {visibleSuggestions.slice(0, 5).map((suggestion, index) => (
          <div
            key={`${suggestion.startIndex}-${suggestion.endIndex}-${index}`}
            className="flex items-center justify-between p-2 bg-white rounded border border-blue-200"
          >
            <div className="flex-1">
              <div className="text-sm text-gray-700">
                <span className="font-medium">"{suggestion.keyword}"</span>
                {' → '}
                <span className="text-blue-600">{suggestion.page.title}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                /{suggestion.page.slug}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onApplyLink(suggestion)}
                className="btn btn-primary btn-xs flex items-center gap-1"
                title="הוסף קישור"
              >
                <Check className="h-3 w-3" />
                הוסף
              </button>
              <button
                onClick={() => handleDismiss(suggestion)}
                className="btn btn-ghost btn-xs p-1"
                title="התעלם"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {visibleSuggestions.length > 5 && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          ועוד {visibleSuggestions.length - 5} הצעות...
        </div>
      )}
    </div>
  )
}

