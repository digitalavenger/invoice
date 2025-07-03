// Path: digitalavenger/invoice/invoice-b213b5ef4ea8be1df52b3413df2adca6ea3cb411/src/types/index.ts

import { Timestamp } from 'firebase/firestore';

export interface CompanySettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  gst?: string;
  pan?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branchName?: string;
  currency?: string;
  logoUrl?: string;
  logoBase64?: string; // Add logoBase64 here
  invoicePrefix?: string; // Add invoicePrefix here
}

export interface Customer {
  id?: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  gst?: string;
  createdAt: Timestamp;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  gstRate: number;
  gstAmount: number;
  amount: number;
}

export interface Invoice {
  id?: string;
  userId: string;
  invoiceNumber: string;
  customer: {
    id: string; // Customer ID from your customers collection
    name: string;
    email: string;
    phone: string;
    address: string;
    gst?: string;
  };
  date: string; // ISO date string, e.g., 'YYYY-MM-DD'
  dueDate: string; // ISO date string
  items: InvoiceItem[];
  subtotal: number;
  totalGst: number;
  total: number;
  status: 'draft' | 'sent' | 'paid';
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ServiceOption {
  id: string;
  name: string;
  createdAt?: Timestamp;
}

export interface StatusOption {
  id: string;
  name: string;
  color: string;
  order: number;
  isDefault?: boolean;
  createdAt?: Timestamp;
}

// NEW: Define and export LeadStatus enum
export enum LeadStatus {
  CREATED = 'Created',
  FOLLOWUP = 'Followup',
  CLIENT = 'Client',
  REJECTED = 'Rejected',
}

export interface Lead {
  id?: string;
  userId: string;
  leadDate: string; // ISO date string, e.g., 'YYYY-MM-DD'
  name: string;
  mobileNumber: string;
  emailAddress: string;
  services: string[]; // Array of service names (e.g., ['SEO', 'PPC'])
  leadStatus: string; // Corresponds to StatusOption.name
  notes?: string; // NEW: Notes for the lead
  lastFollowUpDate?: string; // NEW: Recent followup date
  createdAt: Timestamp;
  updatedAt: Timestamp;
}