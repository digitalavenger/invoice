// Path: digitalavenger/invoice/invoice-b213b5ef4ea8be1df52b3413df2adca6ea3cb411/src/types/index.ts

import { Timestamp } from 'firebase/firestore';

// Role and Permission Types
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  EMPLOYEE = 'employee',
  CLIENT = 'client'
}

export enum Permission {
  // Lead permissions
  VIEW_LEADS = 'view_leads',
  CREATE_LEADS = 'create_leads',
  EDIT_LEADS = 'edit_leads',
  DELETE_LEADS = 'delete_leads',
  MANAGE_LEAD_SETTINGS = 'manage_lead_settings',
  
  // Invoice permissions
  VIEW_INVOICES = 'view_invoices',
  CREATE_INVOICES = 'create_invoices',
  EDIT_INVOICES = 'edit_invoices',
  DELETE_INVOICES = 'delete_invoices',
  VIEW_CUSTOMERS = 'view_customers',
  MANAGE_CUSTOMERS = 'manage_customers',
  VIEW_DASHBOARD = 'view_dashboard',
  MANAGE_INVOICE_SETTINGS = 'manage_invoice_settings',
  
  // Admin permissions
  MANAGE_USERS = 'manage_users',
  MANAGE_TENANTS = 'manage_tenants',
  VIEW_ALL_DATA = 'view_all_data'
}

export interface Tenant {
  id?: string;
  name: string;
  domain?: string;
  logo?: string;
  isActive: boolean;
  createdBy: string; // Super admin or admin who created this tenant
  createdAt: Timestamp;
  updatedAt: Timestamp;
  settings?: {
    allowedModules: ('leads' | 'invoices')[];
    maxUsers?: number;
  };
}

export interface UserProfile {
  id?: string;
  uid: string; // Firebase Auth UID
  email: string;
  name: string;
  role: UserRole;
  tenantId?: string; // null for super_admin, required for others
  permissions: Permission[];
  isActive: boolean;
  createdBy?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLogin?: Timestamp;
}

export interface CompanySettings {
  id?: string;
  tenantId?: string; // Add tenant association
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
  logoBase64?: string;
  invoicePrefix?: string;
}

export interface Customer {
  id?: string;
  userId: string;
  tenantId?: string; // Add tenant association
  name: string;
  email: string;
  phone: string;
  address: string;
  gst?: string;
  createdAt: Timestamp;
}

export interface InvoiceItem {
  id: string;
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
  tenantId?: string; // Add tenant association
  invoiceNumber: string;
  customerId: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    gst?: string;
  };
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  totalGst: number;
  total: number;
  status: 'draft' | 'sent' | 'paid';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceOption {
  id: string;
  tenantId?: string; // Add tenant association
  name: string;
  createdAt?: Timestamp;
}

export interface StatusOption {
  id: string;
  tenantId?: string; // Add tenant association
  name: string;
  color: string;
  order: number;
  isDefault?: boolean;
  createdAt?: Timestamp;
}

export enum LeadStatus {
  CREATED = 'Created',
  FOLLOWUP = 'Followup',
  CLIENT = 'Client',
  REJECTED = 'Rejected',
}

export interface Lead {
  id?: string;
  userId: string;
  tenantId?: string; // Add tenant association
  leadDate: string;
  name: string;
  mobileNumber: string;
  emailAddress: string;
  services: string[];
  leadStatus: string;
  notes?: string;
  lastFollowUpDate?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Role-based permission mappings
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: [
    Permission.VIEW_LEADS,
    Permission.CREATE_LEADS,
    Permission.EDIT_LEADS,
    Permission.DELETE_LEADS,
    Permission.MANAGE_LEAD_SETTINGS,
    Permission.VIEW_INVOICES,
    Permission.CREATE_INVOICES,
    Permission.EDIT_INVOICES,
    Permission.DELETE_INVOICES,
    Permission.VIEW_CUSTOMERS,
    Permission.MANAGE_CUSTOMERS,
    Permission.VIEW_DASHBOARD,
    Permission.MANAGE_INVOICE_SETTINGS,
    Permission.MANAGE_USERS,
    Permission.MANAGE_TENANTS,
    Permission.VIEW_ALL_DATA
  ],
  [UserRole.ADMIN]: [
    Permission.VIEW_LEADS,
    Permission.CREATE_LEADS,
    Permission.EDIT_LEADS,
    Permission.DELETE_LEADS,
    Permission.MANAGE_LEAD_SETTINGS,
    Permission.VIEW_INVOICES,
    Permission.CREATE_INVOICES,
    Permission.EDIT_INVOICES,
    Permission.DELETE_INVOICES,
    Permission.VIEW_CUSTOMERS,
    Permission.MANAGE_CUSTOMERS,
    Permission.VIEW_DASHBOARD,
    Permission.MANAGE_INVOICE_SETTINGS,
    Permission.MANAGE_USERS
  ],
  [UserRole.EMPLOYEE]: [
    Permission.VIEW_LEADS,
    Permission.CREATE_LEADS,
    Permission.EDIT_LEADS,
    Permission.VIEW_INVOICES,
    Permission.CREATE_INVOICES,
    Permission.EDIT_INVOICES,
    Permission.VIEW_CUSTOMERS,
    Permission.MANAGE_CUSTOMERS,
    Permission.VIEW_DASHBOARD
  ],
  [UserRole.CLIENT]: [
    Permission.VIEW_LEADS,
    Permission.VIEW_DASHBOARD
  ]
};