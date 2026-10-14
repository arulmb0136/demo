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
  role: 'admin' | 'manager' | 'editor' | 'viewer' | string;
  permissions: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type AllowedRecordType =
  | 'Property Service Contract'
  | 'Purchase & Sales Agreement'
  | 'General Services Agreement';

export interface ContractAttachment {
  id: string | number;
  name: string;
  key: string;
  content_type: string;
  file_size: number;
  url: string;
}

export interface Contract {
  id: string; // Ironclad Record ID
  ironclad_id: string;
  title: string;
  record_type: AllowedRecordType | string;
  template_name: string;
  status: string; // draft, in_review, out_for_signature, signed, completed
  counterparty_name: string;
  contract_value: number;
  currency: string;
  agreement_date?: string;
  start_date?: string;
  completion_date?: string;
  last_synced_date?: string;
  creator_email?: string;
  department?: string;
  attributes: Record<string, any>;
  attachments: ContractAttachment[];
}

export interface ContractNotification {
  id: string;
  title: string;
  record_type: string;
  counterparty_name: string;
  contract_value: number;
  status: string;
  arrived_at: string;
}

export interface RoleDefinition {
  id: number;
  role_key: string;
  display_name: string;
  description: string;
  default_permissions: string[];
}

export interface PermissionOption {
  key: string;
  label: string;
  description: string;
}

export interface RoleMatrix {
  roles: RoleDefinition[];
  available_permissions: PermissionOption[];
  allowed_categories: string[];
}

export interface BiMetrics {
  total_portfolio_value: number;
  total_contracts_count: number;
  active_contracts_count: number;
  signed_contracts_count: number;
  pending_review_count?: number;
  avg_turnaround_days?: number;
  status_distribution: Record<string, number>;
  counterparty_exposure: { counterparty: string; value: number }[];
  monthly_trends: { month: string; count: number; volume: number }[];
  department_distribution: Record<string, number>;
  record_type_distribution?: Record<string, number>;
}
