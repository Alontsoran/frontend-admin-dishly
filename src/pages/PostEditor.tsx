import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Eye, Settings } from 'lucide-react'
import PageBuilder from '@/components/page-builder/PageBuilder'
import ComponentSelector from '@/components/page-builder/ComponentSelector'
import ComponentEditor from '@/components/page-builder/ComponentEditor'
import { PageComponent, ComponentType } from '@/types'

interface Post {
  id: string
  title: string
  slug: string
  type: string
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
  created_at: string
  updated_at: string
}

interface Category {
  id: string
  name: string
  slug: string
}

export default function PostEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isNew = !id || id === 'new'

  const [post, setPost] = useState<Post>({
    id: '',
    title: '',
    slug: '',
    type: 'post',
    content: [],
    is_published: false,
    created_at: '',
    updated_at: '',
  })

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  
  // Component builder states
  const [showComponentSelector, setShowComponentSelector] = useState(false)
  const [editingComponent, setEditingComponent] = useState<{
    index: number
    type: string
    props: Record<string, any>
  } | null>(null)
  
  // Settings panel
  const [showSettings, setShowSettings] = useState(false)

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        const response = await fetch('/api/categories', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        
        if (response.ok) {
          const data = await response.json()
          setCategories(data.data || [])
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }

    fetchCategories()
  }, [])

  // Fetch post if editing existing
  useEffect(() => {
    console.log('🔍 PostEditor useEffect - ID:', id, 'isNew:', isNew)
    
    if (isNew) {
      console.log('⚠️ Skipping fetch - this is a new post')
      return
    }

    const fetchPost = async () => {
      console.log('📡 Fetching post with ID:', id)
      setLoading(true)
      try {
        const token = localStorage.getItem('auth_token')
        const response = await fetch(`/api/posts/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) throw new Error('Failed to fetch post')

        const data = await response.json()
        setPost(data.data)
        console.log('✅ Post loaded successfully')
      } catch (error) {
        console.error('Error fetching post:', error)
        navigate('/posts')
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [id, isNew, navigate])

  // Generate slug from title - keeping Hebrew
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-א-ת]/g, '') // Keep Hebrew letters, English letters, numbers, spaces, and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
      .trim()
      || 'post-' + Date.now() // Fallback if nothing remains
  }

  const handleTitleChange = (title: string) => {
    setPost(prev => ({
      ...prev,
      title,
      // עדכן slug אוטומטית רק אם זה פוסט חדש או אם הslug ריק/זהה לslug הקודם
      slug: (isNew || !prev.slug || prev.slug === generateSlug(prev.title)) 
        ? generateSlug(title) 
        : prev.slug,
    }))
  }

  const handleSave = async (publish = false) => {
    setSaving(true)
    
    // Validation בצד הfrontend
    if (!post.title.trim()) {
      alert('אנא הזן כותרת לפוסט')
      setSaving(false)
      return
    }

    // ודא שיש slug תקין (עברית + אנגלית)
    let validSlug = post.slug.trim()
    if (!validSlug || !/^[a-zA-Zא-ת0-9-]+$/.test(validSlug)) {
      validSlug = generateSlug(post.title)
      console.log('🔄 Generated new slug from title:', validSlug)
      
      // עדכן את הstate עם הslug החדש
      setPost(prev => ({
        ...prev,
        slug: validSlug
      }))
    }

    try {
      const token = localStorage.getItem('auth_token')
      console.log('🔑 Token from localStorage:', token ? `${token.substring(0, 20)}...` : 'NULL/UNDEFINED')
      
      const url = isNew ? '/api/posts' : `/api/posts/${post.id}`
      const method = isNew ? 'POST' : 'PUT'

      console.log('📡 Saving post:', { method, url, isNew })
      console.log('📦 Post data:', { title: post.title, slug: validSlug })

      const payload = {
        ...post,
        slug: validSlug,
        isPublished: publish || post.is_published,
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      console.log('📊 Response status:', response.status, response.statusText)

      if (!response.ok) {
        const errorData = await response.text()
        console.error('❌ Server error response:', errorData)
        throw new Error(`Failed to save post: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      if (isNew) {
        navigate(`/posts/${data.data.id}`)
      } else {
        setPost(data.data)
      }
      
      // Show success message
      console.log('Post saved successfully')
    } catch (error) {
      console.error('Error saving post:', error)
    } finally {
      setSaving(false)
    }
  }

  // Component builder handlers
  const handleAddComponent = (type: string, props: Record<string, any>) => {
    const newComponent: PageComponent = {
      id: `comp_${Date.now()}`,
      type: type as any,
      props,
      order: post.content.length,
    }
    
    setPost(prev => ({
      ...prev,
      content: [...prev.content, newComponent],
    }))
    
    setShowComponentSelector(false)
  }

  const handleEditComponent = (index: number, component: PageComponent) => {
    setEditingComponent({
      index,
      type: component.type,
      props: component.props,
    })
  }

  const handleSaveComponent = (props: Record<string, any>) => {
    if (editingComponent === null) return
    
    const updatedContent = [...post.content]
    updatedContent[editingComponent.index].props = props
    
    setPost(prev => ({
      ...prev,
      content: updatedContent,
    }))
    
    setEditingComponent(null)
  }

  const handleDeleteComponent = (index: number) => {
    if (confirm('האם אתה בטוח שברצונך למחוק רכיב זה?')) {
      const updatedContent = post.content.filter((_, i) => i !== index)
      setPost(prev => ({
        ...prev,
        content: updatedContent,
      }))
    }
  }

  const handleDuplicateComponent = (index: number) => {
    const componentToDuplicate = post.content[index]
    const newComponent: PageComponent = {
      ...componentToDuplicate,
      id: `comp_${Date.now()}`,
      order: index + 1,
    }
    
    const updatedContent = [
      ...post.content.slice(0, index + 1),
      newComponent,
      ...post.content.slice(index + 1),
    ]
    
    setPost(prev => ({
      ...prev,
      content: updatedContent,
    }))
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
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
                <h1 className="text-xl font-semibold text-gray-900">
                  {isNew ? 'פוסט חדש' : 'עריכת פוסט'}
                </h1>
                <p className="text-sm text-gray-500">
                  {post.slug && `/${post.slug}`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="btn btn-secondary flex items-center gap-2"
              >
                <Settings size={16} />
                הגדרות
              </button>
              
              {post.slug && (
                <a
                  href={`/posts/${post.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <Eye size={16} />
                  תצוגה מקדימה
                </a>
              )}
              
              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                className="btn btn-secondary flex items-center gap-2"
              >
                <Save size={16} />
                {saving ? 'שומר...' : 'שמירה'}
              </button>
              
              <button
                onClick={() => handleSave(true)}
                disabled={saving}
                className="btn btn-primary flex items-center gap-2"
              >
                <Eye size={16} />
                {post.is_published ? 'עדכן פרסום' : 'פרסם'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Main Content */}
        <div className={`flex-1 transition-all duration-300 ${showSettings ? 'mr-80' : ''}`}>
          <div className="p-6">
            {/* Title Input */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="כותרת הפוסט... (חובה)"
                value={post.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className={`w-full text-3xl font-bold border-none focus:outline-none focus:ring-0 placeholder-gray-400 ${
                  !post.title.trim() && post.title !== '' ? 'text-red-500' : ''
                }`}
              />
              {!post.title.trim() && post.title !== '' && (
                <p className="text-red-500 text-sm mt-2">שדה חובה - אנא הזן כותרת לפוסט</p>
              )}
            </div>

            {/* Page Builder */}
            <PageBuilder
              components={post.content}
              onEdit={handleEditComponent}
              onDelete={handleDeleteComponent}
              onDuplicate={handleDuplicateComponent}
              onAddAfter={(_index) => {
                setShowComponentSelector(true)
              }}
            />

            {/* Add Component Button */}
            <div className="text-center py-8">
              <button
                onClick={() => setShowComponentSelector(true)}
                className="btn btn-primary btn-lg flex items-center gap-2 mx-auto"
              >
                + הוסף רכיב
              </button>
            </div>
          </div>
        </div>

        {/* Settings Sidebar */}
        {showSettings && (
          <div className="fixed left-0 top-0 h-full w-80 bg-white border-r border-gray-200 shadow-lg z-40 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">הגדרות פוסט</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Slug */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slug (כתובת URL)
                  </label>
                  <input
                    type="text"
                    value={post.slug}
                    onChange={(e) => setPost(prev => ({ ...prev, slug: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="post-slug"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    קטגוריה
                  </label>
                  <select
                    value={post.category_id || ''}
                    onChange={(e) => setPost(prev => ({ ...prev, category_id: e.target.value || undefined }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">ללא קטגוריה</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* SEO Settings */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">הגדרות SEO</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Meta Title
                      </label>
                      <input
                        type="text"
                        value={post.meta_title || ''}
                        onChange={(e) => setPost(prev => ({ ...prev, meta_title: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Meta Description
                      </label>
                      <textarea
                        value={post.meta_description || ''}
                        onChange={(e) => setPost(prev => ({ ...prev, meta_description: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Publishing */}
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={post.is_published}
                      onChange={(e) => setPost(prev => ({ ...prev, is_published: e.target.checked }))}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="mr-2 text-sm font-medium text-gray-700">
                      פרסם פוסט
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Component Selector Modal */}
      {showComponentSelector && (
        <ComponentSelector
          onSelect={handleAddComponent}
          onClose={() => setShowComponentSelector(false)}
        />
      )}

      {/* Component Editor Modal */}
      {editingComponent && (
        <ComponentEditor
          type={editingComponent.type as ComponentType}
          props={editingComponent.props}
          onSave={handleSaveComponent}
          onCancel={() => setEditingComponent(null)}
        />
      )}
    </div>
  )
}
