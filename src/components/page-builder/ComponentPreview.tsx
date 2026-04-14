import { ComponentType } from '@/types'
import {
  Home,
  MessageSquare,
  Type,
  Image,
  Images,
  List,
  Star,
  HelpCircle,
  Megaphone,
  Video,
  MapPin,
  Minus,
  Space,
  Columns,
  LayoutList,
  ChevronDown,
  BarChart,
  Loader,
  Share2,
  Mail,
  Navigation,
  Clock,
  FolderTree,
  Users,
  Award,
} from 'lucide-react'

const componentIcons: Record<ComponentType, any> = {
  hero: Home,
  contactForm: MessageSquare,
  text: Type,
  image: Image,
  gallery: Images,
  servicesList: List,
  testimonials: Star,
  faq: HelpCircle,
  cta: Megaphone,
  video: Video,
  map: MapPin,
  divider: Minus,
  spacer: Space,
  columns: Columns,
  tabs: LayoutList,
  accordion: ChevronDown,
  counter: BarChart,
  progressBar: Loader,
  socialLinks: Share2,
  newsletter: Mail,
  breadcrumbs: Navigation,
  recentPosts: Clock,
  categories: FolderTree,
  categoriesGrid: FolderTree,
  homeStats: BarChart,
  popularPages: Star,
  teamSection: Users,
  timelineSection: Clock,
  valuesSection: Award,
  contactInfo: Mail,
  process: LayoutList,
  processFlow: Navigation,
  pageHero: Home,
  logoStrip: Award,
  techNetwork: Share2,
  statistics: BarChart,
  tips: HelpCircle,
  systemsCarousel: LayoutList,
}

const componentLabels: Record<ComponentType, string> = {
  hero: 'הירו',
  contactForm: 'טופס יצירת קשר',
  text: 'טקסט',
  image: 'תמונה',
  gallery: 'גלריית תמונות',
  servicesList: 'רשימת שירותים',
  testimonials: 'המלצות',
  faq: 'שאלות נפוצות',
  cta: 'קריאה לפעולה',
  video: 'וידאו',
  map: 'מפה',
  divider: 'מפריד',
  spacer: 'רווח',
  columns: 'עמודות',
  tabs: 'טאבים',
  accordion: 'אקורדיון',
  counter: 'מונה',
  progressBar: 'סרגל התקדמות',
  socialLinks: 'רשתות חברתיות',
  newsletter: 'ניוזלטר',
  breadcrumbs: 'פירורי לחם',
  recentPosts: 'פוסטים אחרונים',
  categories: 'קטגוריות',
  categoriesGrid: 'רשת קטגוריות דינמית',
  homeStats: 'סטטיסטיקות האתר',
  popularPages: 'דפים פופולריים',
  teamSection: 'צוות החברה',
  timelineSection: 'ציר זמן',
  valuesSection: 'ערכי החברה',
  contactInfo: 'פרטי התקשרות',
  process: 'תהליך עבודה',
  processFlow: 'Flow תהליך אנימטיבי',
  pageHero: 'הירו דף רגיל',
  logoStrip: 'רצועת לוגואים',
  techNetwork: 'מפת טכנולוגיות',
  statistics: 'סטטיסטיקות',
  tips: 'טיפים',
  systemsCarousel: 'קרוסלת מערכות',
}

interface ComponentPreviewProps {
  type: ComponentType
  props: Record<string, any>
}

