export type DocumentType = 'factura' | 'remision' | 'nota_venta';

export type DocumentStatus = 'borrador' | 'emitida' | 'pagada' | 'pendiente' | 'cancelada';

export interface DocumentItem {
  id: string;
  quantity: number;
  unit: string;
  name: string;
  description: string;
  costPrice: number; // Costo base / precio original
  markupPercent: number; // % de aumento sobre el costo
  unitPrice: number; // Precio unitario de venta final (costPrice * (1 + markupPercent/100))
  subtotal: number; // quantity * unitPrice
  profit: number; // quantity * (unitPrice - costPrice)
  taxRate: number; // e.g. 0.16 for 16%, 0.08 for 8%, 0 for 0%
  taxAmount: number;
  total: number;
}

export interface DocumentRecord {
  id: string;
  userId: string;
  docType: DocumentType;
  folio: string;
  issueDate: string; // YYYY-MM-DD
  dueDate?: string;
  status: DocumentStatus;
  currency: string; // MXN, USD, etc.
  
  // Client info
  clientName: string;
  clientTaxId: string;
  clientPhone: string;
  clientEmail: string;
  clientAddress: string;

  // Remisión / Delivery specific fields
  driverName?: string;
  vehiclePlates?: string;
  deliveryAddress?: string;

  // Items and totals
  items: DocumentItem[];
  subtotal: number;
  totalCost: number; // Costo total para reporte interno
  totalProfit: number; // Ganancia total para reporte interno
  discountTotal?: number; // Compatibilidad retroactiva
  taxRate: number;
  taxAmount: number;
  retentionRate?: number;
  retentionAmount: number;
  total: number;
  totalInWords: string;

  // Notes and conditions
  notes: string;
  terms: string;
  sourceScan?: string;
  pdfOptions?: PdfCustomizationOptions;

  createdAt: string;
  updatedAt: string;
}

export interface CompanySettings {
  id?: string;
  userId: string;
  businessName: string;
  tradeName: string;
  taxId: string;
  taxRegime: string;
  street: string;
  exteriorNumber: string;
  interiorNumber: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  logoUrl: string;

  // Banking details
  bankName: string;
  bankAccountHolder: string;
  bankAccountNumber: string;
  bankClabe: string;
  bankNotes: string;

  // Series and folio prefixes
  invoicePrefix: string;
  invoiceNextNumber: number;
  remisionPrefix: string;
  remisionNextNumber: number;
  saleNotePrefix: string;
  saleNoteNextNumber: number;

  // Default conditions
  defaultTerms: string;
  defaultWarranty: string;
  defaultDeliveryNotice: string;
  defaultNotes?: string;
  defaultPdfOptions?: PdfCustomizationOptions;
  address?: string;
  bankBeneficiary?: string;
  bankAccount?: string;
  updatedAt: string;
}

export interface ClientRecord {
  id: string;
  userId: string;
  name: string;
  taxId: string;
  phone: string;
  email: string;
  address: string;
  notes?: string;
  updatedAt: string;
}

export interface ScannedItem {
  quantity: number;
  unit: string;
  name: string;
  description?: string;
  purchasePrice: number;
  selected?: boolean;
  markupPercent?: number;
  marginPercent?: number; // alias for markupPercent
  discountPercent?: number; // legacy optional
  sellingPrice?: number;
}

export interface ScanResult {
  docType?: string;
  folio?: string;
  date?: string;
  issuerName?: string;
  issuerTaxId?: string;
  receiverName?: string;
  receiverTaxId?: string;
  items: ScannedItem[];
  subtotal?: number;
  taxAmount?: number;
  total?: number;
  notes?: string;
}

export interface PdfCustomizationOptions {
  mode: 'cliente' | 'interno';
  // Empresa / Emisor
  showLogo: boolean;
  showIssuerName?: boolean; // compatibilidad
  showIssuerBusinessName: boolean; // Razón Social
  showIssuerTradeName: boolean; // Nombre Comercial
  showIssuerTaxId: boolean; // RFC Empresa
  showIssuerAddress: boolean; // Dirección Empresa
  showIssuerPhone: boolean; // Teléfono Empresa
  showIssuerEmail: boolean; // Correo Empresa
  showBankDetails: boolean; // Datos Bancarios (Banco, Cuenta, CLABE, Titular)
  // Folio y Documento
  showFolio: boolean; // Folio
  showDates: boolean; // Fechas
  showStatus: boolean; // Estado de Pago
  // Cliente
  showClientName: boolean; // Nombre Cliente
  showClientTaxId: boolean; // RFC Cliente
  showClientAddress: boolean; // Dirección Cliente
  showClientPhone: boolean; // Teléfono Cliente
  showClientEmail: boolean; // Correo Cliente
  // Logística y Partidas
  showDeliveryDetails: boolean; // Chofer / Placas
  showItemDescriptions: boolean; // Descripciones
  showUnitPrices: boolean; // Precios Unitarios
  showTaxes: boolean; // Impuestos
  showRetentions: boolean; // Retenciones
  // Financiero y Notas
  showTotalInWords: boolean; // Total con Letra
  showNotes: boolean; // Observaciones
  showTerms: boolean; // Términos y Garantía
  showSignatures: boolean; // Firmas
}

export type UserRole = 'admin' | 'facturador' | 'auditor';
export type UserStatus = 'activo' | 'inactivo' | 'pendiente';

export const SUPER_ADMIN_EMAIL = 'normiuxz234@gmail.com';

export interface UserProfile {
  id: string; // User ID / document ID
  userId: string; // Firebase Auth UID
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  status: UserStatus;
  canViewProfit: boolean; // Permiso para ver vista interna con ganancias y costos
  canEditSettings: boolean; // Permiso para modificar datos fiscales y configuración
  canDeleteDocs: boolean; // Permiso para cancelar o eliminar comprobantes
  addedBy?: string;
  createdAt: string;
  lastLoginAt?: string;
  updatedAt: string;
}
