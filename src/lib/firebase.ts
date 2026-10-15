import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { CompanySettings, DocumentRecord, ClientRecord } from '../types';

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Required test connection verification
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or initializing.');
    }
  }
}
testConnection();

// Required Firestore Error Handler
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Default Company Settings fallback
export const defaultSettings: CompanySettings = {
  userId: 'local-user',
  businessName: 'COMERCIALIZADORA DEL VALLE S.A. DE C.V.',
  tradeName: 'DISTRIBUIDORA VALLE',
  taxId: 'CVA180420H51',
  taxRegime: '601 - General de Ley Personas Morales',
  street: 'Av. de los Insurgentes Sur',
  exteriorNumber: '1450',
  interiorNumber: 'Piso 4',
  neighborhood: 'Actipan, Benito Juárez',
  city: 'Ciudad de México',
  state: 'CDMX',
  postalCode: '03230',
  country: 'México',
  phone: '(55) 8432-9011',
  whatsapp: '5584329011',
  email: 'ventas@distribuidoravalle.com',
  website: 'www.distribuidoravalle.com',
  logoUrl: '',
  bankName: 'BBVA Bancomer',
  bankAccountHolder: 'Comercializadora del Valle S.A. de C.V.',
  bankAccountNumber: '0129384756',
  bankClabe: '012180001293847561',
  bankNotes: 'Favor de referenciar su pago con el número de folio emitido.',
  invoicePrefix: 'FACT-',
  invoiceNextNumber: 101,
  remisionPrefix: 'REM-',
  remisionNextNumber: 340,
  saleNotePrefix: 'NOT-',
  saleNoteNextNumber: 520,
  defaultTerms: 'Pago en una sola exhibición. En notas y remisiones a crédito, liquidar dentro del plazo pactado.',
  defaultWarranty: 'Garantía de 30 días naturales contra defectos de fabricación o material dañado.',
  defaultDeliveryNotice: 'Material verificado y entregado en óptimas condiciones en destino.',
  updatedAt: new Date().toISOString(),
};

