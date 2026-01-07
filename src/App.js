import React, { useEffect, useMemo, useState } from "react";
import { AuthWrapper, useUser } from "./components/auth/AuthWrapper";
import { Plus, Trash2, Printer, Save, FileText, Package, Calculator, HardHat, Pencil, Check, X, Building2, Settings, ChevronLeft, ChevronRight, Loader2, Menu, Key, Eye, EyeOff, CheckCircle, PenTool } from "lucide-react";
import { ProjectSelect } from "./components/estimator/ProjectSelect";
import { SectionCard } from "./components/estimator/SectionCard";
import { SummaryRow } from "./components/estimator/SummaryRow";
import { EstimatePreviewModal } from "./components/estimator/EstimatePreviewModal";
import { ProductCatalogModal } from "./components/catalog/ProductCatalogModal";
import { MaterialCalculatorModal } from "./components/calculators/MaterialCalculatorModal";
import { CompanySettingsModal } from "./components/settings/CompanySettingsModal";
import { uuid, money, calcTotals, sectionSubtotal } from "./utils/estimator";
import { STORAGE_KEY, defaultItem, emptyProject } from "./constants/estimator";
import { estimatorService } from "./services/estimatorService";
import { authService } from "./services/authService";

// Helper functions to create user-specific localStorage keys
const getCompanySettingsKey = (userId) => `contractor-estimator-company-${userId}`;
const getProjectsStorageKey = (userId) => `${STORAGE_KEY}-${userId}`;
const getSignatureSettingsKey = (userId) => `contractor-estimator-signature-${userId}`;

// Signature font options
const SIGNATURE_FONTS = [
  { value: 'Dancing Script', label: 'Dancing Script' },
  { value: 'Pacifico', label: 'Pacifico' },
  { value: 'Great Vibes', label: 'Great Vibes' },
  { value: 'Satisfy', label: 'Satisfy' },
  { value: 'Caveat', label: 'Caveat' },
  { value: 'Allura', label: 'Allura' },
];

// ----------------------------
// main component
// ----------------------------
export default function App() {
  return (
    <AuthWrapper>
      <AppContent />
    </AuthWrapper>
  );
}

