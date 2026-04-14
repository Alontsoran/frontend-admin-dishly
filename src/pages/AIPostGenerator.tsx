import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Sparkles, RefreshCw, Save } from 'lucide-react'

interface GeneratedPost {
  title: string
  slug: string
  content: any[]
  metaTitle: string
  metaDescription: string
  metaKeywords: string
}

export default function AIPostGenerator() {
  const navigate = useNavigate()
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generatedPost, setGeneratedPost] = useState<GeneratedPost | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    topic: '',
    category: '',
    tone: 'professional', // professional, friendly, technical, creative
    length: 'medium', // short, medium, long
    includeImages: true,
    includeFAQ: true,
    targetKeywords: '',
    customInstructions: '',
  })

  const toneOptions = [
    { value: 'professional', label: 'מקצועי' },
    { value: 'friendly', label: 'ידידותי' },
    { value: 'technical', label: 'טכני' },
    { value: 'creative', label: 'יצירתי' },
  ]

  const lengthOptions = [
    { value: 'short', label: 'קצר (300-500 מילים)' },
    { value: 'medium', label: 'בינוני (500-800 מילים)' },
    { value: 'long', label: 'ארוך (800+ מילים)' },
  ]

  const handleGenerate = async () => {
    if (!formData.topic.trim()) {
      alert('אנא הכנס נושא לפוסט')
      return
    }

    setGenerating(true)
    
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/ai-content/generate-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          topic: formData.topic,
          options: {
            tone: formData.tone,
            length: formData.length,
            includeImages: formData.includeImages,
            includeFAQ: formData.includeFAQ,
            targetKeywords: formData.targetKeywords,
            customInstructions: formData.customInstructions,
          },
        }),
      })

      if (!response.ok) throw new Error('Failed to generate post')

      const data = await response.json()
      setGeneratedPost(data.data)
    } catch (error) {
      console.error('Error generating post:', error)
      alert('שגיאה ביצירת הפוסט. נסה שוב.')
    } finally {
      setGenerating(false)
    }
  }

  const handleSavePost = async () => {
    if (!generatedPost) return

    setSaving(true)
    
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: generatedPost.title,
          slug: generatedPost.slug,
          content: generatedPost.content,
          metaTitle: generatedPost.metaTitle,
          metaDescription: generatedPost.metaDescription,
          metaKeywords: generatedPost.metaKeywords,
          categoryId: formData.category || undefined,
          isPublished: false, // Save as draft initially
        }),
      })

      if (!response.ok) throw new Error('Failed to save post')

      const data = await response.json()
      navigate(`/posts/${data.data.id}`)
    } catch (error) {
      console.error('Error saving post:', error)
      alert('שגיאה בשמירת הפוסט. נסה שוב.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/posts')}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Sparkles className="text-purple-600" size={24} />
                  יצירת פוסט עם AI
                </h1>
                <p className="text-sm text-gray-500">
                  צור פוסט מלא ומקצועי בעזרת בינה מלאכותית
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Generation Form */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">פרטי הפוסט</h2>
            
            <div className="space-y-6">
              {/* Topic */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  נושא הפוסט *
                </label>
                <input
                  type="text"
                  value={formData.topic}
                  onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                  placeholder="לדוגמה: סידור הושבה לחתונה — טיפים"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Target Keywords */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  מילות מפתח יעד
                </label>
                <input
                  type="text"
                  value={formData.targetKeywords}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetKeywords: e.target.value }))}
                  placeholder="חתונה, אישורי הגעה, רשימת מוזמנים"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Tone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  טון כתיבה
                </label>
                <select
                  value={formData.tone}
                  onChange={(e) => setFormData(prev => ({ ...prev, tone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {toneOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Length */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  אורך הפוסט
                </label>
                <select
                  value={formData.length}
                  onChange={(e) => setFormData(prev => ({ ...prev, length: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {lengthOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Options */}
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.includeImages}
                    onChange={(e) => setFormData(prev => ({ ...prev, includeImages: e.target.checked }))}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="mr-2 text-sm text-gray-700">
                    הוסף הצעות לתמונות
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.includeFAQ}
                    onChange={(e) => setFormData(prev => ({ ...prev, includeFAQ: e.target.checked }))}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="mr-2 text-sm text-gray-700">
                    הוסף שאלות נפוצות
                  </span>
                </label>
              </div>

              {/* Custom Instructions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  הנחיות נוספות (אופציונלי)
                </label>
                <textarea
                  value={formData.customInstructions}
                  onChange={(e) => setFormData(prev => ({ ...prev, customInstructions: e.target.value }))}
                  placeholder="הוראות מיוחדות לAI..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={generating || !formData.topic.trim()}
                className="w-full btn btn-primary flex items-center justify-center gap-2 py-3"
              >
                {generating ? (
                  <>
                    <RefreshCw size={20} className="animate-spin" />
                    יוצר פוסט...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    צור פוסט
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Generated Content Preview */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">תצוגה מקדימה</h2>
              {generatedPost && (
                <button
                  onClick={handleSavePost}
                  disabled={saving}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <Save size={16} />
                  {saving ? 'שומר...' : 'שמור פוסט'}
                </button>
              )}
            </div>

            {generating && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
                <p className="text-gray-600">AI יוצר עבורך פוסט מקצועי...</p>
                <p className="text-sm text-gray-500 mt-2">זה עלול לקחת כמה רגעים</p>
              </div>
            )}

            {!generating && !generatedPost && (
              <div className="text-center py-12">
                <Sparkles size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">הפוסט שנוצר יופיע כאן</p>
                <p className="text-sm text-gray-500 mt-2">
                  מלא את הפרטים והקלק על "צור פוסט"
                </p>
              </div>
            )}

            {generatedPost && (
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {generatedPost.title}
                  </h3>
                  <p className="text-sm text-gray-500">/{generatedPost.slug}</p>
                </div>

                {/* Meta Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">SEO</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Meta Title:</strong> {generatedPost.metaTitle}</p>
                    <p><strong>Meta Description:</strong> {generatedPost.metaDescription}</p>
                    <p><strong>Keywords:</strong> {generatedPost.metaKeywords}</p>
                  </div>
                </div>

                {/* Content Preview */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">תוכן הפוסט</h4>
                  <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                    <p className="text-sm text-gray-600">
                      {generatedPost.content.length} רכיבים נוצרו:
                    </p>
                    <ul className="text-sm text-gray-500 mt-2 space-y-1">
                      {generatedPost.content.map((component: any, index: number) => (
                        <li key={index}>
                          • {component.type} - {component.props.title || 'רכיב תוכן'}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Regenerate Button */}
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full btn btn-secondary flex items-center justify-center gap-2"
                >
                  <RefreshCw size={16} />
                  צור גרסה חדשה
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
