'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { 
  Bot, Sparkles, Wand2, Target, Brain, 
  Zap, CheckCircle, Loader
} from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '@/services/api'
import { PageComponent } from '@/types'
import { cn } from '@/utils/cn'

interface AIContentGeneratorProps {
  onContentGenerated: (result: {
    components: PageComponent[]
    metaTitle: string
    metaDescription: string
    metaKeywords: string
    ogTitle: string
    ogDescription: string
  }) => void
  existingContent?: PageComponent[]
  pageTitle?: string
  pageSlug?: string
  categoryId?: string
}

interface AIRequest {
  title: string
  keywords: string[]
  pageType: 'service' | 'about' | 'contact' | 'general'
  targetAudience: string
  tone: 'professional' | 'friendly' | 'authoritative' | 'casual'
}

export default function AIContentGenerator({
  onContentGenerated,
  existingContent,
  pageTitle = '',
  pageSlug = '',
  categoryId
}: AIContentGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<'setup' | 'generating' | 'result'>('setup')
  const [aiRequest, setAIRequest] = useState<AIRequest>({
    title: pageTitle,
    keywords: [],
    pageType: 'general',
    targetAudience: 'זוגות המתחתנים ומארגני אירועים בישראל',
    tone: 'professional'
  })
  const [keywordInput, setKeywordInput] = useState('')
  const [generatedResult, setGeneratedResult] = useState<any>(null)

  const generateMutation = useMutation({
    mutationFn: async (request: AIRequest) => {
      console.log('🤖 Sending AI request:', request)
      // Use original endpoint for full AI content
      const response = await api.post('/ai-content/generate-page', request)
      console.log('✅ AI response received:', response.data)
      return response.data.data
    },
    onSuccess: (result) => {
      setGeneratedResult(result)
      setStep('result')
      toast.success('🤖 תוכן נוצר בהצלחה עם AI!')
    },
    onError: (error) => {
      toast.error('שגיאה ביצירת תוכן עם AI')
      console.error('AI Generation Error:', error)
      setStep('setup')
    },
  })

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !aiRequest.keywords.includes(keywordInput.trim())) {
      setAIRequest(prev => ({
        ...prev,
        keywords: [...prev.keywords, keywordInput.trim()]
      }))
      setKeywordInput('')
    }
  }

  const handleRemoveKeyword = (keyword: string) => {
    setAIRequest(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }))
  }

  const handleGenerate = () => {
    // בדיקות חובה
    if (!pageTitle || !pageTitle.trim()) {
      toast.error('⚠️ יש למלא כותרת דף לפני יצירת תוכן AI')
      return
    }
    
    if (!pageSlug || !pageSlug.trim()) {
      toast.error('⚠️ יש למלא כתובת URL לפני יצירת תוכן AI')
      return
    }
    
    if (!categoryId) {
      toast.error('⚠️ יש לבחור קטגוריה לפני יצירת תוכן AI')
      return
    }
    
    if (!aiRequest.title || aiRequest.keywords.length === 0) {
      toast.error('⚠️ יש למלא כותרת ומילות מפתח')
      return
    }
    
    setStep('generating')
    generateMutation.mutate(aiRequest)
  }

  const handleAcceptResult = () => {
    if (generatedResult) {
      console.log('🎯 Accepting AI result:', generatedResult)
      console.log('🎯 Components to be added:', generatedResult.components?.length)
      onContentGenerated(generatedResult)
      setIsOpen(false)
      setStep('setup')
      setGeneratedResult(null)
    }
  }

  const predefinedKeywords = [
    'חתונה', 'אישורי הגעה', 'RSVP', 'הושבה', 'רשימת מוזמנים',
    'אולם', 'תקציב', 'וואטסאפ', 'הזמנה דיגיטלית', 'DoWe',
    'איכות', 'מקצועי', 'אמין', 'מהיר', 'פשוט',
  ]

  return (
    <>
      {/* AI Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        disabled={!pageTitle?.trim() || !pageSlug?.trim() || !categoryId}
        className={cn(
          "flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl",
          (!pageTitle?.trim() || !pageSlug?.trim() || !categoryId) && "opacity-50 cursor-not-allowed"
        )}
        title={(!pageTitle?.trim() || !pageSlug?.trim() || !categoryId) ? "יש למלא כותרת, URL וקטגוריה" : ""}
      >
        <Bot className="h-5 w-5" />
        <Sparkles className="h-4 w-4" />
        יצור תוכן עם AI
      </button>

      {/* AI Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"
              onClick={() => setIsOpen(false)}
            />
            
            <div className="relative w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-2xl">
              
              {step === 'setup' && (
                <>
                  {/* Header */}
                  <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
                    <div className="flex items-center gap-3">
                      <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                        <Brain className="h-8 w-8" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">🤖 AI Content Generator</h2>
                        <p className="text-purple-100">יוצר תוכן מקצועי ומותאם אישית בלחיצה אחת</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-8">
                    {/* Configuration */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      
                      {/* Left Column */}
                      <div className="space-y-6">
                        <div>
                          <label className="form-label">🎯 כותרת הדף *</label>
                          <input
                            type="text"
                            value={aiRequest.title}
                            onChange={(e) => setAIRequest(prev => ({ ...prev, title: e.target.value }))}
                            className="form-input"
                            placeholder="למשל: אישורי הגעה לחתונה — מדריך מלא"
                          />
                        </div>

                        <div>
                          <label className="form-label">📂 סוג הדף</label>
                          <select
                            value={aiRequest.pageType}
                            onChange={(e) => setAIRequest(prev => ({ ...prev, pageType: e.target.value as any }))}
                            className="form-input"
                          >
                            <option value="service">דף שירות</option>
                            <option value="about">דף אודות</option>
                            <option value="contact">דף צור קשר</option>
                            <option value="general">דף כללי</option>
                          </select>
                        </div>

                        <div>
                          <label className="form-label">🎭 טון הכתיבה</label>
                          <div className="grid grid-cols-2 gap-2">
                            {['professional', 'friendly', 'authoritative', 'casual'].map((tone) => (
                              <button
                                key={tone}
                                type="button"
                                onClick={() => setAIRequest(prev => ({ ...prev, tone: tone as any }))}
                                className={cn(
                                  'p-3 rounded-lg text-sm font-medium transition-all',
                                  aiRequest.tone === tone
                                    ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-500'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                )}
                              >
                                {tone === 'professional' && '👔 מקצועי'}
                                {tone === 'friendly' && '😊 ידידותי'}
                                {tone === 'authoritative' && '🎯 מוביל דעה'}
                                {tone === 'casual' && '💬 נינוח'}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="space-y-6">
                        <div>
                          <label className="form-label">🔑 מילות מפתח *</label>
                          <div className="flex gap-2 mb-3">
                            <input
                              type="text"
                              value={keywordInput}
                              onChange={(e) => setKeywordInput(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
                              className="form-input flex-1"
                              placeholder="הוסף מילת מפתח..."
                            />
                            <button
                              type="button"
                              onClick={handleAddKeyword}
                              className="btn btn-outline btn-sm"
                            >
                              הוסף
                            </button>
                          </div>
                          
                          {/* Selected Keywords */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {aiRequest.keywords.map((keyword) => (
                              <span
                                key={keyword}
                                className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2"
                              >
                                {keyword}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveKeyword(keyword)}
                                  className="hover:bg-purple-200 rounded-full p-1"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>

                          {/* Predefined Keywords */}
                          <div>
                            <p className="text-sm text-gray-600 mb-2">מילות מפתח מוצעות:</p>
                            <div className="flex flex-wrap gap-2">
                              {predefinedKeywords.map((keyword) => (
                                <button
                                  key={keyword}
                                  type="button"
                                  onClick={() => {
                                    if (!aiRequest.keywords.includes(keyword)) {
                                      setAIRequest(prev => ({
                                        ...prev,
                                        keywords: [...prev.keywords, keyword]
                                      }))
                                    }
                                  }}
                                  disabled={aiRequest.keywords.includes(keyword)}
                                  className={cn(
                                    'px-3 py-1 text-sm rounded-full transition-colors',
                                    aiRequest.keywords.includes(keyword)
                                      ? 'bg-gray-200 text-gray-400'
                                      : 'bg-gray-100 text-gray-700 hover:bg-purple-100 hover:text-purple-700'
                                  )}
                                >
                                  {keyword}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="form-label">👥 קהל יעד</label>
                          <textarea
                            value={aiRequest.targetAudience}
                            onChange={(e) => setAIRequest(prev => ({ ...prev, targetAudience: e.target.value }))}
                            rows={3}
                            className="form-input"
                            placeholder="תאר את קהל היעד שלך..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Existing Content Info */}
                    {existingContent && existingContent.length > 0 && (
                      <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
                        <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
                          <CheckCircle className="h-5 w-5" />
                          תוכן קיים זוהה
                        </h3>
                        <p className="text-blue-700 mb-4">
                          הדף כבר מכיל {existingContent.length} רכיבים. האם לשדרג את התוכן הקיים או ליצור חדש?
                        </p>
                        
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={handleGenerate}
                            disabled={
                              generateMutation.isPending || 
                              !pageTitle?.trim() || 
                              !pageSlug?.trim() || 
                              !categoryId ||
                              !aiRequest.title || 
                              aiRequest.keywords.length === 0
                            }
                            className="btn btn-primary btn-sm"
                          >
                            <Sparkles className="ml-2 h-4 w-4" />
                            יצור תוכן חדש
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                          >
                            <Wand2 className="ml-2 h-4 w-4" />
                            שדרג תוכן קיים
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-8 flex justify-between items-center">
                      <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="btn btn-outline"
                      >
                        ביטול
                      </button>
                      
                      <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={
                          generateMutation.isPending || 
                          !pageTitle?.trim() || 
                          !pageSlug?.trim() || 
                          !categoryId ||
                          !aiRequest.title || 
                          aiRequest.keywords.length === 0
                        }
                        className={cn(
                          'btn btn-primary btn-lg',
                          'bg-gradient-to-r from-purple-600 to-blue-600',
                          'hover:from-purple-700 hover:to-blue-700',
                          generateMutation.isPending && 'opacity-75'
                        )}
                      >
                        {generateMutation.isPending ? (
                          <Loader className="ml-2 h-5 w-5 animate-spin" />
                        ) : (
                          <Zap className="ml-2 h-5 w-5" />
                        )}
                        {generateMutation.isPending ? 'יוצר תוכן...' : 'יצור עם AI'}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {step === 'generating' && (
                <div className="p-12 text-center">
                  <div className="bg-gradient-to-r from-purple-600 to-blue-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Brain className="h-10 w-10 text-white animate-pulse" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    🤖 AI יוצר את התוכן...
                  </h3>
                  <div className="space-y-2 text-gray-600">
                    <p>✨ מנתח את המילות מפתח</p>
                    <p>🎨 יוצר רכיבים מותאמים</p>
                    <p>📝 כותב תוכן מקצועי</p>
                    <p>🔍 מייעל לSEO</p>
                  </div>
                  <div className="mt-6">
                    <div className="w-64 h-2 bg-gray-200 rounded-full mx-auto overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              )}

              {step === 'result' && generatedResult && (
                <>
                  {/* Header */}
                  <div className="bg-green-600 p-6 text-white">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-8 w-8" />
                      <div>
                        <h2 className="text-2xl font-bold">🎉 תוכן נוצר בהצלחה!</h2>
                        <p className="text-green-100">האינטלגנציה המלאכותית יצרה עבורך תוכן מקצועי</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-8">
                    {/* Generated Content Preview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      
                      {/* Components Preview */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <Target className="h-5 w-5 text-purple-600" />
                          רכיבים שנוצרו ({generatedResult.components?.length || 0})
                        </h3>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {generatedResult.components?.map((component: any, index: number) => (
                            <div key={index} className="bg-gray-50 p-4 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="bg-purple-100 text-purple-600 px-2 py-1 rounded text-xs font-bold">
                                  {component.type}
                                </span>
                                <span className="text-sm text-gray-600">#{index + 1}</span>
                              </div>
                              <h4 className="font-medium text-sm">
                                {component.props?.title || component.props?.heading || 'רכיב ללא כותרת'}
                              </h4>
                              {component.props?.subtitle && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {component.props.subtitle.substring(0, 100)}...
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* SEO Preview */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <Target className="h-5 w-5 text-blue-600" />
                          SEO שנוצר
                        </h3>
                        <div className="space-y-4">
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <h4 className="text-sm font-semibold text-blue-800 mb-2">Meta Title:</h4>
                            <p className="text-sm text-blue-700">{generatedResult.metaTitle}</p>
                          </div>
                          
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <h4 className="text-sm font-semibold text-blue-800 mb-2">Meta Description:</h4>
                            <p className="text-sm text-blue-700">{generatedResult.metaDescription}</p>
                          </div>
                          
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <h4 className="text-sm font-semibold text-blue-800 mb-2">Keywords:</h4>
                            <p className="text-sm text-blue-700">{generatedResult.metaKeywords}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-8 flex justify-between">
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setStep('setup')}
                          className="btn btn-outline"
                        >
                          חזור לעריכה
                        </button>
                        <button
                          type="button"
                          onClick={handleGenerate}
                          disabled={generateMutation.isPending}
                          className="btn btn-secondary"
                        >
                          <Wand2 className="ml-2 h-4 w-4" />
                          יצור שוב
                        </button>
                      </div>
                      
                      <button
                        type="button"
                        onClick={handleAcceptResult}
                        className="btn btn-primary btn-lg bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="ml-2 h-5 w-5" />
                        השתמש בתוכן הזה
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
