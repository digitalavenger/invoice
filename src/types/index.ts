// Path: digitalavenger/invoice/invoice-8778080b2e82e01b0e0b1db4cbffc77385999a44/src/types/index.ts

export interface CompanySettings {
  id?: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  gst: string;
  pan: string;
  logoUrl?: string;
  logoBase64?: string;
  invoicePrefix?: string;

  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branchName?: string;
}

export interface Customer {
  id?: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  gst?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  gstRate: number;
  gstAmount: number;
}

export interface Invoice {
  id?: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  customerId: string;
  customer: Customer;
  items: InvoiceItem[];
  subtotal: number;
  totalGst: number;
  total: number;
  notes?: string;
  status: 'draft' | 'sent' | 'paid';
  createdAt: string;
  updatedAt: string;
}

// NEW TYPES FOR DYNAMIC LEAD MANAGEMENT
export interface ServiceOption {
  id?: string;
  name: string;
  createdAt?: string;
}

export interface StatusOption {
  id?: string;
  name: string;
  order: number;
  isDefault?: boolean;
  color?: string; // NEW: Color for this status
  createdAt?: string;
}

export interface Lead {
  id?: string;
  leadName: string;
  leadDate: string; // Stored as 'YYYY-MM-DD'
  mobileNumber: string;
  emailAddress: string;
  serviceRequired: string[]; // Changed to string[] for dynamic services
  budget?: number;
  leadStatus: string; // Changed to string for dynamic statuses
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// The LeadStatus enum can be kept for initial defaults if desired, but not strictly typed now
export enum LeadStatus {
  CREATED = 'Created',
  FOLLOWUP = 'Followup',
  CLIENT = 'Client',
  REJECTED = 'Rejected',
}