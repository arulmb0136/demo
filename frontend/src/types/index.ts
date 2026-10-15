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
  | 'General Services Agreement'
  | 'Property Service Contract (BH)'
  | 'Purchase & Sale Agreement (BH)'
  | 'General Services Agreement (BH)'
  | 'propertyServiceContractBh'
  | 'purchaseSaleAgreementBh'
  | 'generalServicesAgreementBh';

export interface ContractAttachment {
  id: string | number;
  name: string;
  filename?: string;
  key: string;
  content_type: string;
  file_size?: number;
  file_hash?: string;
  hash_algorithm?: string;
  url?: string;
  view_url?: string | null;
  download_url?: string | null;
  can_view?: boolean;
  can_download?: boolean;
}

export interface Contract {
  id: string; // Ironclad Record ID
  ironclad_id: string;
  name?: string;
  title: string;
  type?: string;
  type_display_name?: string;
  record_type: AllowedRecordType | string;
  template_name?: string;
  status: string; // active, indeterminate, draft, in_review, signed, completed
  enhanced_status?: string;
  status_message?: string;
  remaining_duration?: string;
  event_date?: string;
  counterparty_name: string;
  contracting_entity?: string;
  community_name?: string;
  property_id?: string;
  agreement_type?: string;
  agreement_date?: string;
  effective_date?: string;
  expiration_date?: string;
  termination_date?: string;
  renewal_type?: string;
  initial_term_length?: string;
  renewal_term_length?: string;
  renewal_opt_out_date?: string;
  renewal_opt_out_period?: string;
  termination_notice_period?: string;
  times_renewed?: number | string;
  attachment_count?: number;
  has_attachments?: boolean;
  contract_value: number;
  currency: string;
  start_date?: string;
  completion_date?: string;
  last_synced_date?: string;
  last_updated?: string;
  creator_email?: string;
  department?: string;
  attributes?: Record<string, any>;
  properties?: Record<string, any>;
  permissions?: {
    can_view_attachments?: boolean;
    can_download_attachments?: boolean;
  };
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
