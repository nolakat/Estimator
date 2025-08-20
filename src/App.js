import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Plus, Trash2, Download, Upload, Printer, Copy, Save } from "lucide-react";
import { ProjectSelect } from "./components/estimator/ProjectSelect";
import { SectionCard } from "./components/estimator/SectionCard";
import { SummaryRow } from "./components/estimator/SummaryRow";
import { uuid, money, calcTotals, sectionSubtotal, csvEscape, safe, sanitizeFilename, parseCsvLine } from "./utils/estimator";
import { STORAGE_KEY, defaultItem, defaultSection, emptyProject } from "./constants/estimator";

// ----------------------------
// main component
// ----------------------------
export default function App() {
  const [projects, setProjects] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const arr = Array.isArray(parsed) ? parsed : [parsed];
        // migration: ensure client fields and sections exist
        return arr.map((p) => {
          const withClient = {
            clientName: p.clientName ?? p.client ?? "",
            clientPhone: p.clientPhone ?? "",
            clientEmail: p.clientEmail ?? "",
            ...p,
          };
          if (!withClient.sections || !withClient.sections.length) {
            // convert legacy items list to a single section
            const legacyItems = Array.isArray(withClient.items) ? withClient.items : [];
            withClient.sections = [{ id: uuid(), name: "Section 1", items: legacyItems.length ? legacyItems : [defaultItem()] }];
            delete withClient.items;
          }
          return withClient;
        });
      }
    } catch {}
    return [emptyProject("Sample Project")];
  });
  const [activeId, setActiveId] = useState(projects[0]?.id);

  const active = useMemo(() => projects.find((p) => p.id === activeId) || projects[0], [projects, activeId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  const updateActive = (patch) => {
    setProjects((prev) => prev.map((p) => (p.id === active.id ? { ...p, ...patch, updatedAt: Date.now() } : p)));
  };

  const totals = useMemo(() => calcTotals(active), [active]);

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

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto grid gap-4">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Contractor Estimate Tool</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={addProject} className="gap-2"><Plus className="h-4 w-4"/>New</Button>
            <Button onClick={duplicateProject} variant="secondary" className="gap-2"><Copy className="h-4 w-4"/>Duplicate</Button>
            <Button onClick={deleteProject} variant="destructive" className="gap-2"><Trash2 className="h-4 w-4"/>Delete</Button>
            <Button onClick={exportCSV} variant="secondary" className="gap-2"><Download className="h-4 w-4"/>CSV</Button>
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer bg-white"><Upload className="h-4 w-4"/> Import CSV
              <input type="file" accept=".csv" className="hidden" onChange={(e)=> e.target.files?.[0] && importCSV(e.target.files[0])}/>
            </label>
            <Button onClick={printPage} variant="outline" className="gap-2"><Printer className="h-4 w-4"/>Print</Button>
          </div>
        </header>

        {/* project picker + client details */}
        <Card>
          <CardContent className="p-4 grid md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Label>Project</Label>
              <div className="flex gap-2 mt-1">
                <ProjectSelect
                  value={active.id}
                  onValueChange={(v) => setActiveId(v)}
                  projects={projects}
                />
                <Button variant="outline" className="gap-2" onClick={() => updateActive({ name: window.prompt("Project name?", active.name) || active.name })}><Save className="h-4 w-4"/>Rename</Button>
              </div>

              {/* stacked client info */}
              <div className="mt-4 grid gap-3">
                <div>
                  <Label>Client Name</Label>
                  <Input className="mt-1" value={active.clientName || ""} onChange={(e)=>updateActive({ clientName:e.target.value })}/>
                </div>
                <div>
                  <Label>Client Phone #</Label>
                  <Input className="mt-1" type="tel" placeholder="(555) 555-5555" value={active.clientPhone || ""} onChange={(e)=>updateActive({ clientPhone:e.target.value })}/>
                </div>
                <div>
                  <Label>Client Email</Label>
                  <Input className="mt-1" type="email" placeholder="name@example.com" value={active.clientEmail || ""} onChange={(e)=>updateActive({ clientEmail:e.target.value })}/>
                </div>
              </div>
            </div>

            {/* right side - date input */}
            <div className="md:col-span-2">
              <Label>Estimate Date</Label>
              <Input
                className="mt-1"
                type="date"
                value={active.estimateDate || new Date().toISOString().split('T')[0]}
                onChange={(e) => updateActive({ estimateDate: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* SECTIONS — stacked cards */}
        <div className="flex items-center justify-between">
          <div className="text-base font-semibold">Sections</div>
          <div className="flex gap-2">
            <Button className="gap-2" onClick={addSection}><Plus className="h-4 w-4"/>Add Section</Button>
          </div>
        </div>

        {(active.sections || []).map((sec, idx) => (
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
        <div className="grid md:grid-cols-2 gap-4 print:grid-cols-2">
          <Card>
            <CardContent className="p-4 grid grid-cols-2 gap-4">
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
                <textarea className="mt-1 w-full rounded-lg border p-2 min-h-24" value={active.notes} onChange={(e)=>updateActive({ notes: e.target.value })} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 grid gap-2">
              <div className="text-base font-semibold">Summary</div>
              <SummaryRow label="Materials" value={money(totals.byCategory.materials || 0)} />
              <SummaryRow label="Labor" value={money(totals.byCategory.labor || 0)} />
              <SummaryRow label="Subcontract" value={money(totals.byCategory.subcontract || 0)} />
              <SummaryRow label="Other" value={money(totals.byCategory.other || 0)} />
              <div className="h-px bg-neutral-200 my-2"/>
              <SummaryRow label="SUBTOTAL" value={money(totals.subtotal)} strong />
              <SummaryRow label={`Sales Tax (${active.rates.taxPct||0}%)`} value={money(totals.tax)} />
              <SummaryRow label={`Overhead (${active.rates.overheadPct||0}%)`} value={money(totals.overhead)} />
              <SummaryRow label={`Profit (${active.rates.profitPct||0}%)`} value={money(totals.profit)} />
              <SummaryRow label={`Contingency (${active.rates.contingencyPct||0}%)`} value={money(totals.contingency)} />
              <div className="h-px bg-neutral-200 my-2"/>
              <SummaryRow label="TOTAL" value={money(totals.total)} strong large />
            </CardContent>
          </Card>
        </div>

        <footer className="text-xs text-neutral-500 text-center py-6 print:hidden">
          Auto-saved to your browser. Export CSV for backup. — © {new Date().getFullYear()} Simple Estimator
        </footer>
      </div>

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







  try {




    console.assert(money(0) === '$0.00', 'money(0)');
    console.assert(money(1234.56).includes('$') && money(1234.56).includes('1,234.56'), 'money(1234.56) formatting');

    // Test parseCurrency
    console.assert(parseCurrency('$1,234.50') === 1234.5, 'parseCurrency basic with $ and commas');
    console.assert(parseCurrency('12.3') === 12.3, 'parseCurrency decimals');

    // Test totals calculation with sections
    const pj = {
      sections: [
        { items: [ { qty: 2, unitCost: 5, taxable: true, category: 'materials' } ] },
        { items: [ { qty: 3, unitCost: 10, taxable: false, category: 'labor' } ] },
      ],
      rates: { taxPct: 10, overheadPct: 0, profitPct: 0, contingencyPct: 0 }
    };
    const t = calcTotals(pj);
    console.assert(t.subtotal === 2*5 + 3*10, 'subtotal calc (sections)');
    console.assert(Math.abs(t.tax - (0.10 * (2*5))) < 1e-6, 'tax only on taxable (sections)');

    // Test qty normalization
    console.assert(normalizeQtyString('045') === '45', 'normalizeQtyString strips leading zeros');
    console.assert(normalizeQtyString('.5') === '0.5', 'normalizeQtyString prepends 0 before decimal');
    console.assert(normalizeQtyString('') === '', 'normalizeQtyString handles empty');

    // Test uuid uniqueness & availability
    const ids = new Set(Array.from({length: 100}, () => uuid()));
    console.assert(ids.size === 100, 'uuid should generate 100 unique ids');

    window.__ESTIMATOR_TESTS_RUN__ = true;
    console.log('[Estimator] sanity tests passed');
  } catch (err) {
    console.warn('[Estimator] sanity tests failed', err);
  }