function AppContent() {
  const user = useUser();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [firebaseError, setFirebaseError] = useState(false);
  const [showEstimateModal, setShowEstimateModal] = useState(false);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [editingProjectName, setEditingProjectName] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [companySettings, setCompanySettings] = useState({
    companyLogo: '',
    companyName: '',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
  });
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteSectionModal, setShowDeleteSectionModal] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState(null);
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureSettings, setSignatureSettings] = useState({
    name: '',
    font: 'Dancing Script',
  });

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const active = useMemo(() => projects.find((p) => p.id === activeId) || projects[0], [projects, activeId]);

  // Load company settings from localStorage on mount (user-specific)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(getCompanySettingsKey(user.uid));
      if (saved) {
        setCompanySettings(JSON.parse(saved));
      }
    } catch (error) {
      console.warn('Failed to load company settings:', error);
    }
  }, [user.uid]);

  // Save company settings (user-specific)
  const saveCompanySettings = (settings) => {
    setCompanySettings(settings);
    try {
      localStorage.setItem(getCompanySettingsKey(user.uid), JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save company settings:', error);
    }
  };

  // Load signature settings from localStorage on mount (user-specific)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(getSignatureSettingsKey(user.uid));
      if (saved) {
        setSignatureSettings(JSON.parse(saved));
      }
    } catch (error) {
      console.warn('Failed to load signature settings:', error);
    }
  }, [user.uid]);

  // Save signature settings (user-specific)
  const saveSignatureSettings = (settings) => {
    setSignatureSettings(settings);
    try {
      localStorage.setItem(getSignatureSettingsKey(user.uid), JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save signature settings:', error);
    }
  };

  const loadProjects = async () => {
    try {
      setLoading(true);
      const userId = user.uid;

      // First, try to load from localStorage as a backup (user-specific)
      let localProjects = [];
      try {
        const raw = localStorage.getItem(getProjectsStorageKey(userId));
        if (raw) {
          const parsed = JSON.parse(raw);
          localProjects = Array.isArray(parsed) ? parsed : [parsed];
        }
      } catch (localError) {
        console.warn('LocalStorage parse failed:', localError);
      }

      // Try Firebase first
      try {
        const estimates = await estimatorService.getEstimates(userId);

        if (estimates.length > 0) {
          // Firebase has data - use it
          setProjects(estimates);
          setActiveId(estimates[0].id);
          console.log('Loaded', estimates.length, 'projects from Firebase');
        } else if (localProjects.length > 0) {
          // Firebase is empty but localStorage has data - restore to Firebase
          console.log('Firebase empty, restoring', localProjects.length, 'projects from localStorage');
          setProjects(localProjects);
          setActiveId(localProjects[0].id);

          // Try to save these projects to Firebase
          for (const project of localProjects) {
            try {
              await estimatorService.saveEstimate({
                ...project,
                userId
              });
            } catch (saveError) {
              console.warn('Failed to restore project to Firebase:', saveError);
            }
          }
        } else {
          // Both are empty - create default project
          const defaultProject = emptyProject("Sample Project");
          try {
            const savedId = await estimatorService.saveEstimate({
              ...defaultProject,
              userId
            });
            setProjects([{ ...defaultProject, id: savedId }]);
            setActiveId(savedId);
          } catch (saveError) {
            console.warn('Could not save default project to Firebase, using local copy:', saveError);
            setProjects([defaultProject]);
            setActiveId(defaultProject.id);
          }
        }
      } catch (firebaseError) {
        console.error('Firebase failed, using localStorage:', firebaseError);

        if (localProjects.length > 0) {
          // Use localStorage data
          setProjects(localProjects);
          setActiveId(localProjects[0].id);
          console.log('Using', localProjects.length, 'projects from localStorage');
        } else {
          // Create new project
          setProjects([emptyProject("Sample Project")]);
          setActiveId(projects[0]?.id);
        }
      }
    } catch (error) {
      console.error('Critical error in loadProjects:', error);
      // Last resort - create new project
      setProjects([emptyProject("Sample Project")]);
      setActiveId(projects[0]?.id);
    } finally {
      setLoading(false);
    }
  };

  // Load projects from Firebase on mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Save projects to Firebase whenever they change
  useEffect(() => {
    if (projects.length > 0 && !loading) {
      const saveToFirebase = async () => {
        // Add a small delay to prevent rapid successive calls
        await new Promise(resolve => setTimeout(resolve, 100));

        try {
          const userId = user.uid;
          for (const project of projects) {
            try {
              await estimatorService.saveEstimate({
                ...project,
                userId
              });
            } catch (projectError) {
              console.warn(`Failed to save project ${project.id} to Firebase:`, projectError);
              // Continue with other projects instead of failing completely
            }
          }
        } catch (error) {
          console.error('Error saving to Firebase:', error.message);
          // Fallback to localStorage (user-specific)
          try {
            localStorage.setItem(getProjectsStorageKey(user.uid), JSON.stringify(projects));
          } catch (localError) {
            console.error('Failed to save to localStorage as well:', localError);
          }
        }
      };

      saveToFirebase();
    }
  }, [projects, loading]);

  const updateActive = (patch) => {
    setProjects((prev) => prev.map((p) => (p.id === active.id ? { ...p, ...patch, updatedAt: Date.now() } : p)));
  };

  const totals = useMemo(() => {
    if (!active) return { subtotal: 0, tax: 0, overhead: 0, profit: 0, contingency: 0, total: 0, byCategory: {} };
    return calcTotals(active);
  }, [active]);

  const MAX_PROJECTS = 5;

  const addProject = () => {
    if (projects.length >= MAX_PROJECTS) {
      showToast(`Project limit reached (${MAX_PROJECTS}). Delete a project to create a new one.`);
      return;
    }
    const p = emptyProject(`Project ${projects.length + 1}`);
    setProjects((prev) => [...prev, p]);
    setActiveId(p.id);
  };

  const deleteProject = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteProject = async () => {
    setDeleting(true);
    const projectId = active.id;
    const idx = projects.findIndex((p) => p.id === projectId);
    const next = projects.filter((p) => p.id !== projectId);

    try {
      // Delete from Firebase
      await estimatorService.deleteEstimate(projectId);

      // Update local state
      setProjects(next);
      setActiveId(next[Math.max(0, idx - 1)]?.id);

      // Also update localStorage (user-specific)
      localStorage.setItem(getProjectsStorageKey(user.uid), JSON.stringify(next));

      showToast('Project deleted successfully', 'success');
    } catch (error) {
      console.error('Failed to delete project:', error);
      showToast('Failed to delete project. Please try again.', 'error');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // ----------------------------
  // Section helpers
  // ----------------------------
  const addSection = () => {
    setNewSectionName(`Section ${active.sections.length + 1}`);
    setShowAddSectionModal(true);
  };

  const confirmAddSection = () => {
    const name = newSectionName.trim() || `Section ${active.sections.length + 1}`;
    updateActive({ sections: [...active.sections, { id: uuid(), name, items: [defaultItem()] }] });
    setShowAddSectionModal(false);
    setNewSectionName('');
  };

  const removeSection = (sectionId) => {
    const section = active.sections.find(s => s.id === sectionId);
    setSectionToDelete(section);
    setShowDeleteSectionModal(true);
  };

  const confirmDeleteSection = () => {
    if (!sectionToDelete) return;
    updateActive({ sections: active.sections.filter((s) => s.id !== sectionToDelete.id) });
    setShowDeleteSectionModal(false);
    setSectionToDelete(null);
    showToast('Section deleted', 'success');
  };

  const reorderSection = (draggedId, targetId) => {
    const sections = [...active.sections];
    const draggedIndex = sections.findIndex(s => s.id === draggedId);
    const targetIndex = sections.findIndex(s => s.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const [draggedSection] = sections.splice(draggedIndex, 1);
    sections.splice(targetIndex, 0, draggedSection);

    updateActive({ sections });
  };

  // ----------------------------
  // Item helpers (section-scoped)
  // ----------------------------
  const updateItem = (sectionId, id, patch) => {
    setProjects((prev) => prev.map((p) => {
      if (p.id !== active.id) return p;
      return {
        ...p,
        sections: p.sections.map((s) => s.id === sectionId ? { ...s, items: s.items.map((it) => it.id === id ? { ...it, ...patch } : it) } : s),
        updatedAt: Date.now(),
      };
    }));
  };

  const addItem = (sectionId) => {
    setProjects((prev) => prev.map((p) => (p.id === active.id ? {
      ...p,
      sections: p.sections.map((s) => s.id === sectionId ? { ...s, items: [...s.items, defaultItem()] } : s),
      updatedAt: Date.now(),
    } : p)));
  };

  const removeItem = (sectionId, id) => {
    setProjects((prev) => prev.map((p) => (p.id === active.id ? {
      ...p,
      sections: p.sections.map((s) => s.id === sectionId ? { ...s, items: s.items.filter((it) => it.id !== id) } : s),
      updatedAt: Date.now(),
    } : p)));
  };

  // Add items from calculator to a section
  const addCalculatorItems = (items, sectionId) => {
    setProjects((prev) => prev.map((p) => {
      if (p.id !== active.id) return p;
      return {
        ...p,
        sections: p.sections.map((s) =>
          s.id === sectionId
            ? { ...s, items: [...s.items, ...items] }
            : s
        ),
        updatedAt: Date.now(),
      };
    }));
    setShowCalculatorModal(false);
  };

  // Add product from catalog to a section
  const addProductToSection = (product, qty, sectionId) => {
    const newItem = {
      id: uuid(),
      desc: product.name,
      category: product.category,
      qty: qty,
      unit: product.unit,
      unitCost: product.unitPrice,
      taxable: true,
    };

    setProjects((prev) => prev.map((p) => {
      if (p.id !== active.id) return p;
      return {
        ...p,
        sections: p.sections.map((s) =>
          s.id === sectionId
            ? { ...s, items: [...s.items, newItem] }
            : s
        ),
        updatedAt: Date.now(),
      };
    }));
  };

  const printPage = () => window.print();

  const createEstimate = () => {
    setShowEstimateModal(true);
  };

  const manualSave = async () => {
    setSaving(true);
    try {
      const userId = user.uid;
      for (const project of projects) {
        await estimatorService.saveEstimate({
          ...project,
          userId
        });
      }
      showToast('All projects saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving projects:', error);
      showToast('Error saving projects. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const retryFirebase = () => {
    setFirebaseError(false);
    loadProjects();
  };

  const handleLogin = async (email, password) => {
    try {
      // This part of the code was removed as per the edit hint.
      // The AuthWrapper will handle the actual login.
      // For now, we'll just close the modal.
      setShowLoginModal(false);
    } catch (error) {
      throw new Error(error.message);
    }
  };

  const handleLogout = async () => {
    try {
      // This part of the code was removed as per the edit hint.
      // The AuthWrapper will handle the actual logout.
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Change password handlers
  const openChangePasswordModal = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setPasswordSuccess(false);
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowChangePasswordModal(true);
  };

  const closeChangePasswordModal = () => {
    setShowChangePasswordModal(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setPasswordSuccess(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');

    // Validate passwords
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from current password.');
      return;
    }

    setChangingPassword(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
    } catch (error) {
      setPasswordError(error.message || 'Failed to change password.');
    } finally {
      setChangingPassword(false);
    }
  };

  // Format phone number as (XXX) XXX-XXXX
  const formatPhoneNumber = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    if (digits.length === 0) return '';
    if (digits.length <= 3) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  // Validate email format
  const isValidEmail = (email) => {
    if (!email) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Common styles
  const inputClasses = "w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 placeholder:text-slate-400";
  const labelClasses = "block mb-1.5 text-sm font-medium text-slate-700";
  const buttonPrimary = "inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl hover:from-amber-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all duration-200 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40";
  const buttonSecondary = "inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500/20 transition-all duration-200";
  const buttonDanger = "inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-xl hover:bg-red-50 hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-200";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50">
        <div className="text-center">
          <div className="relative">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 shadow-xl rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/30">
              <HardHat className="w-8 h-8 text-white animate-pulse" />
            </div>
            <div className="absolute border-2 -inset-4 rounded-3xl border-amber-500/20 animate-ping" style={{ animationDuration: '2s' }} />
          </div>
          <p className="font-medium text-slate-600">Loading your estimates...</p>
          <p className="mt-1 text-sm text-slate-400">Please wait a moment</p>
          {firebaseError && (
            <button onClick={retryFirebase} className={`${buttonPrimary} mt-6`}>
              Retry Connection
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50">
      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarCollapsed ? 'w-16' : 'w-64'} flex-shrink-0 bg-white border-r border-slate-200 min-h-screen sticky top-0 transition-all duration-300 print:hidden hidden md:block`}>
          <div className="flex flex-col h-screen">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              {!sidebarCollapsed && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
                    <HardHat className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold text-slate-800">Estimator</span>
                </div>
              )}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>

            {/* Sidebar Navigation */}
            <nav className="flex-1 p-3 space-y-1">
              <button
                onClick={() => setShowCompanyModal(true)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors ${sidebarCollapsed ? 'justify-center' : ''}`}
                title="Company Settings"
              >
                <Building2 className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && <span className="text-sm font-medium">Company Settings</span>}
              </button>
              <button
                onClick={openChangePasswordModal}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors ${sidebarCollapsed ? 'justify-center' : ''}`}
                title="Change Password"
              >
                <Key className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && <span className="text-sm font-medium">Change Password</span>}
              </button>
              <button
                onClick={() => setShowSignatureModal(true)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors ${sidebarCollapsed ? 'justify-center' : ''}`}
                title="Signature"
              >
                <PenTool className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && <span className="text-sm font-medium">Signature</span>}
              </button>
            </nav>

            {/* Sidebar Footer */}
            {!sidebarCollapsed && (
              <div className="p-4 border-t border-slate-100">
                <p className="text-xs text-slate-400 text-center">
                  © {new Date().getFullYear()} Contractor Estimator
                </p>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Sticky Toolbar */}
          <div className="sticky top-0 z-30 w-full bg-white border-b border-slate-200 shadow-sm print:hidden">
            <div className="px-4 py-3 mx-auto max-w-6xl md:px-8">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors md:hidden"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <ProjectSelect
                  value={active.id}
                  onValueChange={(v) => setActiveId(v)}
                  projects={projects}
                />

                <div className="hidden w-px h-8 mx-1 bg-slate-200 sm:block" />

                <button
                  onClick={addProject}
                  disabled={projects.length >= MAX_PROJECTS}
                  className={`${buttonPrimary} disabled:opacity-50 disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-500 disabled:shadow-none`}
                >
                  <Plus className="w-4 h-4"/>New
                </button>
                <span className={`text-xs font-medium tabular-nums ${projects.length >= MAX_PROJECTS ? 'text-red-600' : 'text-slate-500'}`}>{projects.length}/{MAX_PROJECTS}</span>
                <button
                  onClick={deleteProject}
                  disabled={deleting}
                  className={`${buttonDanger} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {deleting ? (
                    <Loader2 className="w-4 h-4 animate-spin"/>
                  ) : (
                    <Trash2 className="w-4 h-4"/>
                  )}
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>

                <div className="hidden w-px h-8 mx-1 bg-slate-200 sm:block" />

                <button
                  onClick={manualSave}
                  disabled={saving}
                  className={`${buttonSecondary} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin"/>
                  ) : (
                    <Save className="w-4 h-4"/>
                  )}
                  {saving ? 'Saving...' : 'Save'}
                </button>

                <div className="hidden w-px h-8 mx-1 bg-slate-200 sm:block" />

                <button onClick={() => setShowCatalogModal(true)} className={buttonSecondary}>
                  <Package className="w-4 h-4"/>Catalog
                </button>
                <button onClick={() => setShowCalculatorModal(true)} className={buttonSecondary}>
                  <Calculator className="w-4 h-4"/>Calculators
                </button>

                <div className="hidden w-px h-8 mx-1 bg-slate-200 sm:block" />

                <button onClick={createEstimate} className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-amber-900 bg-gradient-to-r from-amber-300 to-amber-400 rounded-xl hover:from-amber-400 hover:to-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all duration-200 shadow-lg shadow-amber-400/25">
                  <FileText className="w-4 h-4"/>Preview
                </button>
                <button onClick={printPage} className={buttonSecondary}>
                  <Printer className="w-4 h-4"/>Print
                </button>
              </div>
            </div>
          </div>

          <div className="max-w-6xl px-4 py-6 mx-auto md:px-8 md:py-8">
        {/* Project Name */}
        <div className="flex items-center gap-3 mb-6">
          {editingProjectName ? (
            <>
              <input
                type="text"
                autoFocus
                className="text-2xl font-bold text-slate-800 bg-transparent border-b-2 border-amber-500 focus:outline-none px-1"
                value={active?.name || ""}
                onChange={(e) => updateActive({ name: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setEditingProjectName(false);
                  if (e.key === 'Escape') setEditingProjectName(false);
                }}
              />
              <button
                onClick={() => setEditingProjectName(false)}
                className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                title="Save"
              >
                <Check className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-slate-800">{active?.name || "Untitled Project"}</h2>
              <button
                onClick={() => setEditingProjectName(true)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="Edit project name"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Client & Estimate Info Card */}
        <div className="mb-6 overflow-hidden bg-white border shadow-sm rounded-2xl border-slate-200">
          <div className="p-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Left Column - Client Info */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="clientName" className={labelClasses}>Client Name</label>
                  <input
                    id="clientName"
                    className={inputClasses}
                    value={active?.clientName || ""}
                    onChange={(e)=>updateActive({ clientName:e.target.value })}
                    placeholder="Enter client name"
                  />
                </div>
                <div>
                  <label htmlFor="clientPhone" className={labelClasses}>Client Phone</label>
                  <input
                    id="clientPhone"
                    className={inputClasses}
                    type="tel"
                    placeholder="(555) 555-5555"
                    value={active?.clientPhone || ""}
                    onChange={(e) => updateActive({ clientPhone: formatPhoneNumber(e.target.value) })}
                  />
                </div>
                <div>
                  <label htmlFor="clientEmail" className={labelClasses}>Client Email</label>
                  <input
                    id="clientEmail"
                    className={`${inputClasses} ${active?.clientEmail && !isValidEmail(active.clientEmail) ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                    type="email"
                    placeholder="name@example.com"
                    value={active?.clientEmail || ""}
                    onChange={(e)=>updateActive({ clientEmail:e.target.value })}
                  />
                  {active?.clientEmail && !isValidEmail(active.clientEmail) && (
                    <p className="mt-1 text-xs text-red-500">Please enter a valid email address</p>
                  )}
                </div>
              </div>

              {/* Right Column - Estimate Details */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="estimateNumber" className={labelClasses}>Estimate #</label>
                  <input
                    id="estimateNumber"
                    className={inputClasses}
                    type="text"
                    placeholder="#001"
                    value={active?.estimateNumber || "#001"}
                    onChange={(e) => updateActive({ estimateNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="estimateDate" className={labelClasses}>Estimate Date</label>
                  <input
                    id="estimateDate"
                    className={inputClasses}
                    type="date"
                    value={active?.estimateDate || new Date().toISOString().split('T')[0]}
                    onChange={(e) => updateActive({ estimateDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sections Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Sections</h2>
          <button className={buttonPrimary} onClick={addSection}>
            <Plus className="w-4 h-4"/>Add Section
          </button>
        </div>

        {/* Sections */}
        <div className="mb-6 space-y-4">
          {(active?.sections || []).map((sec, idx) => (
            <SectionCard
              key={sec.id}
              section={sec}
              sectionIndex={idx}
              onRemove={removeSection}
              onAddItem={addItem}
              onRemoveItem={removeItem}
              onUpdateItem={updateItem}
              onUpdateSection={(sectionId, patch) => {
                const updatedSections = active.sections.map(s =>
                  s.id === sectionId ? { ...s, ...patch } : s
                );
                updateActive({ sections: updatedSections });
              }}
              onReorder={reorderSection}
              money={money}
            />
          ))}
        </div>

        {/* Rates & Summary */}
        <div className="grid gap-6 mb-8 md:grid-cols-2 print:grid-cols-2">
          {/* Rates Card */}
          <div className="overflow-hidden bg-white border shadow-sm rounded-2xl border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <h3 className="text-base font-semibold text-slate-800">Rates & Markups</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="taxPct" className={labelClasses}>Sales Tax %</label>
                  <input
                    id="taxPct"
                    className={inputClasses}
                    type="number"
                    inputMode="decimal"
                    value={active.rates.taxPct}
                    onChange={(e)=>updateActive({ rates: { ...active.rates, taxPct: Number(e.target.value) } })}
                  />
                </div>
                <div>
                  <label htmlFor="overheadPct" className={labelClasses}>Overhead %</label>
                  <input
                    id="overheadPct"
                    className={inputClasses}
                    type="number"
                    inputMode="decimal"
                    value={active.rates.overheadPct}
                    onChange={(e)=>updateActive({ rates: { ...active.rates, overheadPct: Number(e.target.value) } })}
                  />
                </div>
                <div>
                  <label htmlFor="profitPct" className={labelClasses}>Profit %</label>
                  <input
                    id="profitPct"
                    className={inputClasses}
                    type="number"
                    inputMode="decimal"
                    value={active.rates.profitPct}
                    onChange={(e)=>updateActive({ rates: { ...active.rates, profitPct: Number(e.target.value) } })}
                  />
                </div>
                <div>
                  <label htmlFor="contingencyPct" className={labelClasses}>Contingency %</label>
                  <input
                    id="contingencyPct"
                    className={inputClasses}
                    type="number"
                    inputMode="decimal"
                    value={active.rates.contingencyPct}
                    onChange={(e)=>updateActive({ rates: { ...active.rates, contingencyPct: Number(e.target.value) } })}
                  />
                </div>
              </div>
              <div className="mt-5">
                <label htmlFor="notes" className={labelClasses}>Notes (prints on estimate)</label>
                <textarea
                  id="notes"
                  className={`${inputClasses} min-h-24 resize-none`}
                  value={active.notes}
                  onChange={(e)=>updateActive({ notes: e.target.value })}
                  placeholder="Add any notes or terms..."
                />
              </div>
            </div>
          </div>

          {/* Summary Card */}
          <div className="overflow-hidden bg-white border shadow-sm rounded-2xl border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <h3 className="text-base font-semibold text-slate-800">Summary</h3>
            </div>
            <div className="p-6 space-y-2">
              <SummaryRow label="Materials" value={money(totals.byCategory.materials || 0)} />
              <SummaryRow label="Labor" value={money(totals.byCategory.labor || 0)} />
              <SummaryRow label="Subcontract" value={money(totals.byCategory.subcontract || 0)} />
              <SummaryRow label="Other" value={money(totals.byCategory.other || 0)} />

              <div className="h-px my-3 bg-slate-200"/>

              <SummaryRow label="SUBTOTAL" value={money(totals.subtotal)} strong />
              <SummaryRow label={`Sales Tax (${active.rates.taxPct||0}%)`} value={money(totals.tax)} />
              <SummaryRow label={`Overhead (${active.rates.overheadPct||0}%)`} value={money(totals.overhead)} />
              <SummaryRow label={`Profit (${active.rates.profitPct||0}%)`} value={money(totals.profit)} />
              <SummaryRow label={`Contingency (${active.rates.contingencyPct||0}%)`} value={money(totals.contingency)} />

              <div className="h-px my-3 bg-slate-200"/>

              <div className="p-4 -mx-2 border rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-amber-800">TOTAL</span>
                  <span className="text-2xl font-bold text-amber-700">{money(totals.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

          {/* Footer */}
          <footer className="py-6 text-center print:hidden">
            <p className="text-xs text-slate-400">
              Auto-saved to your browser.
            </p>
          </footer>
          </div>
        </div>
      </div>

      {/* Estimate Preview Modal */}
      <EstimatePreviewModal
        isOpen={showEstimateModal}
        onClose={() => setShowEstimateModal(false)}
        project={active}
        companySettings={companySettings}
        signatureSettings={signatureSettings}
        totals={totals}
        money={money}
        sectionSubtotal={sectionSubtotal}
      />

      {/* Product Catalog Modal */}
      <ProductCatalogModal
        isOpen={showCatalogModal}
        onClose={() => setShowCatalogModal(false)}
        userId={user.uid}
        sections={active?.sections || []}
        onAddToEstimate={addProductToSection}
      />

      {/* Material Calculator Modal */}
      <MaterialCalculatorModal
        isOpen={showCalculatorModal}
        onClose={() => setShowCalculatorModal(false)}
        sections={active?.sections || []}
        onAddItems={addCalculatorItems}
      />

      {/* Company Settings Modal */}
      <CompanySettingsModal
        isOpen={showCompanyModal}
        onClose={() => setShowCompanyModal(false)}
        companySettings={companySettings}
        onSave={saveCompanySettings}
      />

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <>
          <div
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
            onClick={() => !changingPassword && closeChangePasswordModal()}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4">
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl pointer-events-auto overflow-hidden animate-modal-pop">
              {passwordSuccess ? (
                // Success State
                <div className="p-6 sm:p-8">
                  <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-green-100">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-center text-slate-800 mb-2">
                    Password Changed
                  </h3>
                  <p className="text-sm text-center text-slate-500 mb-6">
                    Your password has been successfully updated. Use your new password the next time you sign in.
                  </p>
                  <button
                    onClick={closeChangePasswordModal}
                    className="w-full px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl hover:from-amber-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all duration-200 shadow-lg shadow-amber-500/25"
                  >
                    Done
                  </button>
                </div>
              ) : (
                // Form State
                <>
                  <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25">
                        <Key className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-slate-800 tracking-tight">Change Password</h2>
                        <p className="text-sm text-slate-500">Update your account password</p>
                      </div>
                    </div>
                    <button
                      onClick={closeChangePasswordModal}
                      disabled={changingPassword}
                      className="absolute p-2 transition-all duration-200 rounded-full top-4 right-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleChangePassword} className="p-6 space-y-4">
                    <div>
                      <label htmlFor="currentPassword" className={labelClasses}>Current Password</label>
                      <div className="relative">
                        <input
                          id="currentPassword"
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          required
                          placeholder="Enter current password"
                          className={`${inputClasses} pr-12`}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 transition-colors"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="newPassword" className={labelClasses}>New Password</label>
                      <div className="relative">
                        <input
                          id="newPassword"
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          minLength={6}
                          placeholder="Enter new password (min 6 characters)"
                          className={`${inputClasses} pr-12`}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 transition-colors"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className={labelClasses}>Confirm New Password</label>
                      <input
                        id="confirmPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                        placeholder="Confirm new password"
                        className={inputClasses}
                      />
                    </div>

                    {passwordError && (
                      <div className="p-3 border border-red-200 rounded-xl bg-red-50">
                        <p className="text-sm text-red-600">{passwordError}</p>
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={closeChangePasswordModal}
                        disabled={changingPassword}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl hover:from-amber-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all duration-200 shadow-lg shadow-amber-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                      >
                        {changingPassword ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Changing...
                          </>
                        ) : (
                          'Change Password'
                        )}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Signature Modal */}
      {showSignatureModal && (
        <>
          <div
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowSignatureModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4">
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl pointer-events-auto overflow-hidden animate-modal-pop">
              {/* Header */}
              <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25">
                    <PenTool className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-800 tracking-tight">Signature</h2>
                    <p className="text-sm text-slate-500">Create your digital signature</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSignatureModal(false)}
                  className="absolute p-2 transition-all duration-200 rounded-full top-4 right-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <div className="p-6 space-y-5">
                {/* Name Input */}
                <div>
                  <label htmlFor="signatureName" className={labelClasses}>Your Name</label>
                  <input
                    id="signatureName"
                    type="text"
                    value={signatureSettings.name}
                    onChange={(e) => setSignatureSettings(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your full name"
                    className={inputClasses}
                  />
                </div>

                {/* Font Selection */}
                <div>
                  <label htmlFor="signatureFont" className={labelClasses}>Font Style</label>
                  <select
                    id="signatureFont"
                    value={signatureSettings.font}
                    onChange={(e) => setSignatureSettings(prev => ({ ...prev, font: e.target.value }))}
                    className={inputClasses}
                  >
                    {SIGNATURE_FONTS.map((font) => (
                      <option key={font.value} value={font.value}>
                        {font.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Signature Preview */}
                <div>
                  <label className={labelClasses}>Preview</label>
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl min-h-24 flex items-center justify-center">
                    {signatureSettings.name ? (
                      <span
                        style={{
                          fontFamily: `"${signatureSettings.font}", cursive`,
                          fontSize: '2.5rem',
                          color: '#1e293b',
                        }}
                      >
                        {signatureSettings.name}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-sm italic">
                        Enter your name to see the preview
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50/80">
                <button
                  onClick={() => setShowSignatureModal(false)}
                  className="px-4 py-2 text-sm font-medium transition-all duration-200 border rounded-xl text-slate-600 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    saveSignatureSettings(signatureSettings);
                    setShowSignatureModal(false);
                    showToast('Signature saved successfully', 'success');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl hover:from-amber-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all duration-200 shadow-lg shadow-amber-500/25"
                >
                  Save Signature
                </button>
              </div>
            </div>
          </div>

          {/* Load Google Fonts for signatures */}
          <link
            href="https://fonts.googleapis.com/css2?family=Allura&family=Caveat&family=Dancing+Script&family=Great+Vibes&family=Pacifico&family=Satisfy&display=swap"
            rel="stylesheet"
          />
        </>
      )}

      {/* Delete Project Confirmation Modal */}
      {showDeleteModal && (
        <>
          <div
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
            onClick={() => !deleting && setShowDeleteModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl pointer-events-auto mx-4 animate-modal-pop">
              <div className="p-6">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-center text-slate-800 mb-2">
                  Delete Project
                </h3>
                <p className="text-sm text-center text-slate-500 mb-6">
                  Are you sure you want to delete "<span className="font-medium text-slate-700">{active?.name}</span>"? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    disabled={deleting}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteProject}
                    disabled={deleting}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Delete Project'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm md:hidden animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-2xl md:hidden animate-slide-in-left">
            <div className="flex flex-col h-full">
              {/* Mobile Sidebar Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
                    <HardHat className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold text-slate-800">Estimator</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Mobile Sidebar Navigation */}
              <nav className="flex-1 p-3 space-y-1">
                <button
                  onClick={() => {
                    setShowCompanyModal(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                >
                  <Building2 className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">Company Settings</span>
                </button>
                <button
                  onClick={() => {
                    openChangePasswordModal();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                >
                  <Key className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">Change Password</span>
                </button>
                <button
                  onClick={() => {
                    setShowSignatureModal(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                >
                  <PenTool className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">Signature</span>
                </button>
              </nav>

              {/* Mobile Sidebar Footer */}
              <div className="p-4 border-t border-slate-100">
                <p className="text-xs text-slate-400 text-center">
                  © {new Date().getFullYear()} Contractor Estimator
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add Section Modal */}
      {showAddSectionModal && (
        <>
          <div
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowAddSectionModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl pointer-events-auto mx-4 animate-modal-pop">
              <div className="p-6">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-amber-100">
                  <Plus className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-center text-slate-800 mb-2">
                  Add New Section
                </h3>
                <p className="text-sm text-center text-slate-500 mb-4">
                  Enter a name for your new section
                </p>
                <input
                  type="text"
                  autoFocus
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') confirmAddSection();
                    if (e.key === 'Escape') setShowAddSectionModal(false);
                  }}
                  placeholder="Section name"
                  className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 mb-6"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowAddSectionModal(false);
                      setNewSectionName('');
                    }}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmAddSection}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl hover:from-amber-600 hover:to-orange-700 transition-all duration-200"
                  >
                    Add Section
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Section Confirmation Modal */}
      {showDeleteSectionModal && (
        <>
          <div
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowDeleteSectionModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl pointer-events-auto mx-4 animate-modal-pop">
              <div className="p-6">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-center text-slate-800 mb-2">
                  Delete Section
                </h3>
                <p className="text-sm text-center text-slate-500 mb-6">
                  Are you sure you want to delete "<span className="font-medium text-slate-700">{sectionToDelete?.name}</span>"? All items in this section will be removed.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteSectionModal(false);
                      setSectionToDelete(null);
                    }}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteSection}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-all duration-200"
                  >
                    Delete Section
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="relative p-6 bg-white shadow-2xl rounded-2xl">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute p-2 transition-colors rounded-full top-2 right-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              ✕
            </button>
            {/* The AuthWrapper will handle the login page. */}
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2 fade-in duration-300">
          <div className={`px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 ${
            toast.type === 'error'
              ? 'bg-red-600 text-white'
              : toast.type === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-slate-800 text-white'
          }`}>
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* print styles */}
      <style>{`
        @media print {
          header, .print\\:hidden { display: none !important; }
          .print\\:grid-cols-2 { grid-template-columns: 1fr 1fr; }
          body { background: white; }
          .bg-gray-50 { background-color: #f9fafb !important; }
          textarea { border: 1px solid #d1d5db !important; background: white !important; }
        }
        @keyframes slide-in-from-bottom-2 {
          from { transform: translateY(0.5rem); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-in { animation: slide-in-from-bottom-2 0.3s ease-out; }
        @keyframes slide-in-left {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-left { animation: slide-in-left 0.3s ease-out; }
        @keyframes modal-pop {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-modal-pop { animation: modal-pop 0.2s ease-out; }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>
    </div>
  );
}