// Initial sample documents for immediate demonstration and exploration
export const sampleDocuments: DocumentRecord[] = [
  {
    id: 'doc-demo-1',
    userId: 'local-user',
    docType: 'factura',
    folio: 'FACT-100',
    issueDate: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    status: 'pagada',
    currency: 'MXN',
    clientName: 'CONSTRUCTORA METROPOLITANA S.A.',
    clientTaxId: 'CME120803K89',
    clientPhone: '55 1234 5678',
    clientEmail: 'compras@constructorametro.mx',
    clientAddress: 'Periférico Sur 4120, Jardines del Pedregal, CDMX',
    items: [
      {
        id: 'item-1',
        quantity: 15,
        unit: 'pza',
        name: 'Válvula de Esfera 2" Acero Inoxidable',
        description: 'Válvula para alta presión con empaques PTFE grado industrial',
        costPrice: 650,
        markupPercent: 30.77,
        unitPrice: 850,
        subtotal: 12750,
        profit: 3000,
        taxRate: 0.16,
        taxAmount: 2040,
        total: 14790,
      },
      {
        id: 'item-2',
        quantity: 40,
        unit: 'm',
        name: 'Tubería Cédula 40 de 2 pulgadas',
        description: 'Tramo sin costura para conducción de fluidos',
        costPrice: 250,
        markupPercent: 28,
        unitPrice: 320,
        subtotal: 12800,
        profit: 2800,
        taxRate: 0.16,
        taxAmount: 2048,
        total: 14848,
      },
    ],
    subtotal: 25550,
    totalCost: 19750,
    totalProfit: 5800,
    taxRate: 0.16,
    taxAmount: 4088,
    retentionAmount: 0,
    total: 29638,
    totalInWords: 'VEINTINUEVE MIL SEISCIENTOS TREINTA Y OCHO PESOS 00/100 M.N.',
    notes: 'Entrega en bodega central. Factura liquidada mediante transferencia SPEI.',
    terms: 'Pago en una sola exhibición. Precios sujetos a cambios sin previo aviso.',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'doc-demo-2',
    userId: 'local-user',
    docType: 'remision',
    folio: 'REM-339',
    issueDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    status: 'pendiente',
    currency: 'MXN',
    clientName: 'DESARROLLOS URBANOS DEL CENTRO',
    clientTaxId: 'DUC190522A12',
    clientPhone: '55 9876 5432',
    clientEmail: 'residencia@desarrollosurbanos.com',
    clientAddress: 'Av. Revolución 950, San Pedro de los Pinos, CDMX',
    driverName: 'Roberto Mendoza Salas',
    vehiclePlates: 'LF-49-218 (Camión 3.5 Ton)',
    deliveryAddress: 'Obra Torre Platino, Calle Magnolia 45, Col. Nápoles, CDMX',
    items: [
      {
        id: 'item-3',
        quantity: 50,
        unit: 'bulto',
        name: 'Cemento Portland Gris Tipo CPC 30R',
        description: 'Bultos de 50kg listos para colado de losa 3er piso',
        costPrice: 195,
        markupPercent: 25.64,
        unitPrice: 245,
        subtotal: 12250,
        profit: 2500,
        taxRate: 0.16,
        taxAmount: 1960,
        total: 14210,
      },
      {
        id: 'item-4',
        quantity: 2,
        unit: 'viaje',
        name: 'Arena Triturada 4m3',
        description: 'Entrega a pie de camión con descarga incluida',
        costPrice: 1250,
        markupPercent: 28,
        unitPrice: 1600,
        subtotal: 3200,
        profit: 700,
        taxRate: 0.16,
        taxAmount: 512,
        total: 3712,
      },
    ],
    subtotal: 15450,
    totalCost: 12250,
    totalProfit: 3200,
    taxRate: 0.16,
    taxAmount: 2472,
    retentionAmount: 0,
    total: 17922,
    totalInWords: 'DIECISIETE MIL NOVECIENTOS VEINTIDÓS PESOS 00/100 M.N.',
    notes: 'Revisar material antes de firmar de conformidad. Chofer Roberto Mendoza.',
    terms: 'Material entregado a satisfacción del cliente.',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'doc-demo-3',
    userId: 'local-user',
    docType: 'nota_venta',
    folio: 'NOT-519',
    issueDate: new Date().toISOString().split('T')[0],
    status: 'emitida',
    currency: 'MXN',
    clientName: 'TALLER INDUSTRIAL Y AUTOMOTRIZ SANDOVAL',
    clientTaxId: 'SASA801124H90',
    clientPhone: '55 4433 2211',
    clientEmail: 'taller.sandoval@gmail.com',
    clientAddress: 'Calle Morelos 18, Tlalnepantla, Estado de México',
    items: [
      {
        id: 'item-5',
        quantity: 6,
        unit: 'pza',
        name: 'Filtro de Aire Alto Flujo Heavy Duty',
        description: 'Repuesto original para compresor industrial',
        costPrice: 320,
        markupPercent: 31.25,
        unitPrice: 420,
        subtotal: 2520,
        profit: 600,
        taxRate: 0.16,
        taxAmount: 403.2,
        total: 2923.2,
      },
      {
        id: 'item-6',
        quantity: 1,
        unit: 'cubeta',
        name: 'Aceite Sintético ISO 68 para Engranes (19 L)',
        description: 'Lubricante para maquinaria de torno y fresado',
        costPrice: 2200,
        markupPercent: 29.55,
        unitPrice: 2850,
        subtotal: 2850,
        profit: 650,
        taxRate: 0.16,
        taxAmount: 456,
        total: 3306,
      },
    ],
    subtotal: 5370,
    totalCost: 4120,
    totalProfit: 1250,
    taxRate: 0.16,
    taxAmount: 859.2,
    retentionAmount: 0,
    total: 6229.2,
    totalInWords: 'SEIS MIL DOSCIENTOS VEINTINUEVE PESOS 20/100 M.N.',
    notes: 'Mostrador directo. Pago con tarjeta de débito.',
    terms: 'Conserve su nota de venta para cualquier aclaración o garantía.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const sampleClients: ClientRecord[] = [
  {
    id: 'client-1',
    userId: 'local-user',
    name: 'CONSTRUCTORA METROPOLITANA S.A.',
    taxId: 'CME120803K89',
    phone: '55 1234 5678',
    email: 'compras@constructorametro.mx',
    address: 'Periférico Sur 4120, Jardines del Pedregal, CDMX',
    notes: 'Cliente con crédito a 15 días. Factura directa.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'client-2',
    userId: 'local-user',
    name: 'DESARROLLOS URBANOS DEL CENTRO',
    taxId: 'DUC190522A12',
    phone: '55 9876 5432',
    email: 'residencia@desarrollosurbanos.com',
    address: 'Av. Revolución 950, San Pedro de los Pinos, CDMX',
    notes: 'Envío de remisiones con firma de residente de obra.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'client-3',
    userId: 'local-user',
    name: 'TALLER INDUSTRIAL Y AUTOMOTRIZ SANDOVAL',
    taxId: 'SASA801124H90',
    phone: '55 4433 2211',
    email: 'taller.sandoval@gmail.com',
    address: 'Calle Morelos 18, Tlalnepantla, Estado de México',
    notes: 'Pago en mostrador / notas de venta.',
    updatedAt: new Date().toISOString(),
  },
];
