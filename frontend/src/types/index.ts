export interface Project {
  id: string;
  code: string;
  name: string;
  principal: string;
  department: string;
  total_amount: number;
  status: 'active' | 'closed';
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
  budgets?: BudgetSubject[];
}

export interface BudgetSubject {
  id: string;
  project_id: string;
  code: string;
  name: string;
  budget_amount: number;
  used_amount: number;
  created_at: string;
  updated_at: string;
}

export interface Reimbursement {
  id: string;
  project_id: string;
  project_name?: string;
  project_status?: string;
  code: string;
  title: string;
  applicant: string;
  total_amount: number;
  status: ReimbursementStatus;
  description?: string;
  modification_note?: string;
  submit_time?: string;
  created_at: string;
  updated_at: string;
  items?: ReimbursementItem[];
  invoices?: Invoice[];
  preReviews?: PreReview[];
  confirmations?: Confirmation[];
  history?: StatusHistory[];
}

export type ReimbursementStatus = 
  | 'draft' 
  | 'pre_reviewing' 
  | 'pre_reviewed' 
  | 'rejected' 
  | 'confirmed';

export interface ReimbursementItem {
  id: string;
  reimbursement_id: string;
  budget_subject_id: string;
  subject_name: string;
  amount: number;
  description?: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  reimbursement_id: string;
  invoice_no: string;
  invoice_code?: string;
  amount: number;
  invoice_date?: string;
  vendor?: string;
  file_name?: string;
  file_path?: string;
  created_at: string;
}

export interface PreReview {
  id: string;
  reimbursement_id: string;
  reviewer: string;
  result: 'pass' | 'reject';
  opinion?: string;
  reviewed_at: string;
}

export interface Confirmation {
  id: string;
  reimbursement_id: string;
  confirmer: string;
  subject_id: string;
  subject_name?: string;
  over_amount: number;
  result: 'approved' | 'rejected';
  opinion?: string;
  confirmed_at: string;
}

export interface StatusHistory {
  id: string;
  reimbursement_id: string;
  from_status?: string;
  to_status: string;
  operator: string;
  remark?: string;
  created_at: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  needConfirmation?: boolean;
  overBudgetItems?: OverBudgetItem[];
}

export interface OverBudgetItem {
  subject_id: string;
  subject_name: string;
  budget_amount: number;
  used_amount: number;
  remaining: number;
  requested: number;
  over_amount: number;
}
