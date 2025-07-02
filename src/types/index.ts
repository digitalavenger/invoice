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
  logoUrl?: string; // Keep this for display on settings page if needed
  logoBase64?: string; // NEW: To store the Base64 representation of the logo
  invoicePrefix?: string; // Existing: Prefix for invoice numbers

  // Bank details fields
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
  amount: 0;
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