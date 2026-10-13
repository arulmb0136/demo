export type ThemeKey =
  | 'dark'
  | 'light'
  | 'deep-blue'
  | 'pastel-pink'
  | 'charcoal-grey'
  | 'bright-yellow'
  | 'linkedin'
  | 'windows';

export interface ThemeOption {
  key: ThemeKey;
  name: string;
  previewBg: string;
  previewAccent: string;
  description: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'editor' | 'viewer';
  permissions: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: number;
  contract_id: number;
  name: string;
  s3_key: string;
  file_size_bytes: number;
  content_type: string;
  document_url?: string;
  uploaded_at: string;
}

export interface Contract {
  id: number;
  ironclad_id?: string;
  title: string;
  template_name: string;
  record_type?: string; // Ironclad record type ("contract", "statement-of-work", "nda")
  status: 'draft' | 'in_review' | 'out_for_signature' | 'signed' | 'archived';
  counterparty_name: string;
  contract_value: number;
  currency: string;

  // Lifecycle & Tracking Dates (developer.ironcladapp.com Data Lake & Warehouse Integration)
  agreement_date?: string; // Formal agreement date (properties.agreementDate)
  start_date?: string; // Term start date
  completion_date?: string; // Target or actual completion date
  signed_date?: string; // Execution / countersignature date
  last_synced_date?: string; // Ironclad lastUpdated audit timestamp
  renewal_notice_date?: string; // Notice cutoff deadline

  // Computed timeline analytics
  current_date?: string; // System reference current date
  days_remaining?: number; // Days until completion
  progress_percent?: number; // Lifecycle % completed
  tracking_status?: string; // "upcoming" | "active" | "expiring_soon" | "completed" | "in_progress" | "draft"

  effective_date?: string;
  expiration_date?: string;
  creator_email?: string;
  department: string;
  attributes: Record<string, any>;
  related_records?: { recordId: string }[];
  created_at: string;
  updated_at: string;
  documents: Document[];
}

export interface RoleDefinition {
  id: number;
  role_key: string;
  display_name: string;
  description: string;
  default_permissions: string[];
}

export interface BiMetrics {
  total_portfolio_value: number;
  total_contracts_count: number;
  active_contracts_count: number;
  pending_review_count: number;
  signed_contracts_count: number;
  avg_turnaround_days: number;
  status_distribution: Record<string, number>;
  counterparty_exposure: { counterparty: string; value: number }[];
  monthly_trends: { month: string; count: number; volume: number }[];
  department_distribution: Record<string, number>;
}
