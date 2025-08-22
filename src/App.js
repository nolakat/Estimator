import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Plus, Trash2, Download, Upload, Printer, Copy, Save, FileText } from "lucide-react";
import { ProjectSelect } from "./components/estimator/ProjectSelect";
import { SectionCard } from "./components/estimator/SectionCard";
import { SummaryRow } from "./components/estimator/SummaryRow";
import { EstimatePreviewModal } from "./components/estimator/EstimatePreviewModal";
import { uuid, money, calcTotals, sectionSubtotal, csvEscape, safe, sanitizeFilename, parseCsvLine } from "./utils/estimator";
import { STORAGE_KEY, defaultItem, defaultSection, emptyProject } from "./constants/estimator";
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
          console.error('Error saving to Firebase:', error);
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

  const duplicateProject = () => {
    const copy = JSON.parse(JSON.stringify(active));
    copy.id = uuid();
    copy.name = `${active.name} (copy)`;
    copy.createdAt = Date.now();
    copy.updatedAt = Date.now();
    // re-key section and item ids
    copy.sections = (copy.sections || []).map((s) => ({
      ...s,
      id: uuid(),
      items: (s.items || []).map((it) => ({ ...it, id: uuid() })),
    }));
    setProjects((prev) => [...prev, copy]);
    setActiveId(copy.id);
  };

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

  const exportCSV = () => {

    const rows = [
      ["Project", active.name],
      ["Estimate Number", active.estimateNumber || "#001"], // Add this line
      ["Client Name", active.clientName || ""],
      ["Client Phone", active.clientPhone || ""],
      ["Client Email", active.clientEmail || ""],
      ["Estimate Date", active.estimateDate || ""],
      [""],
    ];
    (active.sections || []).forEach((sec, idx) => {
      rows.push([`Section ${idx + 1}: ${sec.name}`]);
      rows.push(["Description", "Category", "Qty", "Unit", "Unit Cost", "Taxable", "Line Total"]);
      rows.push(...(sec.items || []).map((it) => [
        safe(it.desc),
        it.category,
        String(it.qty ?? 0),
        safe(it.unit),
        String(it.unitCost ?? 0),
        it.taxable ? "YES" : "NO",
        String(Number(it.qty || 0) * Number(it.unitCost || 0)),
      ]));
      rows.push(["Section Subtotal", String(sectionSubtotal(sec))]);
      if (sec.notes && sec.notes.trim()) {
        rows.push(["Section Notes", sec.notes]);
      }
      rows.push([""]);
    });

    const totals = calcTotals(active);
    rows.push(["Tax %", String(active.rates.taxPct)]);
    rows.push(["Overhead %", String(active.rates.overheadPct)]);
    rows.push(["Profit %", String(active.rates.profitPct)]);
    rows.push(["Contingency %", String(active.rates.contingencyPct)]);
    rows.push([""]);
    rows.push(["Subtotal", String(totals.subtotal)]);
    rows.push(["Sales Tax", String(totals.tax)]);
    rows.push(["Overhead", String(totals.overhead)]);
    rows.push(["Profit", String(totals.profit)]);
    rows.push(["Contingency", String(totals.contingency)]);
    rows.push(["Total", String(totals.total)]);

    const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sanitizeFilename(active.name)}_estimate.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importCSV = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || "");
        const lines = text.split(/\r?\n/);
        // very simple importer: loads into the FIRST section it finds/creates
        let sec = active.sections?.[0] || defaultSection();
        const items = [];
        const headerIdx = lines.findIndex((l) => l.startsWith("Description,") || l.startsWith('"Description",'));
        if (headerIdx !== -1) {
          for (let i = headerIdx + 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line || !line.trim()) break;
            const cols = parseCsvLine(line);
            if (cols.length < 7) break; // totals reached
            const [desc, category, qty, unit, unitCost, taxable] = cols;
            items.push({
              id: uuid(),
              desc: desc || "",
              category: (category || "materials").toLowerCase(),
              qty: qty ?? "",
              unit: unit || "ea",
              unitCost: Number(unitCost || 0),
              taxable: /^y(es)?$/i.test(taxable || "YES"),
            });
          }
        }
        // write into first section
        updateActive({ sections: [{ ...sec, items }, ...active.sections.slice(1) ] });
        alert("Imported items into first section.");
      } catch (e) {
        alert("Import failed: " + e.message);
      }
    };
    reader.readAsText(file);
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

  if (loading) {
    return (
      <div className="min-h-screen p-4 bg-neutral-50 text-neutral-900 md:p-8">
        <div className="grid max-w-6xl gap-4 mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 border-b-2 rounded-full animate-spin border-neutral-900"></div>
              <p className="text-neutral-600">Loading your estimates...</p>
              {firebaseError && (
                <Button onClick={retryFirebase} className="mt-4">Retry Firebase</Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-neutral-50 text-neutral-900 md:p-8">
      <div className="grid max-w-6xl gap-4 mx-auto">
      <header className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Contractor Estimate Tool</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={addProject} className="gap-2"><Plus className="w-4 h-4"/>New</Button>
            <Button onClick={duplicateProject} variant="secondary" className="gap-2"><Copy className="w-4 h-4"/>Duplicate</Button>
            <Button onClick={deleteProject} variant="destructive" className="gap-2"><Trash2 className="w-4 h-4"/>Delete</Button>
            <Button onClick={exportCSV} variant="secondary" className="gap-2"><Download className="w-4 h-4"/>CSV</Button>
            <label className="inline-flex items-center gap-2 px-3 py-2 bg-white border rounded-lg cursor-pointer"><Upload className="w-4 h-4"/> Import CSV
              <input type="file" accept=".csv" className="hidden" onChange={(e)=> e.target.files?.[0] && importCSV(e.target.files[0])}/>
            </label>
            <Button onClick={manualSave} variant="secondary" className="gap-2"><Save className="w-4 h-4"/>Save</Button>
            <Button onClick={createEstimate} variant="outline" className="gap-2 text-gray-900 bg-yellow-400 border-yellow-400 hover:bg-yellow-500 hover:border-yellow-500"><FileText className="w-4 h-4"/>Preview Estimate</Button>
            <Button onClick={printPage} variant="outline" className="gap-2"><Printer className="w-4 h-4"/>Print</Button>
          </div>
      </header>

        {/* project picker + client details */}
        <Card>
          <CardContent className="grid gap-4 p-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <Label>Project</Label>
              <div className="flex gap-2 mt-1">
                <ProjectSelect
                  value={active.id}
                  onValueChange={(v) => setActiveId(v)}
                  projects={projects}
                />
                <Button variant="outline" className="gap-2" onClick={() => updateActive({ name: window.prompt("Project name?", active.name) || active.name })}><Save className="w-4 h-4"/>Rename</Button>
              </div>

              {/* stacked client info */}
              <div className="grid gap-3 mt-4">
                <div>
                  <Label>Client Name</Label>
                  <Input className="mt-1" value={active?.clientName || ""} onChange={(e)=>updateActive({ clientName:e.target.value })}/>
                </div>
                <div>
                  <Label>Client Phone #</Label>
                  <Input className="mt-1" type="tel" placeholder="(555) 555-5555" value={active?.clientPhone || ""} onChange={(e)=>updateActive({ clientPhone:e.target.value })}/>
                </div>
                <div>
                  <Label>Client Email</Label>
                  <Input className="mt-1" type="email" placeholder="name@example.com" value={active?.clientEmail || ""} onChange={(e)=>updateActive({ clientEmail:e.target.value })}/>
                </div>
              </div>
            </div>

            {/* right side - date input */}
            <div className="md:col-span-2">
              <Label>Estimate Date</Label>
                <Input
                  className="mt-1"
                  type="date"
                  value={active?.estimateDate || new Date().toISOString().split('T')[0]}
                  onChange={(e) => updateActive({ estimateDate: e.target.value })}
                />
                    {/* Add Estimate Number field */}
              <div className="mt-4">
                <Label>Estimate Number</Label>
                <Input
                  className="mt-1"
                  type="text"
                  placeholder="#001"
                  value={active?.estimateNumber || "#001"}
                  onChange={(e) => updateActive({ estimateNumber: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTIONS — stacked cards */}
        <div className="flex items-center justify-between">
          <div className="text-base font-semibold">Sections</div>
          <div className="flex gap-2">
            <Button className="gap-2" onClick={addSection}><Plus className="w-4 h-4"/>Add Section</Button>
          </div>
        </div>

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

        {/* rates & summary */}
        <div className="grid gap-4 md:grid-cols-2 print:grid-cols-2">
          <Card>
            <CardContent className="grid grid-cols-2 gap-4 p-4">
              <div className="col-span-2 text-base font-semibold">Rates & Markups</div>
              <div>
                <Label>Sales Tax %</Label>
                <Input className="mt-1" type="number" inputMode="decimal" value={active.rates.taxPct} onChange={(e)=>updateActive({ rates: { ...active.rates, taxPct: Number(e.target.value) } })}/>
              </div>
              <div>
                <Label>Overhead %</Label>
                <Input className="mt-1" type="number" inputMode="decimal" value={active.rates.overheadPct} onChange={(e)=>updateActive({ rates: { ...active.rates, overheadPct: Number(e.target.value) } })}/>
              </div>
              <div>
                <Label>Profit %</Label>
                <Input className="mt-1" type="number" inputMode="decimal" value={active.rates.profitPct} onChange={(e)=>updateActive({ rates: { ...active.rates, profitPct: Number(e.target.value) } })}/>
              </div>
              <div>
                <Label>Contingency %</Label>
                <Input className="mt-1" type="number" inputMode="decimal" value={active.rates.contingencyPct} onChange={(e)=>updateActive({ rates: { ...active.rates, contingencyPct: Number(e.target.value) } })}/>
              </div>
              <div className="col-span-2">
                <Label>Notes (prints on estimate)</Label>
                <textarea className="w-full p-2 mt-1 border rounded-lg min-h-24" value={active.notes} onChange={(e)=>updateActive({ notes: e.target.value })} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="grid gap-2 p-4">
              <div className="text-base font-semibold">Summary</div>
              <SummaryRow label="Materials" value={money(totals.byCategory.materials || 0)} />
              <SummaryRow label="Labor" value={money(totals.byCategory.labor || 0)} />
              <SummaryRow label="Subcontract" value={money(totals.byCategory.subcontract || 0)} />
              <SummaryRow label="Other" value={money(totals.byCategory.other || 0)} />
              <div className="h-px my-2 bg-neutral-200"/>
              <SummaryRow label="SUBTOTAL" value={money(totals.subtotal)} strong />
              <SummaryRow label={`Sales Tax (${active.rates.taxPct||0}%)`} value={money(totals.tax)} />
              <SummaryRow label={`Overhead (${active.rates.overheadPct||0}%)`} value={money(totals.overhead)} />
              <SummaryRow label={`Profit (${active.rates.profitPct||0}%)`} value={money(totals.profit)} />
              <SummaryRow label={`Contingency (${active.rates.contingencyPct||0}%)`} value={money(totals.contingency)} />
              <div className="h-px my-2 bg-neutral-200"/>
              <SummaryRow label="TOTAL" value={money(totals.total)} strong large />
            </CardContent>
          </Card>
        </div>

        <footer className="py-6 text-xs text-center text-neutral-500 print:hidden">
          Auto-saved to your browser. Export CSV for backup. — © {new Date().getFullYear()} Simple Estimator
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
  );
}












