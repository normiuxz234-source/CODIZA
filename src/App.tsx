import React, { useState, useEffect } from 'react';
import {
  auth,
  db,
  googleProvider,
  defaultSettings,
  sampleDocuments,
  sampleClients,
  handleFirestoreError,
  OperationType,
} from './lib/firebase';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import {
  DocumentRecord,
  CompanySettings,
  ClientRecord,
  DocumentItem,
  DocumentStatus,
  UserProfile,
  UserStatus,
  SUPER_ADMIN_EMAIL,
} from './types';
import { Sidebar, AppSection } from './components/Sidebar';
import { TopNavbar } from './components/TopNavbar';
import { DocumentEditor } from './components/DocumentEditor';
import { DocumentHistory } from './components/DocumentHistory';
import { ClientsView } from './components/ClientsView';
import { SettingsView } from './components/SettingsView';
import { UsersView } from './components/UsersView';
import { LoginScreen } from './components/LoginScreen';
import { UnauthorizedAccessScreen } from './components/UnauthorizedAccessScreen';
import { SmartScannerModal } from './components/SmartScannerModal';
import { CompanySettingsModal } from './components/CompanySettingsModal';
import { ClientCatalogModal } from './components/ClientCatalogModal';
import { DocumentViewerModal } from './components/DocumentViewerModal';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [currentSection, setCurrentSection] = useState<AppSection>('editor');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Users Directory List
  const [usersList, setUsersList] = useState<UserProfile[]>([]);

  // Core Data
  const [companySettings, setCompanySettings] = useState<CompanySettings>(() => {
    const saved = localStorage.getItem('facturaya_settings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  const [documents, setDocuments] = useState<DocumentRecord[]>(() => {
    const saved = localStorage.getItem('facturaya_documents');
    return saved ? JSON.parse(saved) : sampleDocuments;
  });

  const [clients, setClients] = useState<ClientRecord[]>(() => {
    const saved = localStorage.getItem('facturaya_clients');
    return saved ? JSON.parse(saved) : sampleClients;
  });

  // Active / Selected Document
  const [activeDocument, setActiveDocument] = useState<DocumentRecord | null>(null);
  const [previewDocument, setPreviewDocument] = useState<DocumentRecord | null>(null);

  // Modals
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isClientsModalOpen, setIsClientsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Manual status refresh handler for UnauthorizedAccessScreen
  const handleRefreshAuthStatus = async () => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const profile = userSnap.data() as UserProfile;
        setCurrentUserProfile(profile);
        const isSuper = user.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
        setIsAuthorized(isSuper || profile.status === 'activo');
      }
    } catch (err) {
      console.error('Error refreshing auth status:', err);
    }
  };

  // 1. Listen to Firebase Auth state and verify Authorization with Super Admin rule
  useEffect(() => {
    let unsubscribeMyProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (unsubscribeMyProfile) {
        unsubscribeMyProfile();
        unsubscribeMyProfile = null;
      }

      setUser(currentUser);

      if (!currentUser) {
        setCurrentUserProfile(null);
        setIsAuthorized(false);
        setIsCloudSyncing(false);
        setIsAuthLoading(false);
        return;
      }

      setIsCloudSyncing(true);
      const userEmail = (currentUser.email || '').toLowerCase().trim();
      const isSuperAdmin = userEmail === SUPER_ADMIN_EMAIL.toLowerCase();

      let activeProfile: UserProfile | null = null;
      let authorized = false;

      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);

        const emailDocId = `user-${userEmail.replace(/[^a-z0-9]/g, '_')}`;
        const emailDocRef = doc(db, 'users', emailDocId);
        let emailDocSnap = null;
        if (!userSnap.exists()) {
          try {
            emailDocSnap = await getDoc(emailDocRef);
          } catch (_) {}
        }

        if (isSuperAdmin) {
          // SUPER ADMIN: Always authorized with permanent administrative authority
          authorized = true;
          activeProfile = {
            id: currentUser.uid,
            userId: currentUser.uid,
            email: SUPER_ADMIN_EMAIL,
            displayName: currentUser.displayName || userSnap.data()?.displayName || 'Super Administrador',
            photoURL: currentUser.photoURL || userSnap.data()?.photoURL || '',
            role: 'admin',
            status: 'activo',
            canViewProfit: true,
            canEditSettings: true,
            canDeleteDocs: true,
            createdAt: userSnap.data()?.createdAt || new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await setDoc(userRef, activeProfile, { merge: true });
        } else if (userSnap.exists()) {
          // Existing user profile in Firestore
          const existing = userSnap.data() as UserProfile;
          if (existing.status === 'activo') {
            authorized = true;
            activeProfile = {
              ...existing,
              lastLoginAt: new Date().toISOString(),
              photoURL: currentUser.photoURL || existing.photoURL || '',
              displayName: currentUser.displayName || existing.displayName,
            };
            await setDoc(
              userRef,
              {
                lastLoginAt: new Date().toISOString(),
                photoURL: activeProfile.photoURL,
                displayName: activeProfile.displayName,
              },
              { merge: true }
            );
          } else {
            authorized = false;
            activeProfile = existing;
          }
        } else if (emailDocSnap && emailDocSnap.exists()) {
          // User was pre-authorized by email before logging in!
          const preAuth = emailDocSnap.data() as UserProfile;
          if (preAuth.status === 'activo') {
            authorized = true;
            activeProfile = {
              ...preAuth,
              id: currentUser.uid,
              userId: currentUser.uid,
              photoURL: currentUser.photoURL || preAuth.photoURL || '',
              displayName: currentUser.displayName || preAuth.displayName,
              lastLoginAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await setDoc(userRef, activeProfile);
            try {
              await deleteDoc(emailDocRef);
            } catch (_) {}
          } else {
            authorized = false;
            activeProfile = preAuth;
          }
        } else {
          // New visitor without pre-authorization: Register as 'pendiente' (unauthorized)
          authorized = false;
          activeProfile = {
            id: currentUser.uid,
            userId: currentUser.uid,
            email: userEmail,
            displayName: currentUser.displayName || userEmail.split('@')[0] || 'Nuevo Colaborador',
            photoURL: currentUser.photoURL || '',
            role: 'facturador',
            status: 'pendiente',
            canViewProfit: false,
            canEditSettings: false,
            canDeleteDocs: false,
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await setDoc(userRef, activeProfile);
        }

        setCurrentUserProfile(activeProfile);
        setIsAuthorized(authorized);

        // Real-time listener on userRef so when super admin authorizes or deactivates them, UI updates immediately
        unsubscribeMyProfile = onSnapshot(userRef, (snapshot) => {
          if (snapshot.exists()) {
            const live = snapshot.data() as UserProfile;
            setCurrentUserProfile(live);
            const liveAuth = isSuperAdmin || live.status === 'activo';
            setIsAuthorized(liveAuth);
          }
        });
      } catch (err) {
        console.error('Error during user verification:', err);
      } finally {
        setIsAuthLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeMyProfile) unsubscribeMyProfile();
    };
  }, []);

  // 2. Data Synchronization for Authorized Users
  useEffect(() => {
    if (!user || !isAuthorized) {
      setIsCloudSyncing(false);
      return;
    }

    setIsCloudSyncing(true);
    let unsubscribeDocs: (() => void) | null = null;
    let unsubscribeClients: (() => void) | null = null;
    let unsubscribeUsers: (() => void) | null = null;

    // Load and listen to authorized users directory
    const usersPath = 'users';
    try {
      unsubscribeUsers = onSnapshot(
        collection(db, usersPath),
        (snapshot) => {
          const loadedUsers: UserProfile[] = [];
          snapshot.forEach((d) => loadedUsers.push(d.data() as UserProfile));
          if (loadedUsers.length > 0) {
            setUsersList(loadedUsers);
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, usersPath);
        }
      );
    } catch (err) {
      console.error('Error attaching users listener:', err);
    }

    // Load company settings
    const settingsDocPath = `settings/company_${user.uid}`;
    getDoc(doc(db, 'settings', `company_${user.uid}`))
      .then(async (settingsSnap) => {
        if (settingsSnap.exists()) {
          setCompanySettings(settingsSnap.data() as CompanySettings);
        } else {
          const initialSet: CompanySettings = {
            ...companySettings,
            userId: user.uid,
          };
          await setDoc(doc(db, 'settings', `company_${user.uid}`), initialSet);
          setCompanySettings(initialSet);
        }
      })
      .catch((error) => {
        handleFirestoreError(error, OperationType.GET, settingsDocPath);
      });

    // Real-time listener for user documents
    const docsPath = 'documents';
    try {
      const q = query(collection(db, docsPath), where('userId', '==', user.uid));
      unsubscribeDocs = onSnapshot(
        q,
        (snapshot) => {
          const loadedDocs: DocumentRecord[] = [];
          snapshot.forEach((d) => loadedDocs.push(d.data() as DocumentRecord));
          if (loadedDocs.length > 0) {
            loadedDocs.sort(
              (a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()
            );
            setDocuments(loadedDocs);
            localStorage.setItem('facturaya_documents', JSON.stringify(loadedDocs));
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, docsPath);
        }
      );
    } catch (err) {
      console.error('Error loading documents:', err);
    }

    // Real-time listener for user clients
    const clientsPath = 'clients';
    try {
      const qClients = query(collection(db, clientsPath), where('userId', '==', user.uid));
      unsubscribeClients = onSnapshot(
        qClients,
        (snapshot) => {
          const loadedClients: ClientRecord[] = [];
          snapshot.forEach((c) => loadedClients.push(c.data() as ClientRecord));
          if (loadedClients.length > 0) {
            setClients(loadedClients);
            localStorage.setItem('facturaya_clients', JSON.stringify(loadedClients));
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, clientsPath);
        }
      );
    } catch (err) {
      console.error('Error loading clients:', err);
    } finally {
      setIsCloudSyncing(false);
    }

    return () => {
      if (unsubscribeDocs) unsubscribeDocs();
      if (unsubscribeClients) unsubscribeClients();
      if (unsubscribeUsers) unsubscribeUsers();
    };
  }, [user, isAuthorized]);

  // Save to LocalStorage whenever state updates for instant offline responsiveness
  useEffect(() => {
    localStorage.setItem('facturaya_settings', JSON.stringify(companySettings));
  }, [companySettings]);

  useEffect(() => {
    localStorage.setItem('facturaya_documents', JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem('facturaya_clients', JSON.stringify(clients));
  }, [clients]);

  // Handle Google Auth
  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e: any) {
      console.error('Sign in error:', e);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (e: any) {
      console.error('Sign out error:', e);
    }
  };

  // Save Company Settings to Firestore and local
  const handleSaveSettings = async (updated: CompanySettings) => {
    const fullSettings = {
      ...updated,
      userId: user ? user.uid : 'local-user',
    };
    setCompanySettings(fullSettings);

    if (user) {
      const path = `settings/company_${user.uid}`;
      try {
        await setDoc(doc(db, 'settings', `company_${user.uid}`), fullSettings);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    }
  };

  // Save Document to Firestore and local
  const handleSaveDocument = async (docRecord: DocumentRecord) => {
    const finalDoc: DocumentRecord = {
      ...docRecord,
      userId: user ? user.uid : 'local-user',
      updatedAt: new Date().toISOString(),
    };

    // Update consecutive counters in company settings if this is a newly emitted document
    const isNew = !documents.some((d) => d.id === finalDoc.id);
    if (isNew) {
      let updatedSettings = { ...companySettings };
      if (finalDoc.docType === 'factura') {
        updatedSettings.invoiceNextNumber = (updatedSettings.invoiceNextNumber || 100) + 1;
      } else if (finalDoc.docType === 'remision') {
        updatedSettings.remisionNextNumber = (updatedSettings.remisionNextNumber || 300) + 1;
      } else {
        updatedSettings.saleNoteNextNumber = (updatedSettings.saleNoteNextNumber || 500) + 1;
      }
      handleSaveSettings(updatedSettings);
    }

    // Update state
    setDocuments((prev) => {
      const exists = prev.some((d) => d.id === finalDoc.id);
      if (exists) {
        return prev.map((d) => (d.id === finalDoc.id ? finalDoc : d));
      }
      return [finalDoc, ...prev];
    });

    setActiveDocument(finalDoc);

    // Save client to catalog automatically if new
    if (
      finalDoc.clientName &&
      !clients.some((c) => c.name.toLowerCase() === finalDoc.clientName.toLowerCase())
    ) {
      const newClient: ClientRecord = {
        id: `client-${Date.now()}`,
        userId: user ? user.uid : 'local-user',
        name: finalDoc.clientName,
        taxId: finalDoc.clientTaxId,
        phone: finalDoc.clientPhone,
        email: finalDoc.clientEmail,
        address: finalDoc.clientAddress,
        updatedAt: new Date().toISOString(),
      };
      handleSaveClient(newClient);
    }

    // Save to Firestore if authenticated
    if (user) {
      const path = `documents/${finalDoc.id}`;
      try {
        await setDoc(doc(db, 'documents', finalDoc.id), finalDoc);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    }
  };

  // Update Status
  const handleUpdateStatus = async (id: string, newStatus: DocumentStatus) => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, status: newStatus, updatedAt: new Date().toISOString() } : d
      )
    );

    if (previewDocument && previewDocument.id === id) {
      setPreviewDocument((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    if (user) {
      const path = `documents/${id}`;
      try {
        const docRef = doc(db, 'documents', id);
        await setDoc(
          docRef,
          { status: newStatus, updatedAt: new Date().toISOString() },
          { merge: true }
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    }
  };

  // Delete Document
  const handleDeleteDocument = async (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    if (activeDocument?.id === id) {
      setActiveDocument(null);
    }

    if (user) {
      const path = `documents/${id}`;
      try {
        await deleteDoc(doc(db, 'documents', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    }
  };

  // Duplicate Document
  const handleDuplicateDocument = (sourceDoc: DocumentRecord) => {
    let nextFolio = '';
    if (sourceDoc.docType === 'factura') {
      nextFolio = `${companySettings.invoicePrefix || 'FACT-'}${companySettings.invoiceNextNumber || 101}`;
    } else if (sourceDoc.docType === 'remision') {
      nextFolio = `${companySettings.remisionPrefix || 'REM-'}${companySettings.remisionNextNumber || 301}`;
    } else {
      nextFolio = `${companySettings.saleNotePrefix || 'NOT-'}${companySettings.saleNoteNextNumber || 501}`;
    }

    const duplicated: DocumentRecord = {
      ...sourceDoc,
      id: `doc-${Date.now()}`,
      folio: nextFolio,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      status: 'borrador',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setActiveDocument(duplicated);
    setCurrentSection('editor');
  };

  // Save Client
  const handleSaveClient = async (client: ClientRecord) => {
    const fullClient = {
      ...client,
      userId: user ? user.uid : 'local-user',
    };

    setClients((prev) => {
      const exists = prev.some((c) => c.id === fullClient.id);
      if (exists) {
        return prev.map((c) => (c.id === fullClient.id ? fullClient : c));
      }
      return [fullClient, ...prev];
    });

    if (user) {
      const path = `clients/${fullClient.id}`;
      try {
        await setDoc(doc(db, 'clients', fullClient.id), fullClient);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    }
  };

  // Delete Client
  const handleDeleteClient = async (id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
    if (user) {
      const path = `clients/${id}`;
      try {
        await deleteDoc(doc(db, 'clients', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    }
  };

  // Direct selection of client to create invoice
  const handleSelectClientForDoc = (client: ClientRecord) => {
    setActiveDocument((prev) => {
      const baseDoc: DocumentRecord = prev || {
        id: `doc-${Date.now()}`,
        userId: user ? user.uid : 'local-user',
        docType: 'factura',
        folio: `${companySettings.invoicePrefix || 'FACT-'}${companySettings.invoiceNextNumber || 101}`,
        issueDate: new Date().toISOString().split('T')[0],
        status: 'borrador',
        currency: 'MXN',
        clientName: client.name,
        clientTaxId: client.taxId,
        clientPhone: client.phone || '',
        clientEmail: client.email || '',
        clientAddress: client.address || '',
        items: [],
        subtotal: 0,
        totalCost: 0,
        totalProfit: 0,
        discountTotal: 0,
        taxRate: 0.16,
        taxAmount: 0,
        retentionAmount: 0,
        total: 0,
        totalInWords: '',
        notes: companySettings.defaultNotes || '',
        terms: companySettings.defaultTerms || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return {
        ...baseDoc,
        clientName: client.name,
        clientTaxId: client.taxId,
        clientPhone: client.phone || '',
        clientEmail: client.email || '',
        clientAddress: client.address || '',
      };
    });

    setCurrentSection('editor');
  };

  // Load scanned items into Document Editor
  const handleLoadItemsFromScanner = (
    scannedItems: DocumentItem[],
    metadata?: { clientName?: string; notes?: string; folioSource?: string }
  ) => {
    setActiveDocument((prev) => {
      const baseDoc: DocumentRecord = prev || {
        id: `doc-${Date.now()}`,
        userId: user ? user.uid : 'local-user',
        docType: 'factura',
        folio: `${companySettings.invoicePrefix || 'FACT-'}${companySettings.invoiceNextNumber || 101}`,
        issueDate: new Date().toISOString().split('T')[0],
        status: 'borrador',
        currency: 'MXN',
        clientName: metadata?.clientName || 'PÚBLICO EN GENERAL',
        clientTaxId: 'XAXX010101000',
        clientPhone: '',
        clientEmail: '',
        clientAddress: '',
        items: [],
        subtotal: 0,
        totalCost: 0,
        totalProfit: 0,
        discountTotal: 0,
        taxRate: 0.16,
        taxAmount: 0,
        retentionAmount: 0,
        total: 0,
        totalInWords: '',
        notes: metadata?.notes || '',
        terms: companySettings.defaultTerms || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const combinedItems = [
        ...(baseDoc.items || []).filter((it) => it.name.trim() !== ''),
        ...scannedItems,
      ];
      return {
        ...baseDoc,
        items: combinedItems,
        notes: baseDoc.notes ? `${baseDoc.notes} | ${metadata?.notes || ''}` : metadata?.notes || '',
      };
    });

    setCurrentSection('editor');
  };

  const handlePreview = (docToPreview: DocumentRecord) => {
    setPreviewDocument(docToPreview);
    setIsPreviewOpen(true);
  };

  const handleResetToNew = () => {
    setActiveDocument(null);
    setCurrentSection('editor');
  };

  // User Management Handlers
  const handleSaveUser = async (profile: UserProfile) => {
    setUsersList((prev) => {
      const exists = prev.some((u) => u.id === profile.id);
      if (exists) {
        return prev.map((u) => (u.id === profile.id ? profile : u));
      }
      return [profile, ...prev];
    });

    if (user) {
      const path = `users/${profile.id}`;
      try {
        await setDoc(doc(db, 'users', profile.id), profile);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setUsersList((prev) => prev.filter((u) => u.id !== userId));
    if (user) {
      const path = `users/${userId}`;
      try {
        await deleteDoc(doc(db, 'users', userId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    }
  };

  // Auth Loading State
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4">
        <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-300 tracking-wide">
          Verificando credenciales de acceso con Google...
        </p>
      </div>
    );
  }

  // Not signed in: Enforce authentication barrier so not anyone can access
  if (!user) {
    return <LoginScreen onSignIn={handleSignIn} isLoading={isAuthLoading} />;
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex font-sans antialiased">
      {/* Sleek Navigation Sidebar */}
      <Sidebar
        currentSection={currentSection}
        onSelectSection={setCurrentSection}
        onNewDocument={handleResetToNew}
        onOpenScanner={() => setIsScannerOpen(true)}
        documentCount={documents.length}
        clientCount={clients.length}
        companySettings={companySettings}
        user={user}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        isCloudSyncing={isCloudSyncing}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 md:pl-72 flex flex-col min-w-0 min-h-screen">
        {/* Top Sticky Header */}
        <TopNavbar
          currentSection={currentSection}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          onNewDocument={handleResetToNew}
          onOpenScanner={() => setIsScannerOpen(true)}
          documentCount={documents.length}
          clientCount={clients.length}
        />

        {/* Dynamic Section Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {currentSection === 'editor' && (
            <DocumentEditor
              companySettings={companySettings}
              clients={clients}
              activeDocument={activeDocument}
              onSaveDocument={handleSaveDocument}
              onOpenScanner={() => setIsScannerOpen(true)}
              onOpenClients={() => setIsClientsModalOpen(true)}
              onPreviewDocument={handlePreview}
              onResetToNew={handleResetToNew}
            />
          )}

          {currentSection === 'history' && (
            <DocumentHistory
              documents={documents}
              companySettings={companySettings}
              onViewDocument={handlePreview}
              onEditDocument={(docToEdit) => {
                setActiveDocument(docToEdit);
                setCurrentSection('editor');
              }}
              onDuplicateDocument={handleDuplicateDocument}
              onUpdateStatus={handleUpdateStatus}
              onDeleteDocument={handleDeleteDocument}
            />
          )}

          {currentSection === 'clients' && (
            <ClientsView
              clients={clients}
              onSaveClient={handleSaveClient}
              onDeleteClient={handleDeleteClient}
              onSelectClientForDoc={handleSelectClientForDoc}
            />
          )}

          {currentSection === 'settings' && (
            <SettingsView
              settings={companySettings}
              onSave={handleSaveSettings}
            />
          )}

          {currentSection === 'users' && (
            <UsersView
              currentUser={user}
              usersList={usersList}
              onSaveUser={handleSaveUser}
              onDeleteUser={handleDeleteUser}
            />
          )}
        </main>
      </div>

      {/* Modals for Scanner, PDF Viewer, and Quick Selection */}
      <SmartScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onLoadItemsToEditor={handleLoadItemsFromScanner}
      />

      <DocumentViewerModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        document={previewDocument}
        companySettings={companySettings}
        onUpdateStatus={handleUpdateStatus}
        onDuplicate={handleDuplicateDocument}
      />

      {/* Client Quick Picker for Document Editor */}
      <ClientCatalogModal
        isOpen={isClientsModalOpen}
        onClose={() => setIsClientsModalOpen(false)}
        clients={clients}
        onSaveClient={handleSaveClient}
        onDeleteClient={handleDeleteClient}
        onSelectClient={(client) => {
          if (activeDocument) {
            setActiveDocument({
              ...activeDocument,
              clientName: client.name,
              clientTaxId: client.taxId,
              clientPhone: client.phone,
              clientEmail: client.email,
              clientAddress: client.address,
            });
          }
        }}
      />
    </div>
  );
}
