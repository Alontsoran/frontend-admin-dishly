import { ComponentType, ComponentDefinition } from '@/types'
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
  Grid3x3,
  TrendingUp,
  Users,
  Award,
} from 'lucide-react'

const componentDefinitions: Record<ComponentType, ComponentDefinition> = {
  pageHero: {
    type: 'pageHero',
    label: 'הירו דף רגיל',
    icon: Home,
    defaultProps: {
      title: '',
      subtitle: '',
      ctaText: '',
      ctaLink: '#contact',
      alignment: 'center',
      size: 'md',
      showContactForm: true,
    },
    fields: [
      { name: 'title', label: 'כותרת', type: 'text', placeholder: 'כותרת הדף', required: true },
      { name: 'subtitle', label: 'תת כותרת', type: 'richtext', placeholder: 'תיאור קצר' },
      { name: 'showContactForm', label: 'הצג טופס יצירת קשר מוטמע', type: 'checkbox' },
      { name: 'ctaText', label: 'טקסט כפתור (כשטופס כבוי)', type: 'text', placeholder: 'צרו קשר' },
      { name: 'ctaLink', label: 'קישור כפתור', type: 'text', placeholder: '#contact' },
      { name: 'alignment', label: 'יישור', type: 'select', options: [{ value: 'center', label: 'מרכז' }, { value: 'right', label: 'ימין' }] },
      { name: 'size', label: 'גודל', type: 'select', options: [{ value: 'sm', label: 'קטן' }, { value: 'md', label: 'בינוני' }, { value: 'lg', label: 'גדול' }] },
    ],
  },

  logoStrip: {
    type: 'logoStrip',
    label: 'רצועת לוגואים',
    icon: Award,
    defaultProps: {
      title: 'נבחרנו על ידי חברות מובילות',
    },
    fields: [
      { name: 'title', label: 'כותרת', type: 'text', placeholder: 'נבחרנו על ידי חברות מובילות' },
    ],
  },

  hero: {
    type: 'hero',
    label: 'הירו דף הבית (מיוחד)',
    icon: Home,
    defaultProps: {
      title: 'DoWe — ניהול חתונה ואישורי הגעה',
      subtitle: 'רשימת מוזמנים, וואטסאפ לאורחים וסידור הושבה במקום אחד.',
      ctaText: 'קבלו הצעה',
      ctaLink: '#contact',
      secondaryCtaText: 'איך זה עובד?',
      secondaryCtaLink: '#how-it-works',
    },
    fields: [
      { name: 'title', label: 'כותרת ראשית', type: 'text', placeholder: 'הכותרת הראשית', required: true },
      { name: 'subtitle', label: 'תת כותרת', type: 'richtext', placeholder: 'טקסט תיאור' },
      { name: 'ctaText', label: 'טקסט כפתור ראשי', type: 'text', placeholder: 'קבעו פגישה' },
      { name: 'ctaLink', label: 'קישור כפתור ראשי', type: 'text', placeholder: '#contact' },
      { name: 'secondaryCtaText', label: 'טקסט כפתור משני', type: 'text', placeholder: 'איך זה עובד?' },
      { name: 'secondaryCtaLink', label: 'קישור כפתור משני', type: 'text', placeholder: '#how-it-works' },
    ],
  },

  contactForm: {
    type: 'contactForm',
    label: 'טופס יצירת קשר',
    icon: MessageSquare,
    defaultProps: {
      title: 'צור קשר',
      showProfessionTypes: true,
      submitText: 'שליחה',
    },
    fields: [
      {
        name: 'title',
        label: 'כותרת',
        type: 'text',
        defaultValue: 'צור קשר',
      },
      {
        name: 'showProfessionTypes',
        label: 'הצג סוגי מקצועות',
        type: 'checkbox',
        defaultValue: true,
      },
      {
        name: 'submitText',
        label: 'טקסט כפתור שליחה',
        type: 'text',
        defaultValue: 'שליחה',
      },
    ],
  },

  text: {
    type: 'text',
    label: 'טקסט',
    icon: Type,
    defaultProps: {
      content: '',
      alignment: 'right',
    },
    fields: [
      {
        name: 'content',
        label: 'תוכן',
        type: 'richtext',
        placeholder: 'הכנס את התוכן כאן...',
        required: true,
      },
      {
        name: 'alignment',
        label: 'יישור',
        type: 'select',
        options: [
          { value: 'right', label: 'ימין' },
          { value: 'center', label: 'מרכז' },
          { value: 'left', label: 'שמאל' },
        ],
        defaultValue: 'right',
      },
    ],
  },

  image: {
    type: 'image',
    label: 'תמונה',
    icon: Image,
    defaultProps: {
      src: '',
      alt: '',
      caption: '',
      width: '100%',
      height: 'auto',
    },
    fields: [
      {
        name: 'src',
        label: 'כתובת תמונה',
        type: 'image',
        required: true,
      },
      {
        name: 'alt',
        label: 'טקסט חלופי',
        type: 'text',
        placeholder: 'תיאור התמונה',
      },
      {
        name: 'caption',
        label: 'כיתוב',
        type: 'text',
        placeholder: 'כיתוב מתחת לתמונה',
      },
      {
        name: 'width',
        label: 'רוחב',
        type: 'text',
        placeholder: '100%',
        defaultValue: '100%',
      },
      {
        name: 'height',
        label: 'גובה',
        type: 'text',
        placeholder: 'auto',
        defaultValue: 'auto',
      },
    ],
  },

  gallery: {
    type: 'gallery',
    label: 'גלריית תמונות',
    icon: Images,
    defaultProps: {
      images: [],
      columns: 3,
      spacing: 4,
    },
    fields: [
      {
        name: 'images',
        label: 'תמונות',
        type: 'array',
        itemLabel: 'תמונה',
        fields: [
          {
            name: 'src',
            label: 'תמונה',
            type: 'image',
            placeholder: 'בחר תמונה',
          },
          {
            name: 'alt',
            label: 'טקסט חלופי',
            type: 'text',
            placeholder: 'תיאור',
          },
        ],
      },
      {
        name: 'columns',
        label: 'מספר עמודות',
        type: 'number',
        min: 1,
        max: 6,
        defaultValue: 3,
      },
      {
        name: 'spacing',
        label: 'רווח בין תמונות',
        type: 'number',
        min: 0,
        max: 10,
        defaultValue: 4,
      },
    ],
  },

  systemsCarousel: {
    type: 'systemsCarousel',
    label: 'קרוסלת תמונות מסך (מערכות)',
    icon: Images,
    defaultProps: {
      title: '',
      items: [],
    },
    fields: [
      {
        name: 'title',
        label: 'כותרת לקטע',
        type: 'text',
        placeholder: 'תמונות מסך מהמערכות',
      },
      {
        name: 'items',
        label: 'תמונות מסך',
        type: 'array',
        itemLabel: 'מערכת',
        fields: [
          {
            name: 'src',
            label: 'תמונה',
            type: 'image',
            placeholder: 'בחר תמונת מסך',
          },
          {
            name: 'systemName',
            label: 'שם המערכת',
            type: 'text',
            placeholder: 'שם המערכת',
          },
          {
            name: 'caption',
            label: 'כיתוב (אופציונלי)',
            type: 'text',
            placeholder: 'תיאור קצר',
          },
        ],
      },
    ],
  },

  servicesList: {
    type: 'servicesList',
    label: 'רשימת שירותים',
    icon: List,
    defaultProps: {
      title: '',
      services: [],
      columns: 3,
    },
    fields: [
      {
        name: 'title',
        label: 'כותרת',
        type: 'text',
        placeholder: 'השירותים שלנו',
      },
      {
        name: 'services',
        label: 'שירותים',
        type: 'array',
        itemLabel: 'שירות',
        fields: [
          {
            name: 'icon',
            label: 'אייקון',
            type: 'icon',
            placeholder: 'בחר אייקון',
            required: false,
          },
          {
            name: 'title',
            label: 'כותרת',
            type: 'text',
            placeholder: 'שם השירות',
            required: true,
          },
          {
            name: 'description',
            label: 'תיאור',
            type: 'textarea',
            rows: 2,
            placeholder: 'תיאור מפורט של השירות',
            required: true,
          },
          {
            name: 'color',
            label: 'צבע האייקון',
            type: 'color',
            defaultValue: '#2563EB',
          },
        ],
      },
      {
        name: 'columns',
        label: 'מספר עמודות',
        type: 'number',
        min: 1,
        max: 4,
        defaultValue: 3,
      },
    ],
  },

  testimonials: {
    type: 'testimonials',
    label: 'המלצות',
    icon: Star,
    defaultProps: {
      title: 'המלצות לקוחות',
      testimonials: [],
      autoPlay: true,
    },
    fields: [
      {
        name: 'title',
        label: 'כותרת',
        type: 'text',
        defaultValue: 'המלצות לקוחות',
      },
      {
        name: 'testimonials',
        label: 'המלצות',
        type: 'array',
        itemLabel: 'המלצה',
        fields: [
          {
            name: 'content',
            label: 'תוכן',
            type: 'text',
            placeholder: 'טקסט ההמלצה',
          },
          {
            name: 'author',
            label: 'שם הממליץ',
            type: 'text',
            placeholder: 'שם מלא',
          },
          {
            name: 'role',
            label: 'תפקיד/מיקום',
            type: 'text',
            placeholder: 'תפקיד או מיקום',
          },
          {
            name: 'rating',
            label: 'דירוג',
            type: 'number',
            min: 1,
            max: 5,
            defaultValue: 5,
          },
        ],
      },
      {
        name: 'autoPlay',
        label: 'הפעלה אוטומטית',
        type: 'checkbox',
        defaultValue: true,
      },
    ],
  },

  faq: {
    type: 'faq',
    label: 'שאלות נפוצות',
    icon: HelpCircle,
    defaultProps: {
      title: 'שאלות נפוצות',
      items: [],
    },
    fields: [
      {
        name: 'title',
        label: 'כותרת',
        type: 'text',
        defaultValue: 'שאלות נפוצות',
      },
      {
        name: 'items',
        label: 'שאלות',
        type: 'array',
        itemLabel: 'שאלה',
        fields: [
          {
            name: 'question',
            label: 'שאלה',
            type: 'text',
            placeholder: 'השאלה',
          },
          {
            name: 'answer',
            label: 'תשובה',
            type: 'text',
            placeholder: 'התשובה',
          },
        ],
      },
    ],
  },

  cta: {
    type: 'cta',
    label: 'קריאה לפעולה',
    icon: Megaphone,
    defaultProps: {
      title: '',
      description: '',
      buttonText: '',
      buttonLink: '',
      backgroundColor: '#449f4a',
    },
    fields: [
      {
        name: 'title',
        label: 'כותרת',
        type: 'text',
        placeholder: 'צור איתנו קשר עוד היום',
        required: true,
      },
      {
        name: 'description',
        label: 'תיאור',
        type: 'textarea',
        placeholder: 'תיאור קצר',
      },
      {
        name: 'buttonText',
        label: 'טקסט כפתור',
        type: 'text',
        placeholder: 'לחץ כאן',
      },
      {
        name: 'buttonLink',
        label: 'קישור',
        type: 'text',
        placeholder: '/contact',
      },
      {
        name: 'backgroundColor',
        label: 'צבע רקע',
        type: 'color',
        defaultValue: '#449f4a',
      },
    ],
  },

  video: {
    type: 'video',
    label: 'וידאו',
    icon: Video,
    defaultProps: {
      url: '',
      title: '',
      autoplay: false,
      controls: true,
    },
    fields: [
      {
        name: 'url',
        label: 'כתובת וידאו',
        type: 'text',
        placeholder: 'YouTube/Vimeo URL',
        required: true,
      },
      {
        name: 'title',
        label: 'כותרת',
        type: 'text',
      },
      {
        name: 'autoplay',
        label: 'הפעלה אוטומטית',
        type: 'checkbox',
        defaultValue: false,
      },
      {
        name: 'controls',
        label: 'הצג פקדים',
        type: 'checkbox',
        defaultValue: true,
      },
    ],
  },

  map: {
    type: 'map',
    label: 'מפה',
    icon: MapPin,
    defaultProps: {
      address: '',
      zoom: 15,
      height: '400px',
    },
    fields: [
      {
        name: 'address',
        label: 'כתובת',
        type: 'text',
        placeholder: 'הכנס כתובת',
        required: true,
      },
      {
        name: 'zoom',
        label: 'רמת זום',
        type: 'number',
        min: 1,
        max: 20,
        defaultValue: 15,
      },
      {
        name: 'height',
        label: 'גובה המפה',
        type: 'text',
        placeholder: '400px',
        defaultValue: '400px',
      },
    ],
  },

  divider: {
    type: 'divider',
    label: 'מפריד',
    icon: Minus,
    defaultProps: {
      style: 'solid',
      color: '#e2e2e2',
      thickness: 1,
      margin: 20,
    },
    fields: [
      {
        name: 'style',
        label: 'סגנון',
        type: 'select',
        options: [
          { value: 'solid', label: 'רציף' },
          { value: 'dashed', label: 'מקווקו' },
          { value: 'dotted', label: 'נקודות' },
        ],
        defaultValue: 'solid',
      },
      {
        name: 'color',
        label: 'צבע',
        type: 'color',
        defaultValue: '#e2e2e2',
      },
      {
        name: 'thickness',
        label: 'עובי',
        type: 'number',
        min: 1,
        max: 10,
        defaultValue: 1,
      },
      {
        name: 'margin',
        label: 'רווח',
        type: 'number',
        min: 0,
        max: 100,
        defaultValue: 20,
      },
    ],
  },

  spacer: {
    type: 'spacer',
    label: 'רווח',
    icon: Space,
    defaultProps: {
      height: 50,
    },
    fields: [
      {
        name: 'height',
        label: 'גובה (פיקסלים)',
        type: 'number',
        min: 10,
        max: 200,
        defaultValue: 50,
      },
    ],
  },

  columns: {
    type: 'columns',
    label: 'עמודות',
    icon: Columns,
    defaultProps: {
      columns: [],
      gap: 4,
      mobileStack: true,
    },
    fields: [
      {
        name: 'columns',
        label: 'עמודות',
        type: 'array',
        itemLabel: 'עמודה',
        fields: [
          {
            name: 'width',
            label: 'רוחב (%)',
            type: 'number',
            min: 10,
            max: 100,
            defaultValue: 50,
          },
          {
            name: 'content',
            label: 'תוכן',
            type: 'text',
            placeholder: 'תוכן העמודה',
          },
        ],
      },
      {
        name: 'gap',
        label: 'רווח בין עמודות',
        type: 'number',
        min: 0,
        max: 10,
        defaultValue: 4,
      },
      {
        name: 'mobileStack',
        label: 'ערימה במובייל',
        type: 'checkbox',
        defaultValue: true,
      },
    ],
  },

  tabs: {
    type: 'tabs',
    label: 'טאבים',
    icon: LayoutList,
    defaultProps: {
      tabs: [],
      defaultTab: 0,
    },
    fields: [
      {
        name: 'tabs',
        label: 'טאבים',
        type: 'array',
        itemLabel: 'טאב',
        fields: [
          {
            name: 'title',
            label: 'כותרת',
            type: 'text',
            placeholder: 'כותרת הטאב',
          },
          {
            name: 'content',
            label: 'תוכן',
            type: 'text',
            placeholder: 'תוכן הטאב',
          },
        ],
      },
      {
        name: 'defaultTab',
        label: 'טאב ברירת מחדל',
        type: 'number',
        min: 0,
        defaultValue: 0,
      },
    ],
  },

  accordion: {
    type: 'accordion',
    label: 'אקורדיון',
    icon: ChevronDown,
    defaultProps: {
      items: [],
      allowMultiple: false,
    },
    fields: [
      {
        name: 'items',
        label: 'פריטים',
        type: 'array',
        itemLabel: 'פריט',
        fields: [
          {
            name: 'title',
            label: 'כותרת',
            type: 'text',
            placeholder: 'כותרת הפריט',
          },
          {
            name: 'content',
            label: 'תוכן',
            type: 'text',
            placeholder: 'תוכן הפריט',
          },
        ],
      },
      {
        name: 'allowMultiple',
        label: 'אפשר פתיחה מרובה',
        type: 'checkbox',
        defaultValue: false,
      },
    ],
  },

  counter: {
    type: 'counter',
    label: 'מונה',
    icon: BarChart,
    defaultProps: {
      counters: [
        { label: 'פרויקטים שהושלמו', value: 150, suffix: '+' },
        { label: 'לקוחות מרוצים', value: 98, suffix: '%' },
        { label: 'שנות ניסיון', value: 15, prefix: '' },
        { label: 'עובדים מקצועיים', value: 25, suffix: '' }
      ],
      duration: 2000,
      columns: 4
    },
    fields: [
      {
        name: 'counters',
        label: 'מונים',
        type: 'array',
        fields: [
          {
            name: 'label',
            label: 'תיאור',
            type: 'text',
            placeholder: 'לדוגמה: פרויקטים שהושלמו'
          },
          {
            name: 'value',
            label: 'ערך',
            type: 'number',
            defaultValue: 0
          },
          {
            name: 'prefix',
            label: 'תחילית',
            type: 'text',
            placeholder: 'לדוגמה: $'
          },
          {
            name: 'suffix',
            label: 'סיומת',
            type: 'text',
            placeholder: 'לדוגמה: +'
          }
        ]
      },
      {
        name: 'duration',
        label: 'משך אנימציה (ms)',
        type: 'number',
        min: 500,
        max: 5000,
        defaultValue: 2000,
      },
      {
        name: 'columns',
        label: 'מספר עמודות',
        type: 'select',
        options: [
          { value: '2', label: '2 עמודות' },
          { value: '3', label: '3 עמודות' },
          { value: '4', label: '4 עמודות' }
        ],
        defaultValue: 4
      }
    ],
  },

  progressBar: {
    type: 'progressBar',
    label: 'סרגל התקדמות',
    icon: Loader,
    defaultProps: {
      items: [
        { label: 'עיצוב', value: 90, color: 'bg-blue-600' },
        { label: 'פיתוח', value: 75, color: 'bg-green-600' },
        { label: 'שיווק', value: 80, color: 'bg-purple-600' }
      ],
      showValue: true,
      height: 'md',
      animated: true
    },
    fields: [
      {
        name: 'items',
        label: 'סרגלי התקדמות',
        type: 'array',
        fields: [
          {
            name: 'label',
            label: 'תיאור',
            type: 'text',
            placeholder: 'לדוגמה: עיצוב'
          },
          {
            name: 'value',
            label: 'ערך (0-100)',
            type: 'number',
            min: 0,
            max: 100,
            defaultValue: 50
          },
          {
            name: 'color',
            label: 'צבע',
            type: 'select',
            options: [
              { value: 'bg-primary-600', label: 'ראשי' },
              { value: 'bg-blue-600', label: 'כחול' },
              { value: 'bg-green-600', label: 'ירוק' },
              { value: 'bg-purple-600', label: 'סגול' },
              { value: 'bg-red-600', label: 'אדום' },
              { value: 'bg-yellow-600', label: 'צהוב' }
            ],
            defaultValue: 'bg-primary-600'
          }
        ]
      },
      {
        name: 'showValue',
        label: 'הצג ערכים',
        type: 'checkbox',
        defaultValue: true
      },
      {
        name: 'height',
        label: 'גובה',
        type: 'select',
        options: [
          { value: 'sm', label: 'קטן' },
          { value: 'md', label: 'בינוני' },
          { value: 'lg', label: 'גדול' }
        ],
        defaultValue: 'md'
      },
      {
        name: 'animated',
        label: 'עם אנימציה',
        type: 'checkbox',
        defaultValue: true
      }
    ],
  },

  socialLinks: {
    type: 'socialLinks',
    label: 'רשתות חברתיות',
    icon: Share2,
    defaultProps: {
      facebook: '',
      instagram: '',
      whatsapp: '',
      youtube: '',
    },
    fields: [
      {
        name: 'facebook',
        label: 'Facebook',
        type: 'text',
        placeholder: 'https://facebook.com/...',
      },
      {
        name: 'instagram',
        label: 'Instagram',
        type: 'text',
        placeholder: 'https://instagram.com/...',
      },
      {
        name: 'whatsapp',
        label: 'WhatsApp',
        type: 'text',
        placeholder: '972501234567',
      },
      {
        name: 'youtube',
        label: 'YouTube',
        type: 'text',
        placeholder: 'https://youtube.com/...',
      },
    ],
  },

  newsletter: {
    type: 'newsletter',
    label: 'ניוזלטר',
    icon: Mail,
    defaultProps: {
      title: 'הירשמו לניוזלטר',
      description: '',
      submitText: 'הרשמה',
    },
    fields: [
      {
        name: 'title',
        label: 'כותרת',
        type: 'text',
        defaultValue: 'הירשמו לניוזלטר',
      },
      {
        name: 'description',
        label: 'תיאור',
        type: 'textarea',
        placeholder: 'קבלו עדכונים ומבצעים ישירות למייל',
      },
      {
        name: 'submitText',
        label: 'טקסט כפתור',
        type: 'text',
        defaultValue: 'הרשמה',
      },
    ],
  },

  breadcrumbs: {
    type: 'breadcrumbs',
    label: 'פירורי לחם',
    icon: Navigation,
    defaultProps: {
      items: [],
      separator: '/',
    },
    fields: [
      {
        name: 'items',
        label: 'פריטים',
        type: 'array',
        itemLabel: 'פריט',
        fields: [
          {
            name: 'label',
            label: 'תווית',
            type: 'text',
            placeholder: 'דף בית',
          },
          {
            name: 'link',
            label: 'קישור',
            type: 'text',
            placeholder: '/',
          },
        ],
      },
      {
        name: 'separator',
        label: 'מפריד',
        type: 'text',
        defaultValue: '/',
      },
    ],
  },

  recentPosts: {
    type: 'recentPosts',
    label: 'פוסטים אחרונים',
    icon: Clock,
    defaultProps: {
      title: 'פוסטים אחרונים',
      count: 5,
      showDate: true,
      showExcerpt: true,
    },
    fields: [
      {
        name: 'title',
        label: 'כותרת',
        type: 'text',
        defaultValue: 'פוסטים אחרונים',
      },
      {
        name: 'count',
        label: 'מספר פוסטים',
        type: 'number',
        min: 1,
        max: 10,
        defaultValue: 5,
      },
      {
        name: 'showDate',
        label: 'הצג תאריך',
        type: 'checkbox',
        defaultValue: true,
      },
      {
        name: 'showExcerpt',
        label: 'הצג תקציר',
        type: 'checkbox',
        defaultValue: true,
      },
    ],
  },

  categories: {
    type: 'categories',
    label: 'קטגוריות',
    icon: FolderTree,
    defaultProps: {
      title: 'קטגוריות',
      showCount: true,
      layout: 'list',
    },
    fields: [
      {
        name: 'title',
        label: 'כותרת',
        type: 'text',
        defaultValue: 'קטגוריות',
      },
      {
        name: 'showCount',
        label: 'הצג מספר פריטים',
        type: 'checkbox',
        defaultValue: true,
      },
      {
        name: 'layout',
        label: 'פריסה',
        type: 'select',
        options: [
          { value: 'list', label: 'רשימה' },
          { value: 'grid', label: 'רשת' },
        ],
        defaultValue: 'list',
      },
    ],
  },

  // רכיבים מיוחדים לדף הבית
  categoriesGrid: {
    type: 'categoriesGrid',
    label: 'רשת קטגוריות דינמית',
    icon: Grid3x3,
    defaultProps: {
      title: 'כל השירותים שלנו',
      subtitle: 'מצא את הפתרון המושלם לכל עסק',
      columns: 4,
      showPageCount: true,
      style: 'modern',
      selectedCategories: [],
      autoFetch: true,
    },
    fields: [
      {
        name: 'title',
        label: 'כותרת',
        type: 'text',
        defaultValue: 'כל השירותים שלנו',
      },
      {
        name: 'subtitle',
        label: 'תת כותרת',
        type: 'text',
        defaultValue: 'מצא את הפתרון המושלם לכל עסק',
      },
      {
        name: 'autoFetch',
        label: 'הצג את כל הקטגוריות אוטומטית',
        type: 'checkbox',
        defaultValue: true,
      },
      {
        name: 'selectedCategories',
        label: 'בחר קטגוריות ספציפיות',
        type: 'categories',
        multiple: true,
      },
      {
        name: 'columns',
        label: 'מספר עמודות',
        type: 'select',
        options: [
          { value: '2', label: '2' },
          { value: '3', label: '3' },
          { value: '4', label: '4' },
        ],
        defaultValue: 4,
      },
      {
        name: 'style',
        label: 'סגנון תצוגה',
        type: 'select',
        options: [
          { value: 'modern', label: 'מודרני' },
          { value: 'cards', label: 'כרטיסיות' },
          { value: 'tiles', label: 'אריחים' },
        ],
        defaultValue: 'modern',
      },
      {
        name: 'showPageCount',
        label: 'הצג מספר דפים',
        type: 'checkbox',
        defaultValue: true,
      },
    ],
  },

  homeStats: {
    type: 'homeStats',
    label: 'סטטיסטיקות האתר',
    icon: TrendingUp,
    defaultProps: {
      title: 'המספרים מדברים בעד עצמם',
      stats: [
        { number: '2500+', label: 'לקוחות פעילים', icon: 'users' },
        { number: '87', label: 'דפי שירותים', icon: 'file-text' },
        { number: '12', label: 'קטגוריות', icon: 'folder' },
        { number: '98%', label: 'שביעות רצון', icon: 'star' },
      ],
    },
    fields: [
      {
        name: 'title',
        label: 'כותרת',
        type: 'text',
        defaultValue: 'המספרים מדברים בעד עצמם',
      },
      {
        name: 'stats',
        label: 'סטטיסטיקות',
        type: 'array',
        itemLabel: 'סטטיסטיקה',
        fields: [
          {
            name: 'number',
            label: 'מספר',
            type: 'text',
            placeholder: '2500+',
            required: true,
          },
          {
            name: 'label',
            label: 'תווית',
            type: 'text',
            placeholder: 'לקוחות פעילים',
            required: true,
          },
          {
            name: 'icon',
            label: 'אייקון',
            type: 'icon',
            placeholder: 'בחר אייקון',
          },
        ],
      },
    ],
  },

  popularPages: {
    type: 'popularPages',
    label: 'דפים פופולריים',
    icon: Star,
    defaultProps: {
      title: 'השירותים הפופולריים ביותר',
      limit: 6,
      layout: 'grid',
      autoFetch: true,
    },
    fields: [
      {
        name: 'title',
        label: 'כותרת',
        type: 'text',
        defaultValue: 'השירותים הפופולריים ביותר',
      },
      {
        name: 'limit',
        label: 'מספר דפים להצגה',
        type: 'number',
        min: 3,
        max: 12,
        defaultValue: 6,
      },
      {
        name: 'layout',
        label: 'פריסה',
        type: 'select',
        options: [
          { value: 'grid', label: 'רשת' },
          { value: 'list', label: 'רשימה' },
          { value: 'carousel', label: 'קרוסלה' },
        ],
        defaultValue: 'grid',
      },
    ],
  },

  // רכיבי דף אודות
  teamSection: {
    type: 'teamSection',
    label: 'צוות החברה',
    icon: Users,
    defaultProps: {
      title: 'הצוות שלנו',
      subtitle: 'האנשים שעובדים בשבילכם',
      layout: 'grid',
      columns: 3,
      members: [],
    },
    fields: [
      {
        name: 'title',
        label: 'כותרת',
        type: 'text',
        defaultValue: 'הצוות שלנו',
      },
      {
        name: 'subtitle',
        label: 'תת כותרת',
        type: 'text',
        defaultValue: 'האנשים שעובדים בשבילכם',
      },
      {
        name: 'layout',
        label: 'פריסה',
        type: 'select',
        options: [
          { value: 'grid', label: 'רשת' },
          { value: 'list', label: 'רשימה' },
          { value: 'cards', label: 'כרטיסיות' },
        ],
        defaultValue: 'grid',
      },
      {
        name: 'columns',
        label: 'מספר עמודות',
        type: 'select',
        options: [
          { value: '2', label: '2' },
          { value: '3', label: '3' },
          { value: '4', label: '4' },
        ],
        defaultValue: 3,
      },
      {
        name: 'members',
        label: 'חברי צוות',
        type: 'array',
        itemLabel: 'חבר צוות',
        fields: [
          {
            name: 'name',
            label: 'שם',
            type: 'text',
            required: true,
          },
          {
            name: 'position',
            label: 'תפקיד',
            type: 'text',
            required: true,
          },
          {
            name: 'bio',
            label: 'תיאור',
            type: 'textarea',
            rows: 3,
          },
          {
            name: 'avatar',
            label: 'תמונה',
            type: 'image',
          },
          {
            name: 'email',
            label: 'אימייל',
            type: 'text',
          },
          {
            name: 'phone',
            label: 'טלפון',
            type: 'text',
          },
        ],
      },
    ],
  },

  timelineSection: {
    type: 'timelineSection',
    label: 'ציר זמן',
    icon: Clock,
    defaultProps: {
      title: 'הדרך שלנו',
      subtitle: 'מהקמה ועד היום',
      layout: 'vertical',
      events: [],
    },
    fields: [
      {
        name: 'title',
        label: 'כותרת',
        type: 'text',
        defaultValue: 'הדרך שלנו',
      },
      {
        name: 'subtitle',
        label: 'תת כותרת',
        type: 'text',
        defaultValue: 'מהקמה ועד היום',
      },
      {
        name: 'layout',
        label: 'פריסה',
        type: 'select',
        options: [
          { value: 'vertical', label: 'אנכי' },
          { value: 'horizontal', label: 'אופקי' },
        ],
        defaultValue: 'vertical',
      },
      {
        name: 'events',
        label: 'אירועים',
        type: 'array',
        itemLabel: 'אירוע',
        fields: [
          {
            name: 'year',
            label: 'שנה',
            type: 'text',
            required: true,
          },
          {
            name: 'title',
            label: 'כותרת',
            type: 'text',
            required: true,
          },
          {
            name: 'description',
            label: 'תיאור',
            type: 'textarea',
            rows: 3,
          },
          {
            name: 'icon',
            label: 'אייקון',
            type: 'icon',
          },
          {
            name: 'highlight',
            label: 'הדגש אירוע',
            type: 'checkbox',
            defaultValue: false,
          },
        ],
      },
    ],
  },

  valuesSection: {
    type: 'valuesSection',
    label: 'ערכי החברה',
    icon: Award,
    defaultProps: {
      title: 'הערכים שלנו',
      subtitle: 'מה מנחה אותנו בעבודה',
      background: 'white',
      columns: 3,
      values: [],
    },
    fields: [
      {
        name: 'title',
        label: 'כותרת',
        type: 'text',
        defaultValue: 'הערכים שלנו',
      },
      {
        name: 'subtitle',
        label: 'תת כותרת',
        type: 'text',
        defaultValue: 'מה מנחה אותנו בעבודה',
      },
      {
        name: 'background',
        label: 'רקע',
        type: 'select',
        options: [
          { value: 'white', label: 'לבן' },
          { value: 'gray', label: 'אפור' },
          { value: 'primary', label: 'צבע ראשי' },
        ],
        defaultValue: 'white',
      },
      {
        name: 'columns',
        label: 'מספר עמודות',
        type: 'select',
        options: [
          { value: '2', label: '2' },
          { value: '3', label: '3' },
          { value: '4', label: '4' },
        ],
        defaultValue: 3,
      },
      {
        name: 'values',
        label: 'ערכים',
        type: 'array',
        itemLabel: 'ערך',
        fields: [
          {
            name: 'title',
            label: 'כותרת',
            type: 'text',
            required: true,
          },
          {
            name: 'description',
            label: 'תיאור',
            type: 'textarea',
            rows: 3,
            required: true,
          },
          {
            name: 'icon',
            label: 'אייקון',
            type: 'icon',
          },
          {
            name: 'color',
            label: 'צבע',
            type: 'color',
            defaultValue: '#2563EB',
          },
        ],
      },
    ],
  },

  // רכיבי דף צור קשר
  contactInfo: {
    type: 'contactInfo',
    label: 'פרטי התקשרות',
    icon: Mail,
    defaultProps: {
      title: 'פרטי התקשרות',
      subtitle: 'אנחנו כאן בשבילכם',
      layout: 'grid',
      showIcons: true,
      contacts: [],
    },
    fields: [
      {
        name: 'title',
        label: 'כותרת',
        type: 'text',
        defaultValue: 'פרטי התקשרות',
      },
      {
        name: 'subtitle',
        label: 'תת כותרת',
        type: 'text',
        defaultValue: 'אנחנו כאן בשבילכם',
      },
      {
        name: 'layout',
        label: 'פריסה',
        type: 'select',
        options: [
          { value: 'grid', label: 'רשת' },
          { value: 'list', label: 'רשימה' },
          { value: 'cards', label: 'כרטיסיות' },
        ],
        defaultValue: 'grid',
      },
      {
        name: 'showIcons',
        label: 'הצג אייקונים',
        type: 'checkbox',
        defaultValue: true,
      },
      {
        name: 'contacts',
        label: 'פרטי קשר',
        type: 'array',
        itemLabel: 'פרט קשר',
        fields: [
          {
            name: 'type',
            label: 'סוג',
            type: 'select',
            options: [
              { value: 'phone', label: 'טלפון' },
              { value: 'email', label: 'אימייל' },
              { value: 'address', label: 'כתובת' },
              { value: 'hours', label: 'שעות פעילות' },
              { value: 'website', label: 'אתר' },
              { value: 'whatsapp', label: 'WhatsApp' },
              { value: 'fax', label: 'פקס' },
            ],
            required: true,
          },
          {
            name: 'label',
            label: 'תווית',
            type: 'text',
            required: true,
          },
          {
            name: 'value',
            label: 'ערך',
            type: 'text',
            required: true,
          },
          {
            name: 'link',
            label: 'קישור',
            type: 'text',
            placeholder: 'tel:+972507000000 או mailto:info@dowe.co.il',
          },
          {
            name: 'icon',
            label: 'אייקון מותאם',
            type: 'icon',
          },
          {
            name: 'color',
            label: 'צבע',
            type: 'color',
            defaultValue: '#2563EB',
          },
        ],
      },
    ],
  },
  
  process: {
    type: 'process',
    label: 'תהליך עבודה',
    icon: LayoutList,
    defaultProps: {
      title: 'התהליך שלנו',
      steps: [
        {
          title: 'פגישת ייעוץ',
          description: 'נבין את הצרכים והדרישות שלכם',
        },
        {
          title: 'תכנון',
          description: 'נציג פתרונות מותאמים אישית',
        },
      ],
      showNumbers: true,
      layout: 'vertical',
    },
    fields: [
      {
        name: 'title',
        label: 'כותרת',
        type: 'text',
        placeholder: 'התהליך שלנו',
      },
      {
        name: 'steps',
        label: 'שלבים',
        type: 'array',
        fields: [
          {
            name: 'title',
            label: 'כותרת השלב',
            type: 'text',
            required: true,
          },
          {
            name: 'description',
            label: 'תיאור',
            type: 'textarea',
            required: true,
          },
        ],
      },
    ],
  },
  
  processFlow: {
    type: 'processFlow',
    label: 'Flow תהליך אנימטיבי',
    icon: TrendingUp,
    defaultProps: {
      title: 'איך התהליך עובד?',
      subtitle: '',
      steps: [
        {
          title: 'פגישת היכרות',
          description: 'נפגשים, מכירים את העסק ומבינים את האתגרים',
          color: '#2563EB',
        },
        {
          title: 'אפיון צרכים',
          description: 'יושבים עם בעלי העניין ובונים אפיון מפורט',
          color: '#06B6D4',
        },
      ],
    },
    fields: [
      {
        name: 'title',
        label: 'כותרת',
        type: 'text',
        placeholder: 'איך התהליך עובד?',
      },
      {
        name: 'subtitle',
        label: 'תת כותרת',
        type: 'text',
        placeholder: 'תיאור קצר של התהליך',
      },
      {
        name: 'steps',
        label: 'שלבים',
        type: 'array',
        fields: [
          {
            name: 'title',
            label: 'כותרת השלב',
            type: 'text',
            required: true,
          },
          {
            name: 'description',
            label: 'תיאור',
            type: 'textarea',
            required: true,
          },
          {
            name: 'color',
            label: 'צבע',
            type: 'color',
          },
        ],
      },
    ],
  },

  techNetwork: {
    type: 'techNetwork',
    label: 'מפת טכנולוגיות',
    icon: Grid3x3,
    defaultProps: {
      title: 'האקוסיסטם הטכנולוגי שלנו',
      subtitle: 'אנחנו עובדים עם כל הכלים המובילים - ומחברים ביניהם',
    },
    fields: [
      {
        name: 'title',
        label: 'כותרת',
        type: 'text',
        placeholder: 'האקוסיסטם הטכנולוגי שלנו',
      },
      {
        name: 'subtitle',
        label: 'תת כותרת',
        type: 'text',
        placeholder: 'תיאור קצר',
      },
    ],
  },

  statistics: {
    type: 'statistics',
    label: 'סטטיסטיקות',
    icon: BarChart,
    defaultProps: {
      title: 'הנתונים שלנו',
      statistics: [
        {
          label: 'לקוחות מרוצים',
          value: '95%',
        },
      ],
      columns: 4,
    },
    fields: [
      {
        name: 'title',
        label: 'כותרת',
        type: 'text',
        placeholder: 'הנתונים שלנו',
      },
      {
        name: 'statistics',
        label: 'סטטיסטיקות',
        type: 'array',
        fields: [
          {
            name: 'label',
            label: 'תווית',
            type: 'text',
            required: true,
          },
          {
            name: 'value',
            label: 'ערך',
            type: 'text',
            required: true,
          },
        ],
      },
    ],
  },
  
  tips: {
    type: 'tips',
    label: 'טיפים',
    icon: HelpCircle,
    defaultProps: {
      title: 'טיפים שימושיים',
      tips: [
        {
          title: 'טיפ ראשון',
          description: 'תיאור הטיפ הראשון',
        },
      ],
      columns: 3,
      style: 'cards',
    },
    fields: [
      {
        name: 'title',
        label: 'כותרת',
        type: 'text',
        placeholder: 'טיפים שימושיים',
      },
      {
        name: 'tips',
        label: 'טיפים',
        type: 'array',
        fields: [
          {
            name: 'title',
            label: 'כותרת הטיפ',
            type: 'text',
            required: true,
          },
          {
            name: 'description',
            label: 'תיאור',
            type: 'textarea',
            required: true,
          },
        ],
      },
    ],
  },
}

export function getComponentDefinition(type: ComponentType): ComponentDefinition | undefined {
  return componentDefinitions[type]
}

export function getAllComponentDefinitions(): ComponentDefinition[] {
  return Object.values(componentDefinitions)
}

// Default export for backwards compatibility
export default {
  getComponentDefinition,
  getAllComponentDefinitions,
  componentDefinitions
}