export default function ComponentPreview({ type, props }: ComponentPreviewProps) {
  const Icon = componentIcons[type]
  const label = componentLabels[type]

  const renderPreview = () => {
    switch (type) {
      case 'hero':
        return (
          <div 
            className="relative bg-gradient-to-r from-primary-50 to-gray-50 p-6 rounded overflow-hidden"
            style={props.backgroundImage ? {
              backgroundImage: `url(${props.backgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            } : {}}
          >
            {props.backgroundImage && (
              <div className="absolute inset-0 bg-black bg-opacity-40" />
            )}
            <div className={`relative z-10 ${props.backgroundImage ? 'text-white' : ''}`}>
              <h3 className="text-xl font-bold mb-2">{props.title || 'כותרת הירו'}</h3>
              <p className={`${props.backgroundImage ? 'text-gray-100' : 'text-gray-600'}`}>
                {props.subtitle || 'תת כותרת'}
              </p>
              {props.ctaText && (
                <button className="mt-4 btn btn-primary btn-sm">
                  {props.ctaText}
                </button>
              )}
            </div>
          </div>
        )

      case 'text':
        return (
          <div className="prose prose-sm max-w-none">
            <div dangerouslySetInnerHTML={{ __html: props.content || '<p>תוכן טקסט</p>' }} />
          </div>
        )

      case 'image':
        return (
          <div className="text-center">
            {props.src ? (
              <img
                src={props.src}
                alt={props.alt || ''}
                className="max-h-48 mx-auto rounded"
                onError={(e) => {
                  console.error('Image load error:', props.src);
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="bg-gray-100 h-48 flex items-center justify-center rounded">
                <Image className="h-12 w-12 text-gray-400" />
                <p className="text-gray-500 mt-2">אין תמונה</p>
              </div>
            )}
            {props.caption && (
              <p className="text-sm text-gray-500 mt-2">{props.caption}</p>
            )}
          </div>
        )

      case 'gallery':
        return (
          <div>
            <h4 className="font-semibold mb-3">גלריה ({props.images?.length || 0} תמונות)</h4>
            <div className="grid grid-cols-3 gap-2">
              {props.images?.slice(0, 6).map((img: any, i: number) => (
                <div key={i} className="aspect-square bg-gray-100 rounded overflow-hidden">
                  {img.src ? (
                    <img
                      src={img.src}
                      alt={img.alt || `תמונה ${i + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Gallery image load error:', img.src);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Images className="h-8 w-8" />
                    </div>
                  )}
                </div>
              )) || Array(6).fill(0).map((_, i) => (
                <div key={i} className="aspect-square bg-gray-100 rounded flex items-center justify-center">
                  <Images className="h-8 w-8 text-gray-400" />
                </div>
              ))}
            </div>
          </div>
        )

      case 'contactForm':
        return (
          <div className="bg-gray-50 p-4 rounded">
            <h4 className="font-semibold mb-2">{props.title || 'צור קשר'}</h4>
            <div className="space-y-2">
              <div className="h-8 bg-white rounded border border-gray-200" />
              <div className="h-8 bg-white rounded border border-gray-200" />
              <div className="h-20 bg-white rounded border border-gray-200" />
              <button className="btn btn-primary btn-sm w-full">
                {props.submitText || 'שליחה'}
              </button>
            </div>
          </div>
        )

      case 'servicesList':
        return (
          <div>
            <h4 className="font-semibold mb-3">{props.title || 'השירותים שלנו'}</h4>
            <div className="grid grid-cols-3 gap-2">
              {Array(props.services?.length || 6).fill(0).map((_, i) => (
                <div key={i} className="bg-gray-100 p-3 rounded text-center">
                  <div className="h-8 w-8 bg-gray-300 rounded-full mx-auto mb-2" />
                  <div className="h-3 bg-gray-300 rounded w-3/4 mx-auto" />
                </div>
              ))}
            </div>
          </div>
        )

      case 'testimonials':
        return (
          <div>
            <h4 className="font-semibold mb-3">{props.title || 'המלצות לקוחות'}</h4>
            <div className="bg-gray-50 p-4 rounded">
              <div className="flex items-center gap-1 mb-2">
                {Array(5).fill(0).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-sm text-gray-600 italic mb-2">
                "ציטוט לדוגמה של המלצה מלקוח מרוצה..."
              </p>
              <p className="text-sm font-semibold">- שם הלקוח</p>
            </div>
          </div>
        )

      case 'faq':
        return (
          <div>
            <h4 className="font-semibold mb-3">{props.title || 'שאלות נפוצות'}</h4>
            <div className="space-y-2">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="border border-gray-200 rounded p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">שאלה {i + 1}</span>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 'cta':
        return (
          <div className="bg-primary-50 p-6 rounded text-center">
            <h4 className="text-lg font-semibold mb-2">
              {props.title || 'קריאה לפעולה'}
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              {props.description || 'תיאור קצר'}
            </p>
            <button className="btn btn-primary btn-sm">
              {props.buttonText || 'לחץ כאן'}
            </button>
          </div>
        )

      case 'divider':
        return (
          <hr
            className="border-gray-300"
            style={{
              borderStyle: props.style || 'solid',
              borderColor: props.color || '#e2e2e2',
              borderWidth: `${props.thickness || 1}px`,
              margin: `${props.margin || 20}px 0`,
            }}
          />
        )

      case 'spacer':
        return (
          <div
            className="bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400"
            style={{ height: `${props.height || 50}px` }}
          >
            <Space className="h-6 w-6" />
          </div>
        )

      case 'categoriesGrid':
        return (
          <div className="bg-primary-50 p-6 rounded-lg text-center">
            <h4 className="font-bold mb-3">{props.title || 'רשת קטגוריות דינמית'}</h4>
            <div className="grid grid-cols-2 gap-2">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="bg-white rounded p-3 text-center shadow-sm">
                  <div className="w-8 h-8 bg-primary-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <FolderTree className="h-4 w-4 text-primary-600" />
                  </div>
                  <div className="text-xs text-gray-600">קטגוריה {i + 1}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">מציג את כל הקטגוריות אוטומטית</p>
          </div>
        )

      case 'homeStats':
        return (
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6 rounded-lg text-white text-center">
            <h4 className="font-bold mb-4 text-white">{props.title || 'סטטיסטיקות האתר'}</h4>
            <div className="grid grid-cols-2 gap-3">
              {(props.stats || [
                { number: '87', label: 'דפים' },
                { number: '12', label: 'קטגוריות' },
                { number: '2500+', label: 'לקוחות' },
                { number: '98%', label: 'שביעות רצון' }
              ]).slice(0, 4).map((stat: any, i: number) => (
                <div key={i} className="text-center">
                  <div className="text-xl font-bold">{stat.number}</div>
                  <div className="text-xs opacity-90">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        )

      case 'popularPages':
        return (
          <div className="bg-gray-50 p-6 rounded-lg">
            <h4 className="font-bold mb-4">{props.title || 'דפים פופולריים'}</h4>
            <div className="space-y-3">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="bg-white rounded p-3 flex items-center gap-3 border border-gray-200">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Star className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">שירות פופולרי {i + 1}</div>
                    <div className="text-xs text-gray-500">תיאור קצר</div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">מציג דפים פופולריים אוטומטית</p>
          </div>
        )

      case 'teamSection':
        return (
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h4 className="font-bold mb-4 text-center">{props.title || 'צוות החברה'}</h4>
            <div className="grid grid-cols-3 gap-4">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="text-center">
                  <div className="w-16 h-16 bg-primary-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <Users className="h-8 w-8 text-primary-600" />
                  </div>
                  <div className="text-sm font-medium">חבר צוות {i + 1}</div>
                  <div className="text-xs text-gray-500">תפקיד</div>
                </div>
              ))}
            </div>
          </div>
        )

      case 'timelineSection':
        return (
          <div className="bg-gray-50 p-6 rounded-lg">
            <h4 className="font-bold mb-4 text-center">{props.title || 'ציר זמן'}</h4>
            <div className="space-y-4">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="h-4 w-4 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">202{i + 1}</div>
                    <div className="text-xs text-gray-500">אירוע חשוב {i + 1}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 'valuesSection':
        return (
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h4 className="font-bold mb-4 text-center">{props.title || 'ערכי החברה'}</h4>
            <div className="grid grid-cols-2 gap-4">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="text-center">
                  <div className="w-12 h-12 bg-primary-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <Award className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="text-sm font-medium">ערך {i + 1}</div>
                  <div className="text-xs text-gray-500">תיאור ערך</div>
                </div>
              ))}
            </div>
          </div>
        )

      case 'contactInfo':
        return (
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h4 className="font-bold mb-4 text-center">{props.title || 'פרטי התקשרות'}</h4>
            <div className="space-y-3">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Mail className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">פרט התקשרות {i + 1}</div>
                    <div className="text-xs text-gray-500">מידע ליצירת קשר</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 'process':
        return (
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h4 className="font-bold mb-4 text-center">{props.title || 'תהליך עבודה'}</h4>
            <div className="space-y-4">
              {(props.steps || [
                { title: 'שלב 1', description: 'תיאור השלב הראשון' },
                { title: 'שלב 2', description: 'תיאור השלב השני' },
                { title: 'שלב 3', description: 'תיאור השלב השלישי' }
              ]).slice(0, 3).map((step: any, i: number) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary-600">{i + 1}</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{step.title}</div>
                    <div className="text-xs text-gray-500">{step.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 'statistics':
        return (
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white text-center">
            <h4 className="font-bold mb-4 text-white">{props.title || 'סטטיסטיקות'}</h4>
            <div className="grid grid-cols-2 gap-3">
              {(props.statistics || [
                { label: 'לקוחות מרוצים', value: '95%' },
                { label: 'פרויקטים', value: '150+' },
                { label: 'שנות ניסיון', value: '15' },
                { label: 'עובדים', value: '25' }
              ]).slice(0, 4).map((stat: any, i: number) => (
                <div key={i} className="text-center">
                  <div className="text-xl font-bold">{stat.value}</div>
                  <div className="text-xs opacity-90">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        )

      case 'tips':
        return (
          <div className="bg-amber-50 p-6 rounded-lg border border-amber-200">
            <h4 className="font-bold mb-4 text-center text-amber-800">
              {props.title || 'טיפים שימושיים'} 
              <span className="text-xs text-amber-600 block font-normal">
                ({(props.tips || []).length} טיפים)
              </span>
            </h4>
            
            {(!props.tips || props.tips.length === 0) ? (
              <div className="text-center text-amber-700 py-4">
                <HelpCircle className="h-8 w-8 mx-auto mb-2 text-amber-500" />
                <p className="text-sm">אין טיפים עדיין</p>
                <p className="text-xs text-amber-600">לחץ על "ערוך רכיב" כדי להוסיף טיפים</p>
              </div>
            ) : (
              <div className={`space-y-3 ${props.columns === 2 ? 'md:grid md:grid-cols-2 md:gap-4 md:space-y-0' : props.columns === 3 ? 'lg:grid lg:grid-cols-3 lg:gap-4 lg:space-y-0' : ''}`}>
                {props.tips.map((tip: any, i: number) => (
                  <div key={i} className="bg-white rounded-lg p-4 border border-amber-100 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-amber-600 font-bold text-sm">{i + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-semibold text-amber-800 mb-1 leading-tight">
                          {tip.title || `טיפ ${i + 1}`}
                        </h5>
                        <p className="text-xs text-amber-700 leading-relaxed">
                          {tip.description || 'תיאור הטיפ'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )

      case 'pageHero':
        return (
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-lg text-center">
            <div className="w-12 h-1 bg-gradient-to-l from-blue-600 to-cyan-500 mx-auto rounded-full mb-3" />
            <h4 className="text-xl font-bold text-gray-900 mb-2">{props.title || 'כותרת הדף'}</h4>
            {props.subtitle && <p className="text-gray-500 text-sm">{props.subtitle?.replace(/<[^>]*>/g, '').substring(0, 80)}</p>}
            {props.ctaText && (
              <div className="mt-3">
                <span className="inline-block bg-blue-600 text-white text-xs px-4 py-1.5 rounded-lg">{props.ctaText}</span>
              </div>
            )}
          </div>
        )

      case 'processFlow':
        return (
          <div className="bg-gray-50 p-6 rounded-lg">
            <h4 className="font-bold text-center mb-4">{props.title || 'איך התהליך עובד?'}</h4>
            <div className="flex items-center justify-center gap-2">
              {(props.steps || []).slice(0, 5).map((step: any, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center" style={{ background: step.color || '#2563EB' }}>
                    {i + 1}
                  </div>
                  {i < (props.steps || []).length - 1 && i < 4 && <div className="w-6 h-0.5 bg-gray-300" />}
                </div>
              ))}
            </div>
            <div className="text-center text-xs text-gray-400 mt-2">{(props.steps || []).length} שלבים</div>
          </div>
        )

      case 'techNetwork':
        return (
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-6 rounded-lg text-center">
            <h4 className="font-bold mb-3">{props.title || 'מפת טכנולוגיות'}</h4>
            <div className="flex flex-wrap justify-center gap-2">
              {['D365', 'WA', 'PBI', 'Teams', 'Azure', 'AI'].map((tech) => (
                <span key={tech} className="bg-white border border-gray-200 rounded-full px-3 py-1 text-xs font-medium text-gray-600">{tech}</span>
              ))}
            </div>
          </div>
        )

      default:
        return (
          <div className="bg-gray-50 p-6 rounded text-center">
            {Icon ? (
              <Icon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            ) : (
              <LayoutList className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            )}
            <p className="text-sm font-medium text-gray-600">{label}</p>
          </div>
        )
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 text-sm text-gray-500">
        {Icon ? (
          <Icon className="h-4 w-4" />
        ) : (
          <LayoutList className="h-4 w-4" />
        )}
        <span>{label}</span>
      </div>
      {renderPreview()}
    </div>
  )
}
