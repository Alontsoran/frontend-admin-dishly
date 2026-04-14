// User types
export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'editor' | 'viewer'
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Page types
export type PageType = 'home' | 'page' | 'category' | 'post'

export interface PageComponent {
  id: string
  type: ComponentType
  props: Record<string, any>
  order: number
  isVisible?: boolean // Defaults to true if not specified
  children?: PageComponent[]
}

export interface Page {
  id: string
  title: string
  slug: string
  type: PageType
  category_id?: string
  content: PageComponent[]
  meta_title?: string
  meta_description?: string
  meta_keywords?: string
  og_title?: string
  og_description?: string
  og_image?: string
  is_published: boolean
  published_at?: string
  author_id: string
  created_at: string
  updated_at: string
  last_ai_processed_at?: string
  category?: Category
  author?: User
}

// Category types
export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  parent_id?: string
  parent?: Category
  children?: Category[]
  meta_title?: string
  meta_description?: string
  is_active: boolean
  order_index: number
  created_at: string
  updated_at: string
}

// Component types
export type ComponentType = 
  | 'hero'
  | 'contactForm'
  | 'text'
  | 'image'
  | 'gallery'
  | 'servicesList'
  | 'testimonials'
  | 'faq'
  | 'cta'
  | 'video'
  | 'map'
  | 'divider'
  | 'spacer'
  | 'columns'
  | 'tabs'
  | 'accordion'
  | 'counter'
  | 'progressBar'
  | 'socialLinks'
  | 'newsletter'
  | 'breadcrumbs'
  | 'recentPosts'
  | 'categories'
  | 'categoriesGrid'
  | 'homeStats'
  | 'popularPages'
  | 'teamSection'
  | 'timelineSection'
  | 'valuesSection'
  | 'contactInfo'
  | 'process'
  | 'pageHero'
  | 'logoStrip'
  | 'processFlow'
  | 'techNetwork'
  | 'statistics'
  | 'tips'
  | 'systemsCarousel'

export interface Component {
  id: string
  name: string
  type: ComponentType
  props: Record<string, any>
  isGlobal: boolean
  createdAt: string
  updatedAt: string
}

// Media types
export interface MediaItem {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  altText?: string
  caption?: string
  uploadedBy?: string
  createdAt: string
}

// Settings types
export interface Settings {
  id: string
  key: string
  value: any
  groupName?: string
  createdAt: string
  updatedAt: string
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Form types
export interface LoginForm {
  email: string
  password: string
}

export interface UserForm {
  email: string
  password?: string
  name: string
  role: 'admin' | 'editor' | 'viewer'
}

export interface PageForm {
  title: string
  slug: string
  type: PageType
  categoryId?: string
  metaTitle?: string
  metaDescription?: string
  metaKeywords?: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
}

export interface CategoryForm {
  name: string
  slug: string
  description?: string
  parentId?: string
  metaTitle?: string
  metaDescription?: string
  orderIndex?: number
}

// Component Builder types
export interface ComponentDefinition {
  type: ComponentType
  label: string
  icon: any // Lucide icon component
  defaultProps: Record<string, any>
  fields: ComponentField[]
}

export interface ComponentField {
  name: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'image' | 'color' | 'array' | 'richtext' | 'categories' | 'icon'
  placeholder?: string
  options?: { value: string; label: string }[]
  defaultValue?: any
  required?: boolean
  min?: number
  max?: number
  itemLabel?: string // For array items
  fields?: ComponentField[] // For nested array fields
  multiple?: boolean // For select fields with multiple selection
  rows?: number // For textarea fields
}
