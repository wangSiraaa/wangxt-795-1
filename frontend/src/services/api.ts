import axios from 'axios';
import type { 
  Project, 
  Reimbursement, 
  BudgetSubject, 
  Invoice, 
  ApiResponse,
  OverBudgetItem 
} from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const projectApi = {
  getAll: () => api.get<ApiResponse<Project[]>>('/projects'),
  getById: (id: string) => api.get<ApiResponse<Project>>(`/projects/${id}`),
  create: (data: Partial<Project>) => api.post<ApiResponse<Project>>('/projects', data),
  close: (id: string) => api.post<ApiResponse>(`/projects/${id}/close`),
  getBudgets: (id: string) => api.get<ApiResponse<BudgetSubject[]>>(`/projects/${id}/budgets`),
  saveBudgets: (id: string, budgets: Partial<BudgetSubject>[]) => 
    api.post<ApiResponse<BudgetSubject[]>>(`/projects/${id}/budgets`, { budgets })
};

export const reimbursementApi = {
  getAll: () => api.get<ApiResponse<Reimbursement[]>>('/reimbursements'),
  getById: (id: string) => api.get<ApiResponse<Reimbursement>>(`/reimbursements/${id}`),
  create: (data: Partial<Reimbursement>) => api.post<ApiResponse<Reimbursement>>('/reimbursements', data),
  update: (id: string, data: Partial<Reimbursement>) => 
    api.put<ApiResponse<Reimbursement>>(`/reimbursements/${id}`, data),
  submit: (id: string, data: { modification_note?: string; operator?: string }) =>
    api.post<ApiResponse<Reimbursement>>(`/reimbursements/${id}/submit`, data),
  preReview: (id: string, data: { reviewer: string; result: 'pass' | 'reject'; opinion?: string }) =>
    api.post<ApiResponse<Reimbursement>>(`/reimbursements/${id}/pre-review`, data),
  confirm: (id: string, data: {
    confirmer: string;
    subject_id: string;
    over_amount: number;
    result: 'approved' | 'rejected';
    opinion?: string;
    operator?: string;
  }) => api.post<ApiResponse<Reimbursement>>(`/reimbursements/${id}/confirm`, data)
};

export const invoiceApi = {
  getByReimbursement: (reimbursementId: string) =>
    api.get<ApiResponse<Invoice[]>>(`/invoices/${reimbursementId}`),
  upload: (reimbursementId: string, formData: FormData) =>
    api.post<ApiResponse<Invoice>>(`/invoices/${reimbursementId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  delete: (id: string) => api.delete<ApiResponse>(`/invoices/${id}`),
  downloadUrl: (filename: string) => `/api/invoices/download/${filename}`
};

export default api;
