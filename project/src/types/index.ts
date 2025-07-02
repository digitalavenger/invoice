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