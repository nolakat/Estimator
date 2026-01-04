import React, { useEffect, useMemo, useState } from "react";
import { AuthWrapper } from "./components/auth/AuthWrapper";
import { Plus, Trash2, Upload, Printer, Save, FileText, Package, Calculator, HardHat } from "lucide-react";
import { ProjectSelect } from "./components/estimator/ProjectSelect";
import { SectionCard } from "./components/estimator/SectionCard";
import { SummaryRow } from "./components/estimator/SummaryRow";
import { EstimatePreviewModal } from "./components/estimator/EstimatePreviewModal";
import { ProductCatalogModal } from "./components/catalog/ProductCatalogModal";
import { MaterialCalculatorModal } from "./components/calculators/MaterialCalculatorModal";
import { uuid, money, calcTotals, sectionSubtotal } from "./utils/estimator";
import { STORAGE_KEY, defaultItem, emptyProject } from "./constants/estimator";
import { estimatorService } from "./services/estimatorService";

// ----------------------------
// main component
// ----------------------------
export default function App() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [firebaseError, setFirebaseError] = useState(false);
  const [showEstimateModal, setShowEstimateModal] = useState(false);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const active = useMemo(() => projects.find((p) => p.id === activeId) || projects[0], [projects, activeId]);


  const loadProjects = async () => {
    try {
      setLoading(true);
      const userId = 'default-user';

      // First, try to load from localStorage as a backup
      let localProjects = [];
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
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
          const userId = 'default-user';
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
          // Fallback to localStorage
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
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

  const addProject = () => {
    const p = emptyProject(`Project ${projects.length + 1}`);
    setProjects((prev) => [...prev, p]);
    setActiveId(p.id);
  };

  const deleteProject = () => {
    if (!window.confirm("Delete this project? This cannot be undone.")) return;
    const idx = projects.findIndex((p) => p.id === active.id);
    const next = projects.filter((p) => p.id !== active.id);
    setProjects(next);
    setActiveId(next[Math.max(0, idx - 1)]?.id);
  };

  // ----------------------------
  // Section helpers
  // ----------------------------
  const addSection = () => {
    const name = window.prompt("Section name?", `Section ${active.sections.length + 1}`) || `Section ${active.sections.length + 1}`;
    updateActive({ sections: [...active.sections, { id: uuid(), name, items: [defaultItem()] }] });
  };

  const renameSection = (sectionId) => {
    const s = active.sections.find((x) => x.id === sectionId);
    const name = window.prompt("Rename section", s?.name || "Section");
    if (!name) return;
    updateActive({ sections: active.sections.map((sec) => (sec.id === sectionId ? { ...sec, name } : sec)) });
  };

  const duplicateSection = (sectionId) => {
    const s = active.sections.find((x) => x.id === sectionId);
    if (!s) return;
    const copy = JSON.parse(JSON.stringify(s));
    copy.id = uuid();
    copy.name = `${s.name} (copy)`;
    copy.items = (copy.items || []).map((it) => ({ ...it, id: uuid() }));
    updateActive({ sections: [...active.sections, copy] });
  };

  const removeSection = (sectionId) => {
    if (!window.confirm("Delete this section? Its items will be removed.")) return;
    updateActive({ sections: active.sections.filter((s) => s.id !== sectionId) });
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
    try {
      const userId = 'default-user';
      for (const project of projects) {
        await estimatorService.saveEstimate({
          ...project,
          userId
        });
      }
      // Show a brief success message
      alert('All projects saved successfully!');
    } catch (error) {
      console.error('Error saving projects:', error);
      alert('Error saving projects. Check console for details.');
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
    <AuthWrapper>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50">

      {/* Sticky Toolbar */}
      <div className="sticky top-0 z-30 w-full bg-white border-b border-slate-200 shadow-sm print:hidden">
        <div className="px-4 py-3 mx-auto max-w-6xl md:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <ProjectSelect
              value={active.id}
              onValueChange={(v) => setActiveId(v)}
              projects={projects}
            />

            <div className="hidden w-px h-8 mx-1 bg-slate-200 sm:block" />

            <button onClick={addProject} className={buttonPrimary}>
              <Plus className="w-4 h-4"/>New
            </button>
            <button onClick={deleteProject} className={buttonDanger}>
              <Trash2 className="w-4 h-4"/>Delete
            </button>

            <div className="hidden w-px h-8 mx-1 bg-slate-200 sm:block" />

            <button onClick={manualSave} className={buttonSecondary}>
              <Save className="w-4 h-4"/>Save
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
        {/* Project & Client Card */}
        <div className="mb-6 overflow-hidden bg-white border shadow-sm rounded-2xl border-slate-200">
          <div className="p-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Left Column - Logo & Client */}
              <div className="space-y-5">
                {/* Business Logo */}
                <div className="p-4 border rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 border-slate-200">
                  <label className="block mb-2 text-sm font-medium text-slate-700">Business Logo</label>
                  <div className="flex items-center gap-3">
                    <label className={`${buttonSecondary} cursor-pointer text-xs px-3 py-2`}>
                      <Upload className="w-4 h-4"/>
                      Choose Logo
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              updateActive({ businessLogo: event.target?.result });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    {active?.businessLogo && (
                      <button
                        onClick={() => updateActive({ businessLogo: null })}
                        className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-red-600 transition-colors rounded-lg hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3"/>
                        Remove
                      </button>
                    )}
                  </div>
                  {active?.businessLogo && (
                    <div className="mt-3">
                      <img
                        src={active.businessLogo}
                        alt="Business Logo"
                        className="object-contain h-12 border rounded-lg border-slate-200 max-w-32"
                      />
                    </div>
                  )}
                </div>

                {/* Client Info */}
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
                      onChange={(e)=>updateActive({ clientPhone:e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="clientEmail" className={labelClasses}>Client Email</label>
                    <input
                      id="clientEmail"
                      className={inputClasses}
                      type="email"
                      placeholder="name@example.com"
                      value={active?.clientEmail || ""}
                      onChange={(e)=>updateActive({ clientEmail:e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column - Date & Estimate Number */}
              <div className="space-y-5">
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
                <div>
                  <label htmlFor="estimateNumber" className={labelClasses}>Estimate Number</label>
                  <input
                    id="estimateNumber"
                    className={inputClasses}
                    type="text"
                    placeholder="#001"
                    value={active?.estimateNumber || "#001"}
                    onChange={(e) => updateActive({ estimateNumber: e.target.value })}
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
              onRename={renameSection}
              onDuplicate={duplicateSection}
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
            Auto-saved to your browser. Export CSV for backup.
          </p>
          <p className="mt-1 text-xs text-slate-300">
            © {new Date().getFullYear()} Contractor Estimate Tool
          </p>
        </footer>
      </div>

      {/* Estimate Preview Modal */}
      <EstimatePreviewModal
        isOpen={showEstimateModal}
        onClose={() => setShowEstimateModal(false)}
        project={active}
        totals={totals}
        money={money}
        sectionSubtotal={sectionSubtotal}
      />

      {/* Product Catalog Modal */}
      <ProductCatalogModal
        isOpen={showCatalogModal}
        onClose={() => setShowCatalogModal(false)}
        userId="default-user"
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

      {/* print styles */}
      <style>{`
        @media print {
          header, .print\\:hidden { display: none !important; }
          .print\\:grid-cols-2 { grid-template-columns: 1fr 1fr; }
          body { background: white; }
          .bg-gray-50 { background-color: #f9fafb !important; }
          textarea { border: 1px solid #d1d5db !important; background: white !important; }
        }
      `}</style>
    </div>
    </AuthWrapper>
  );
}
