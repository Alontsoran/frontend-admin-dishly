'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { 
  MessageSquare, Edit3, CheckCircle, ArrowRight, 
  Target, Sparkles, Brain, Wand2, Eye
} from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '@/services/api'
import { PageComponent } from '@/types'
import { cn } from '@/utils/cn'

interface SmartAIFormProps {
  onContentGenerated: (result: {
    components: PageComponent[]
    metaTitle: string
    metaDescription: string
    metaKeywords: string
    ogTitle: string
    ogDescription: string
  }) => void
  pageTitle?: string
  pageType?: string
  pageSlug?: string
  categoryId?: string
}

interface AIQuestion {
  id: string
  question: string
  type: 'text' | 'select' | 'textarea' | 'multiselect' | 'range'
  options?: string[]
  placeholder?: string
  required?: boolean
  category: string
}

export default function SmartAIForm({ onContentGenerated, pageTitle = '', pageType = 'service', pageSlug = '', categoryId }: SmartAIFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [aiAnswers, setAiAnswers] = useState<Record<string, any>>({})
  const [generatedContent, setGeneratedContent] = useState<any>(null)
  const [isPreviewMode, setIsPreviewMode] = useState(false)

  // שאלות חכמות לפי סוג דף
  const getQuestionsForPageType = (type: string): AIQuestion[] => {
    const baseQuestions: AIQuestion[] = [
      {
        id: 'businessName',
        question: 'מה שם העסק/החברה שלכם?',
        type: 'text',
        placeholder: 'למשל: DoWe — ניהול חתונה',
        required: true,
        category: 'basic'
      },
      {
        id: 'location',
        question: 'באיזה אזור אתם פועלים?',
        type: 'select',
        options: ['תל אביב', 'ירושלים', 'חיפה', 'באר שבע', 'כל הארץ', 'מרכז', 'צפון', 'דרום', 'יהודה ושומרון'],
        required: true,
        category: 'basic'
      },
      {
        id: 'tone',
        question: 'איך אתם רוצים להיראות ללקוחות?',
        type: 'select',
        options: ['מקצועי ורשמי', 'ידידותי וחם', 'מוביל דעה', 'נגיש ופשוט'],
        required: true,
        category: 'content'
      },
      {
        id: 'targetAudience',
        question: 'מי הקהל היעד העיקרי שלכם?',
        type: 'textarea',
        placeholder: 'למשל: בעלי דירות בגיל 30-50, משפחות צעירות, משקיעי נדל"ן...',
        required: true,
        category: 'content'
      },
      {
        id: 'uniqueSellingPoints',
        question: 'מה מייחד אתכם מהמתחרים? (עד 3 נקודות)',
        type: 'multiselect',
        options: [
          'ניסיון של מעל 10 שנים',
          'מחירים תחרותיים', 
          'אחריות מורחבת',
          'שירות 24/7',
          'עסקים מאומתים',
          'ביקורות מעולות',
          'טכנולוגיות מתקדמות',
          'עבודה מהירה',
          'יועץ אישי',
          'חומרים איכותיים'
        ],
        category: 'content'
      },
      {
        id: 'callToAction',
        question: 'איזה פעולה אתם הכי רוצים שהלקוחות יבצעו?',
        type: 'select',
        options: [
          'יתקשרו טלפונית',
          'ימלאו טופס הצעת מחיר', 
          'יבקרו במשרד',
          'ישלחו WhatsApp',
          'יתזמנו פגישת ייעוץ',
          'יבדקו הגלריה'
        ],
        required: true,
        category: 'content'
      }
    ]

    const serviceQuestions: AIQuestion[] = [
      {
        id: 'mainServices',
        question: 'אילו שירותים עיקריים אתם מספקים? (בחרו עד 6)',
        type: 'multiselect',
        options: [
          'ניהול לקוחות',
          'ניהול מכירות',
          'ניהול משימות',
          'דוחות ומעקב', 
          'שיווק דיגיטלי',
          'ניהול פרויקטים',
          'תמיכה טכנית',
          'אוטומציה עסקית',
          'אינסטלציה',
          'חשמל',
          'נגרות',
          'בנייה'
        ],
        required: true,
        category: 'service'
      },
      {
        id: 'priceRange',
        question: 'איזה טווח מחירים אתם בדרך כלל עובדים?',
        type: 'select',
        options: [
          'פרויקטים קטנים (עד 10,000 ₪)',
          'פרויקטים בינוניים (10,000-50,000 ₪)',
          'פרויקטים גדולים (50,000-200,000 ₪)',
          'פרויקטים מורכבים (200,000+ ₪)',
          'כל טווח המחירים'
        ],
        category: 'service'
      },
      {
        id: 'experience',
        question: 'כמה שנות ניסיון יש לכם בתחום?',
        type: 'select',
        options: ['פחות משנה', '1-3 שנים', '3-5 שנים', '5-10 שנים', '10-15 שנים', 'מעל 15 שנים'],
        required: true,
        category: 'service'
      },
      {
        id: 'workProcess',
        question: 'תארו בקצרה את תהליך העבודה שלכם',
        type: 'textarea',
        placeholder: 'למשל: פגישת ייעוץ → הצעת מחיר → תכנון → ביצוע → מסירה...',
        category: 'service'
      }
    ]

    const seoQuestions: AIQuestion[] = [
      {
        id: 'primaryKeyword',
        question: 'מילת המפתח העיקרית שאתם רוצים להתמקד בה',
        type: 'text',
        placeholder: 'למשל: אישורי הגעה לחתונה — כל מה שצריך לדעת',
        required: true,
        category: 'seo'
      },
      {
        id: 'secondaryKeywords',
        question: 'מילות מפתח נוספות (מופרדות בפסיקים)',
        type: 'textarea',
        placeholder: 'למשל: חתונה, RSVP, הושבה, רשימת מוזמנים...',
        category: 'seo'
      },
      {
        id: 'competitorAnalysis',
        question: 'מי המתחרים העיקריים שלכם?',
        type: 'textarea', 
        placeholder: 'שמות חברות או אתרים שמתחרים איתכם...',
        category: 'seo'
      },
      {
        id: 'localSEO',
        question: 'האם אתם מתמקדים באזור גאוגרפי ספציפי?',
        type: 'select',
        options: ['כן, אזור ספציפי', 'לא, כל הארץ', 'מספר אזורים'],
        category: 'seo'
      }
    ]

    if (type === 'service') {
      return [...baseQuestions, ...serviceQuestions, ...seoQuestions]
    } else if (type === 'about') {
      return [
        ...baseQuestions.filter(q => q.id !== 'callToAction'),
        {
          id: 'foundingYear',
          question: 'באיזה שנה הקמתם את החברה?',
          type: 'text',
          placeholder: '2015',
          category: 'about'
        },
        {
          id: 'teamSize',
          question: 'כמה אנשים עובדים בחברה?',
          type: 'select',
          options: ['פרטי (1)', 'קטנה (2-5)', 'בינונית (6-15)', 'גדולה (16+)'],
          category: 'about'
        },
        {
          id: 'companyValues',
          question: 'מה הערכים העיקריים של החברה?',
          type: 'multiselect',
          options: ['אמינות', 'איכות', 'מקצועיות', 'שירות', 'חדשנות', 'מהירות', 'שקיפות', 'אחריות'],
          category: 'about'
        }
      ]
    } else if (type === 'contact') {
      return [
        ...baseQuestions.filter(q => !['targetAudience', 'uniqueSellingPoints'].includes(q.id)),
        {
          id: 'phoneNumbers',
          question: 'מספרי הטלפון שלכם',
          type: 'textarea',
          placeholder: 'מספר ראשי, חירום, משרד...',
          required: true,
          category: 'contact'
        },
        {
          id: 'workingHours',
          question: 'מתי אתם זמינים ללקוחות?',
          type: 'textarea',
          placeholder: 'א׳-ה׳: 8:00-18:00, ו׳: 8:00-13:00...',
          category: 'contact'
        },
        {
          id: 'officeAddress',
          question: 'יש לכם משרד/מוקד שירות?',
          type: 'text',
          placeholder: 'כתובת המשרד או "בלי משרד פיזי"',
          category: 'contact'
        }
      ]
    }

    return baseQuestions
  }

  const questions = getQuestionsForPageType(pageType)
  const questionsByCategory = questions.reduce((acc, q) => {
    if (!acc[q.category]) acc[q.category] = []
    acc[q.category].push(q)
    return acc
  }, {} as Record<string, AIQuestion[]>)

  const categories = Object.keys(questionsByCategory)
  const currentCategory = categories[currentStep] || 'basic'
  const currentQuestions = questionsByCategory[currentCategory] || []

  const generateContentMutation = useMutation({
    mutationFn: async () => {
      // בדיקות חובה
      if (!pageTitle || !pageTitle.trim()) {
        throw new Error('יש למלא כותרת דף')
      }
      if (!pageSlug || !pageSlug.trim()) {
        throw new Error('יש למלא כתובת URL')
      }
      if (!categoryId) {
        throw new Error('יש לבחור קטגוריה')
      }
      
      console.log('🧠 Generating smart content with answers:', aiAnswers)
      
      const response = await api.post('/ai-content/generate-smart-page', {
        pageType,
        title: pageTitle,
        answers: aiAnswers
      })
      
      return response.data.data
    },
    onSuccess: (result) => {
      setGeneratedContent(result)
      setIsPreviewMode(true)
      toast.success('🤖 תוכן חכם נוצר בהצלחה!')
    },
    onError: (error) => {
      toast.error('שגיאה ביצירת תוכן חכם')
      console.error('Smart AI Error:', error)
    },
  })

  const handleAnswerChange = (questionId: string, value: any) => {
    setAiAnswers(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  const handleNext = () => {
    if (currentStep < categories.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      // סיימנו את כל השאלות - ניצור תוכן
      generateContentMutation.mutate()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const isStepComplete = () => {
    const requiredQuestions = currentQuestions.filter(q => q.required)
    return requiredQuestions.every(q => aiAnswers[q.id])
  }

  const renderQuestion = (question: AIQuestion) => {
    const value = aiAnswers[question.id]

    switch (question.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder={question.placeholder}
            className="form-input w-full"
          />
        )

      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder={question.placeholder}
            rows={3}
            className="form-input w-full"
          />
        )

      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="form-input w-full"
          >
            <option value="">בחר אפשרות...</option>
            {question.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )

      case 'multiselect':
        return (
          <div className="space-y-2">
            {question.options?.map((option) => {
              const isSelected = Array.isArray(value) && value.includes(option)
              return (
                <label key={option} className="flex items-center gap-3 p-3 rounded-lg border hover:border-purple-300 transition-colors">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      const currentValues = Array.isArray(value) ? value : []
                      if (e.target.checked) {
                        handleAnswerChange(question.id, [...currentValues, option])
                      } else {
                        handleAnswerChange(question.id, currentValues.filter(v => v !== option))
                      }
                    }}
                    className="form-checkbox"
                  />
                  <span className="text-sm">{option}</span>
                </label>
              )
            })}
          </div>
        )

      default:
        return null
    }
  }

  const categoryTitles = {
    basic: '📋 מידע בסיסי',
    content: '🎨 העדפות תוכן',
    service: '🔧 פרטי השירות',
    about: '🏢 אודות החברה', 
    contact: '📞 פרטי התקשרות',
    seo: '📈 יעדי SEO'
  }

  return (
    <>
      {/* Smart AI Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        disabled={!pageTitle?.trim() || !pageSlug?.trim() || !categoryId}
        className={cn(
          "flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white px-6 py-3 rounded-xl font-bold hover:from-emerald-700 hover:to-cyan-700 transition-all shadow-lg hover:shadow-xl",
          (!pageTitle?.trim() || !pageSlug?.trim() || !categoryId) && "opacity-50 cursor-not-allowed"
        )}
        title={(!pageTitle?.trim() || !pageSlug?.trim() || !categoryId) ? "יש למלא כותרת, URL וקטגוריה" : ""}
      >
        <Brain className="h-5 w-5" />
        <Sparkles className="h-4 w-4" />
        AI חכם - ממלא שדות
      </button>

      {/* Smart AI Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"
              onClick={() => setIsOpen(false)}
            />
            
            <div className="relative w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-2xl">
              
              {!isPreviewMode ? (
                <>
                  {/* Header */}
                  <div className="bg-gradient-to-r from-emerald-600 to-cyan-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                          <MessageSquare className="h-8 w-8" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold">🧠 AI חכם - שאלות מותאמות</h2>
                          <p className="text-emerald-100">נענה על מספר שאלות ו-AI ימלא את כל השדות בשבילך</p>
                        </div>
                      </div>
                      
                      {/* Progress */}
                      <div className="text-center">
                        <div className="text-lg font-bold">{currentStep + 1}/{categories.length}</div>
                        <div className="text-xs text-emerald-100">שלבים</div>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mt-4 bg-white bg-opacity-20 rounded-full h-2">
                      <div 
                        className="bg-white h-2 rounded-full transition-all duration-500"
                        style={{ width: `${((currentStep + 1) / categories.length) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-8">
                    {/* Category Title */}
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {categoryTitles[currentCategory as keyof typeof categoryTitles]}
                      </h3>
                      <p className="text-gray-600">
                        {currentCategory === 'basic' && 'בואו נכיר - מידע כללי על העסק'}
                        {currentCategory === 'content' && 'איך אתם רוצים שהלקוחות יכירו אתכם?'}
                        {currentCategory === 'service' && 'ספרו לנו על השירותים שלכם'}
                        {currentCategory === 'about' && 'הסיפור והחזון של החברה'}
                        {currentCategory === 'contact' && 'איך לקוחות יכולים להגיע אליכם?'}
                        {currentCategory === 'seo' && 'בואו נבנה אסטרטגיית SEO חכמה'}
                      </p>
                    </div>

                    {/* Questions */}
                    <div className="space-y-6 max-w-2xl mx-auto">
                      {currentQuestions.map((question) => (
                        <div key={question.id} className="space-y-3">
                          <label className="block text-lg font-medium text-gray-900">
                            {question.question}
                            {question.required && <span className="text-red-500 mr-2">*</span>}
                          </label>
                          {renderQuestion(question)}
                        </div>
                      ))}
                    </div>

                    {/* Navigation */}
                    <div className="mt-8 flex justify-between">
                      <button
                        type="button"
                        onClick={handlePrevious}
                        disabled={currentStep === 0}
                        className={cn(
                          'btn btn-outline',
                          currentStep === 0 && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        ← קודם
                      </button>
                      
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setIsOpen(false)}
                          className="btn btn-outline"
                        >
                          ביטול
                        </button>
                        
                        <button
                          type="button"
                          onClick={handleNext}
                          disabled={!isStepComplete() && currentQuestions.some(q => q.required)}
                          className={cn(
                            'btn btn-primary btn-lg',
                            'bg-gradient-to-r from-emerald-600 to-cyan-600',
                            'hover:from-emerald-700 hover:to-cyan-700',
                            (!isStepComplete() && currentQuestions.some(q => q.required)) && 'opacity-50'
                          )}
                        >
                          {currentStep === categories.length - 1 ? (
                            generateContentMutation.isPending ? (
                              <>🤖 יוצר תוכן...</>
                            ) : (
                              <>
                                <Wand2 className="ml-2 h-5 w-5" />
                                יצור תוכן חכם!
                              </>
                            )
                          ) : (
                            <>
                              הבא
                              <ArrowRight className="mr-2 h-4 w-4" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* Preview Mode */
                <div>
                  {/* Header */}
                  <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-8 w-8" />
                      <div>
                        <h2 className="text-2xl font-bold">🎉 תוכן חכם נוצר!</h2>
                        <p className="text-green-100">AI מילא את כל השדות בהתבסס על התשובות שלך</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-8">
                    {/* Generated Content Preview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      
                      {/* Components */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <Target className="h-5 w-5 text-emerald-600" />
                          רכיבים שנוצרו ({generatedContent?.components?.length || 0})
                        </h3>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {generatedContent?.components?.map((component: any, index: number) => (
                            <div key={index} className="bg-gray-50 p-4 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="bg-emerald-100 text-emerald-600 px-2 py-1 rounded text-xs font-bold">
                                  {component.type}
                                </span>
                                <button
                                  type="button"
                                  className="text-gray-400 hover:text-emerald-600"
                                  title="ערוך רכיב"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                              </div>
                              <h4 className="font-medium text-sm">
                                {component.props?.title || 'רכיב ללא כותרת'}
                              </h4>
                              {component.props?.subtitle && (
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                  {component.props.subtitle}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* SEO Preview */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <Eye className="h-5 w-5 text-cyan-600" />
                          SEO מותאם
                        </h3>
                        <div className="space-y-4">
                          <div className="bg-cyan-50 p-4 rounded-lg">
                            <h4 className="text-sm font-semibold text-cyan-800 mb-2">Meta Title:</h4>
                            <p className="text-sm text-cyan-700">{generatedContent?.metaTitle}</p>
                          </div>
                          
                          <div className="bg-cyan-50 p-4 rounded-lg">
                            <h4 className="text-sm font-semibold text-cyan-800 mb-2">Meta Description:</h4>
                            <p className="text-sm text-cyan-700">{generatedContent?.metaDescription}</p>
                          </div>
                          
                          <div className="bg-cyan-50 p-4 rounded-lg">
                            <h4 className="text-sm font-semibold text-cyan-800 mb-2">Keywords:</h4>
                            <p className="text-sm text-cyan-700">{generatedContent?.metaKeywords}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-8 flex justify-between">
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setIsPreviewMode(false)
                            setCurrentStep(0)
                          }}
                          className="btn btn-outline"
                        >
                          חזור לעריכת שאלות
                        </button>
                        <button
                          type="button"
                          onClick={() => generateContentMutation.mutate()}
                          disabled={generateContentMutation.isPending}
                          className="btn btn-secondary"
                        >
                          <Wand2 className="ml-2 h-4 w-4" />
                          צור שוב
                        </button>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => {
                          onContentGenerated(generatedContent)
                          setIsOpen(false)
                          setIsPreviewMode(false)
                          setCurrentStep(0)
                          setAiAnswers({})
                          setGeneratedContent(null)
                        }}
                        className="btn btn-primary btn-lg bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="ml-2 h-5 w-5" />
                        השתמש בתוכן החכם
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
