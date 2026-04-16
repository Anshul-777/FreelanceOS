import axios from 'axios'

const BASE_URL = '/api'

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('flos_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('flos_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ─── Auth ─────────────────────────────────────────────────────────────────
export const authApi = {
  login:           (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register:        (data: any) =>
    api.post('/auth/register', data),
  me:              () => api.get('/auth/me'),
  updateMe:        (data: any) => api.put('/auth/me', data),
  changePassword:  (current: string, next: string) =>
    api.post(`/auth/change-password?current_password=${current}&new_password=${next}`),
}

// ─── Dashboard ────────────────────────────────────────────────────────────
export const dashboardApi = {
  get: () => api.get('/dashboard'),
}

// ─── Projects ─────────────────────────────────────────────────────────────
export const projectsApi = {
  list:   (params?: any) => api.get('/projects', { params }),
  get:    (id: number)   => api.get(`/projects/${id}`),
  create: (data: any)    => api.post('/projects', data),
  update: (id: number, data: any) => api.put(`/projects/${id}`, data),
  delete: (id: number)   => api.delete(`/projects/${id}`),

  listTasks:   (projectId: number) => api.get(`/projects/${projectId}/tasks`),
  createTask:  (projectId: number, data: any) => api.post(`/projects/${projectId}/tasks`, data),
  updateTask:  (taskId: number, data: any) => api.put(`/projects/tasks/${taskId}`, data),
  deleteTask:  (taskId: number) => api.delete(`/projects/tasks/${taskId}`),
}

// ─── Clients ───────────────────────────────────────────────────────────────
export const clientsApi = {
  list:   (params?: any) => api.get('/clients', { params }),
  get:    (id: number)   => api.get(`/clients/${id}`),
  create: (data: any)    => api.post('/clients', data),
  update: (id: number, data: any) => api.put(`/clients/${id}`, data),
  delete: (id: number)   => api.delete(`/clients/${id}`),
  getNotes:  (id: number) => api.get(`/clients/${id}/notes`),
  addNote:   (id: number, content: string) =>
    api.post(`/clients/${id}/notes?content=${encodeURIComponent(content)}`),
}

// ─── Time Entries ──────────────────────────────────────────────────────────
export const timeApi = {
  list:    (params?: any) => api.get('/time-entries', { params }),
  get:     (id: number)   => api.get(`/time-entries/${id}`),
  create:  (data: any)    => api.post('/time-entries', data),
  update:  (id: number, data: any) => api.put(`/time-entries/${id}`, data),
  delete:  (id: number)   => api.delete(`/time-entries/${id}`),
  summary: (period: string) => api.get(`/time-entries/summary?period=${period}`),
}

// ─── Invoices ──────────────────────────────────────────────────────────────
export const invoicesApi = {
  list:       (params?: any) => api.get('/invoices', { params }),
  get:        (id: number)   => api.get(`/invoices/${id}`),
  create:     (data: any)    => api.post('/invoices', data),
  update:     (id: number, data: any) => api.put(`/invoices/${id}`, data),
  delete:     (id: number)   => api.delete(`/invoices/${id}`),
  markSent:   (id: number)   => api.post(`/invoices/${id}/mark-sent`),
  markPaid:   (id: number, paid_date?: string) =>
    api.post(`/invoices/${id}/mark-paid${paid_date ? `?paid_date=${paid_date}` : ''}`),
  downloadPdf:(id: number)   =>
    api.get(`/invoices/${id}/pdf`, { responseType: 'blob' }),
}

// ─── Expenses ──────────────────────────────────────────────────────────────
export const expensesApi = {
  list:    (params?: any) => api.get('/expenses', { params }),
  get:     (id: number)   => api.get(`/expenses/${id}`),
  create:  (data: any)    => api.post('/expenses', data),
  update:  (id: number, data: any) => api.put(`/expenses/${id}`, data),
  delete:  (id: number)   => api.delete(`/expenses/${id}`),
  summary: (year?: number) => api.get(`/expenses/summary${year ? `?year=${year}` : ''}`),
}

// ─── Analytics ─────────────────────────────────────────────────────────────
export const analyticsApi = {
  get: (year?: number) => api.get(`/analytics${year ? `?year=${year}` : ''}`),
}

export default api
