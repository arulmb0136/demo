import React, { useState, useEffect } from 'react';
import { Contract } from '../types';
import { X, Check, Save } from 'lucide-react';

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contractData: Partial<Contract>) => Promise<void>;
  contractToEdit?: Contract | null;
}

export const ContractModal: React.FC<ContractModalProps> = ({
  isOpen,
  onClose,
  onSave,
  contractToEdit,
}) => {
  const [formData, setFormData] = useState<Partial<Contract>>({
    title: '',
    template_name: 'Master Services Agreement',
    record_type: 'contract',
    status: 'draft',
    counterparty_name: '',
    contract_value: 50000,
    currency: 'USD',
    department: 'Sales',
    agreement_date: new Date().toISOString().split('T')[0],
    start_date: new Date().toISOString().split('T')[0],
    completion_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    renewal_notice_date: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (contractToEdit) {
      setFormData({
        title: contractToEdit.title,
        template_name: contractToEdit.template_name,
        record_type: contractToEdit.record_type || 'contract',
        status: contractToEdit.status,
        counterparty_name: contractToEdit.counterparty_name,
        contract_value: contractToEdit.contract_value,
        currency: contractToEdit.currency,
        department: contractToEdit.department,
        agreement_date: contractToEdit.agreement_date ? contractToEdit.agreement_date.split('T')[0] : '',
        start_date: contractToEdit.start_date ? contractToEdit.start_date.split('T')[0] : '',
        completion_date: contractToEdit.completion_date ? contractToEdit.completion_date.split('T')[0] : '',
        renewal_notice_date: contractToEdit.renewal_notice_date ? contractToEdit.renewal_notice_date.split('T')[0] : '',
      });
    } else {
      const today = new Date().toISOString().split('T')[0];
      const oneYearLater = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const thirtyDaysBefore = new Date(Date.now() + 335 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setFormData({
        title: '',
        template_name: 'Master Services Agreement',
        record_type: 'contract',
        status: 'draft',
        counterparty_name: '',
        contract_value: 50000,
        currency: 'USD',
        department: 'Sales',
        agreement_date: today,
        start_date: today,
        completion_date: oneYearLater,
        renewal_notice_date: thirtyDaysBefore,
      });
    }
    setError(null);
  }, [contractToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.counterparty_name) {
      setError('Please provide contract title and counterparty name.');
      return;
    }
    try {
      setIsSubmitting(true);
      setError(null);
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to save contract record');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
            {contractToEdit ? 'Edit Contract Record' : 'Create New Contract'}
          </h2>
          <button onClick={onClose} className="btn btn-outline" style={{ padding: '0.35rem' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '0.65rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Contract Title *
            </label>
            <input
              type="text"
              className="input"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Strategic SaaS Subscription Order"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Counterparty Name *
              </label>
              <input
                type="text"
                className="input"
                value={formData.counterparty_name || ''}
                onChange={(e) => setFormData({ ...formData, counterparty_name: e.target.value })}
                placeholder="e.g. Acme Corporation"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Template / Workflow
              </label>
              <select
                className="select"
                value={formData.template_name || 'Master Services Agreement'}
                onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
              >
                <option value="Master Services Agreement">Master Services Agreement</option>
                <option value="Mutual NDA">Mutual NDA</option>
                <option value="Data Processing Addendum">Data Processing Addendum</option>
                <option value="Statement of Work">Statement of Work</option>
                <option value="Software License Agreement">Software License Agreement</option>
                <option value="Order Form">Order Form</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Ironclad Record Type (API Schema)
              </label>
              <select
                className="select"
                value={formData.record_type || 'contract'}
                onChange={(e) => setFormData({ ...formData, record_type: e.target.value })}
              >
                <option value="contract">Standard Contract</option>
                <option value="statement-of-work">Statement of Work</option>
                <option value="nda">Non-Disclosure Agreement</option>
                <option value="vendor-agreement">Vendor Agreement</option>
                <option value="order-form">Order Form</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Department
              </label>
              <select
                className="select"
                value={formData.department || 'Sales'}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              >
                <option value="Sales">Sales</option>
                <option value="Engineering">Engineering</option>
                <option value="Security">Security</option>
                <option value="Legal">Legal</option>
                <option value="IT Operations">IT Operations</option>
                <option value="DevOps">DevOps</option>
                <option value="Procurement">Procurement</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Contract Value (USD)
              </label>
              <input
                type="number"
                className="input"
                value={formData.contract_value ?? 0}
                onChange={(e) => setFormData({ ...formData, contract_value: parseFloat(e.target.value) || 0 })}
                min="0"
                step="500"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Workflow Status
              </label>
              <select
                className="select"
                value={formData.status || 'draft'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              >
                <option value="draft">Draft</option>
                <option value="in_review">In Review</option>
                <option value="out_for_signature">Out for Signature</option>
                <option value="signed">Signed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Lifecycle & Tracking Dates (Data Lake Schema)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Agreement Date (Record Creation)
                </label>
                <input
                  type="date"
                  className="input"
                  value={formData.agreement_date || ''}
                  onChange={(e) => setFormData({ ...formData, agreement_date: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Contract Start Date (Term Start)
                </label>
                <input
                  type="date"
                  className="input"
                  value={formData.start_date || ''}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Target Completion Date (Expiration)
                </label>
                <input
                  type="date"
                  className="input"
                  value={formData.completion_date || ''}
                  onChange={(e) => setFormData({ ...formData, completion_date: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Renewal Notice Deadline
                </label>
                <input
                  type="date"
                  className="input"
                  value={formData.renewal_notice_date || ''}
                  onChange={(e) => setFormData({ ...formData, renewal_notice_date: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              <Save size={16} />
              {isSubmitting ? 'Saving...' : contractToEdit ? 'Save Changes' : 'Create Contract'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
