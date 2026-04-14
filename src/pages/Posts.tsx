import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Edit, Trash2, Eye, Calendar, User } from 'lucide-react'
import { Link } from 'react-router-dom'

interface Post {
  id: string
  title: string
  slug: string
  type: string
  category?: {
    id: string
    name: string
    slug: string
  }
  author?: {
    id: string
    name: string
    email: string
  }
  is_published: boolean
  published_at?: string
  created_at: string
  updated_at: string
  meta_description?: string
}

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function Posts() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all')
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy: 'created_at',
        sortOrder: 'desc',
      })

      if (searchTerm) {
        params.append('search', searchTerm)
      }

      if (filterStatus !== 'all') {
        params.append('isPublished', (filterStatus === 'published').toString())
      }

      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/posts?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error('Failed to fetch posts')

      const data = await response.json()
      setPosts(data.data || [])
      setPagination(data.pagination || pagination)
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [pagination.page, searchTerm, filterStatus])

  const handleDelete = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את הפוסט?')) return

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/posts/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error('Failed to delete post')

      setPosts(posts.filter((post) => post.id !== id))
    } catch (error) {
      console.error('Error deleting post:', error)
    }
  }

  const handleTogglePublish = async (post: Post) => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          isPublished: !post.is_published,
        }),
      })

      if (!response.ok) throw new Error('Failed to update post')

      fetchPosts() // Refresh the list
    } catch (error) {
      console.error('Error updating post:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ניהול פוסטים</h1>
          <p className="text-gray-600">נהל את כל הפוסטים באתר</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/posts/new"
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            פוסט חדש
          </Link>
          <Link
            to="/posts/ai-generator"
            className="btn btn-secondary flex items-center gap-2"
          >
            <span className="text-purple-600">🤖</span>
            יצירה עם AI
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="חפש פוסטים..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'published' | 'draft')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">כל הפוסטים</option>
            <option value="published">פורסמו</option>
            <option value="draft">טיוטות</option>
          </select>
        </div>
      </div>

      {/* Posts Table */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    כותרת
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    קטגוריה
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    סטטוס
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    תאריך יצירה
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    כותב
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    פעולות
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {post.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          /{post.slug}
                        </div>
                        {post.meta_description && (
                          <div className="text-xs text-gray-400 mt-1 line-clamp-1">
                            {post.meta_description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {post.category ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {post.category.name}
                        </span>
                      ) : (
                        <span className="text-gray-400">ללא קטגוריה</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleTogglePublish(post)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          post.is_published
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {post.is_published ? 'פורסם' : 'טיוטה'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex items-center">
                        <Calendar size={14} className="mr-1 text-gray-400" />
                        {formatDate(post.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex items-center">
                        <User size={14} className="mr-1 text-gray-400" />
                        {post.author?.name || 'לא ידוע'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/posts/${post.id}`}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          <Edit size={16} />
                        </Link>
                        <a
                          href={`/posts/${post.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-900 transition-colors"
                        >
                          <Eye size={16} />
                        </a>
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-gray-50 px-6 py-3 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                מציג {posts.length} מתוך {pagination.total} פוסטים
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50"
                >
                  הקודם
                </button>
                <span className="px-3 py-1 text-sm">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50"
                >
                  הבא
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {posts.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">אין פוסטים להצגה</div>
          <p className="text-gray-500">צור את הפוסט הראשון שלך</p>
        </div>
      )}
    </div>
  )
}
