
export enum ProjectStatus {
  NEW = 'New',
  APPROVED = 'Approved',
  SCHEDULED = 'Scheduled',
  PAID = 'Paid',
  CANCELLED = 'Cancelled'
}

export enum ProductUnit {
  SQFT = 'sq. ft.',
  LF = 'lin. ft.',
  UNIT = 'unit',
  HOUR = 'hour'
}

export interface ClientAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: ClientAddress;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  category: 'Flooring' | 'Baseboard' | 'Labor' | 'Underlayment' | 'Other';
  unit: ProductUnit;
  unitPrice: number;
  description: string;
}

export interface Room {
  id: string;
  name: string;
  width: number; // in feet
  length: number; // in feet
  wastePercentage: number;
}

export interface LineItem {
  id: string;
  roomId: string;
  productId: string;
  quantity: number;
  unitPriceAtTime: number;
  subtotal: number;
}

export interface Estimate {
  id: string;
  clientId: string;
  status: ProjectStatus;
  rooms: Room[];
  items: LineItem[];
  totalAmount: number;
  createdAt: string;
}

export interface CompanyProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  website: string;
  taxId: string;
  terms: string;
  logoUrl?: string; // Base64 string of the uploaded image
  pdfTheme?: 'light' | 'dark'; // Preference for PDF styling
}
