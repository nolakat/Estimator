import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Label } from "./components/ui/label";
import { Plus, Trash2, Download, Upload, Printer, Copy, Save } from "lucide-react";

// ----------------------------
// types
// ----------------------------
const defaultItem = () => ({
  id: uuid(),
  desc: "",
  category: "materials", // materials | labor | subcontract | other
  qty: 1,
  unit: "ea",
  unitCost: 0,
  taxable: true,
});

const defaultSection = (name = "Section 1") => ({
  id: uuid(),
  name,
  items: [defaultItem()],
});

const emptyProject = (name = "New Project") => ({
  id: uuid(),
  name,
  // deprecated fields kept for backward compatibility with older saves
  client: "",
  site: "",
  // structured client fields
  clientName: "",
  clientPhone: "",
  clientEmail: "",
  // sections (stacked cards)
  sections: [defaultSection()],
  rates: {
    taxPct: 0, // sales tax applied to taxable items only
    overheadPct: 0, // applied to subtotal (materials+labor+subcontract+other)
    profitPct: 10, // applied after overhead
    contingencyPct: 0, // applied after profit
  },
  notes: "",
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

// ----------------------------
// helpers
// safe uuid (works even if crypto.randomUUID is unavailable in this environment)
const uuid = () => {
  try {
    const g = typeof window !== 'undefined' ? window : {};
    if (g.crypto && typeof g.crypto.randomUUID === 'function') return g.crypto.randomUUID();
  } catch {}
  // fallback
  return `id-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
};

const money = (n) => {
  const num = Number(n);
  if (!isFinite(num)) return "$0.00";
  return num.toLocaleString(undefined, { style: "currency", currency: "USD" });
};

const allItems = (project) => {
  // flatten items across sections, tolerate legacy `items`
  if (project.sections?.length) return project.sections.flatMap((s) => s.items || []);
  return project.items || [];
};

function calcTotals(project) {
  const items = allItems(project);
  const subtotal = items.reduce((sum, it) => sum + Number(it.qty || 0) * Number(it.unitCost || 0), 0);
  const taxableBase = items.reduce((sum, it) => sum + (it.taxable ? Number(it.qty || 0) * Number(it.unitCost || 0) : 0), 0);
  const tax = (project.rates.taxPct / 100) * taxableBase;
  const overhead = (project.rates.overheadPct / 100) * subtotal;
  const profit = (project.rates.profitPct / 100) * (subtotal + overhead + tax);
  const contingency = (project.rates.contingencyPct / 100) * (subtotal + overhead + tax + profit);
  const total = subtotal + tax + overhead + profit + contingency;
  const byCategory = items.reduce((acc, it) => {
    const line = Number(it.qty || 0) * Number(it.unitCost || 0);
    acc[it.category] = (acc[it.category] || 0) + line;
    return acc;
  }, {});
  return { subtotal, tax, overhead, profit, contingency, total, byCategory };
}

const sectionSubtotal = (section) => (section.items || []).reduce((sum, it) => sum + Number(it.qty || 0) * Number(it.unitCost || 0), 0);

const STORAGE_KEY = "contractor_estimator_v1";

// parse currency-like text to number (e.g. "$1,234.50" -> 1234.5)
function parseCurrency(str) {
  if (typeof str === "number") return isFinite(str) ? str : 0;
  const n = Number(String(str).replace(/[^0-9.-]/g, ""));
  return isFinite(n) ? n : 0;
}

// normalize a quantity string: allow digits + one dot, strip extra dots & leading zeros (keeps "0.xx")
function normalizeQtyString(s) {
  s = String(s ?? "");
  // keep only digits and dots
  s = s.replace(/[^0-9.]/g, "");
  // collapse to a single dot
  const firstDot = s.indexOf(".");
  if (firstDot !== -1) s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, "");
  const [rawInt, rawDec] = s.split(".");
  let int = (rawInt ?? "").replace(/^0+(?=\d)/, ""); // remove leading zeros if followed by another digit
  let dec = rawDec;
  if ((int === "" || int === undefined) && dec !== undefined) int = "0"; // e.g., ".5" -> "0.5"
  if (int === undefined) int = "";
  return dec !== undefined ? `${int}.${dec}` : int;
}

// ----------------------------
// CurrencyInput component
// ----------------------------
function CurrencyInput({ value, onValue, className }) {
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(money(value ?? 0));
  }, [value, focused]);

  return (
    <Input
      type="text"
      inputMode="decimal"
      className={className}
      value={text}
      onFocus={(e) => {
        setFocused(true);
        const raw = String(value ?? "");
        setText(raw);
        queueMicrotask(() => e.target.select());
      }}
      onChange={(e) => {
        const v = e.target.value;
        setText(v);
        onValue?.(parseCurrency(v));
      }}
      onBlur={() => {
        const num = parseCurrency(text);
        onValue?.(num);
        setText(money(num));
        setFocused(false);
      }}
    />
  );
}

// ----------------------------
// QtyInput component (text-based for friendlier editing)
// ----------------------------
function QtyInput({ value, onValue, className }) {
  const [text, setText] = useState("");
  useEffect(() => {
    setText(value === undefined || value === null ? "" : String(value));
  }, [value]);

  return (
    <Input
      type="text"
      inputMode="decimal"
      className={className}
      value={text}
      onChange={(e) => {
        const cleaned = normalizeQtyString(e.target.value);
        setText(cleaned);
        onValue?.(cleaned);
      }}
      onBlur={() => {
        const cleaned = normalizeQtyString(text);
        setText(cleaned);
        onValue?.(cleaned);
      }}
      placeholder="0"
    />
  );
}

// ----------------------------
// Select components
// ----------------------------
function ProjectSelect({ value, onValueChange, projects }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedProject = projects.find(p => p.id === value);

  return (
    <div className="relative">
      <SelectTrigger
        className="w-full"
        onClick={() => setIsOpen(!isOpen)}
      >
        <SelectValue placeholder="Select project">
          {selectedProject?.name}
        </SelectValue>
      </SelectTrigger>
      <SelectContent isOpen={isOpen} onClose={() => setIsOpen(false)}>
        {projects.map((p) => (
          <SelectItem
            key={p.id}
            value={p.id}
            onClick={(v) => {
              onValueChange(v);
              setIsOpen(false);
            }}
          >
            {p.name}
          </SelectItem>
        ))}
      </SelectContent>
    </div>
  );
}

function CategorySelect({ value, onValueChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const categories = [
    { value: "materials", label: "Materials" },
    { value: "labor", label: "Labor" },
    { value: "subcontract", label: "Subcontract" },
    { value: "other", label: "Other" }
  ];
  const selectedCategory = categories.find(c => c.value === value);

  return (
    <div className="relative">
      <SelectTrigger
        onClick={() => setIsOpen(!isOpen)}
      >
        <SelectValue>
          {selectedCategory?.label}
        </SelectValue>
      </SelectTrigger>
      <SelectContent isOpen={isOpen} onClose={() => setIsOpen(false)}>
        {categories.map((cat) => (
          <SelectItem
            key={cat.value}
            value={cat.value}
            onClick={(v) => {
              onValueChange(v);
              setIsOpen(false);
            }}
          >
            {cat.label}
          </SelectItem>
        ))}
      </SelectContent>
    </div>
  );
}

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

            {/* right side reserved */}
            <div className="md:col-span-2"></div>
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
          <Card key={sec.id}>
            <CardContent className="p-0">
              {/* header */}
              <div className="flex items-center justify-between p-3 border-b bg-neutral-50">
                <div className="font-semibold">{idx + 1}. {sec.name}</div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => renameSection(sec.id)}>Rename</Button>
                  <Button variant="secondary" onClick={() => duplicateSection(sec.id)}><Copy className="h-4 w-4 mr-1"/>Duplicate</Button>
                  <Button variant="destructive" onClick={() => removeSection(sec.id)}><Trash2 className="h-4 w-4 mr-1"/>Delete</Button>
                </div>
              </div>

              {/* items table */}
              <div className="overflow-show">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-100 sticky top-0">
                    <tr className="text-left">
                      <th className="p-3 w-[35%]">Description</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Qty</th>
                      <th className="p-3">Unit</th>
                      <th className="p-3">Unit Cost</th>
                      <th className="p-3">Taxable</th>
                      <th className="p-3 text-right">Line Total</th>
                      <th className="p-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(sec.items || []).map((it) => (
                      <tr key={it.id} className="border-t hover:bg-neutral-50">
                        <td className="p-2">
                          <Input value={it.desc} onChange={(e)=>updateItem(sec.id, it.id, { desc:e.target.value })}/>
                        </td>
                        <td className="p-2">
                          <CategorySelect
                            value={it.category}
                            onValueChange={(v) => updateItem(sec.id, it.id, { category: v })}
                          />
                        </td>
                        <td className="p-2 w-24">
                          <QtyInput
                            value={it.qty}
                            onValue={(raw)=>updateItem(sec.id, it.id, { qty: raw })}
                            className="text-right tabular-nums"
                          />
                        </td>
                        <td className="p-2 w-24">
                          <Input value={it.unit} onChange={(e)=>updateItem(sec.id, it.id, { unit:e.target.value })}/>
                        </td>
                        <td className="p-2 w-36">
                          <CurrencyInput
                            value={it.unitCost}
                            onValue={(num)=>updateItem(sec.id, it.id, { unitCost:num })}
                            className="text-right font-medium tabular-nums"
                          />
                        </td>
                        <td className="p-2 w-24 text-center">
                          <input type="checkbox" checked={it.taxable} onChange={(e)=>updateItem(sec.id, it.id, { taxable:e.target.checked })}/>
                        </td>
                        <td className="p-2 text-right font-medium tabular-nums">{money(Number(it.qty||0)*Number(it.unitCost||0))}</td>
                        <td className="p-2 text-right">
                          <Button size="icon" variant="ghost" onClick={()=>removeItem(sec.id, it.id)}><Trash2 className="h-4 w-4"/></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3 border-t flex items-center justify-between">
                <Button className="gap-2" onClick={()=>addItem(sec.id)}><Plus className="h-4 w-4"/>Add line</Button>
                <div className="text-sm text-neutral-600">{sec.name} Subtotal: <span className="font-medium tabular-nums">{money(sectionSubtotal(sec))}</span></div>
              </div>
            </CardContent>
          </Card>
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
              <SummaryRow label="Materials" value={totals.byCategory.materials || 0} />
              <SummaryRow label="Labor" value={totals.byCategory.labor || 0} />
              <SummaryRow label="Subcontract" value={totals.byCategory.subcontract || 0} />
              <SummaryRow label="Other" value={totals.byCategory.other || 0} />
              <div className="h-px bg-neutral-200 my-2"/>
              <SummaryRow label="SUBTOTAL" value={totals.subtotal} strong />
              <SummaryRow label={`Sales Tax (${active.rates.taxPct||0}%)`} value={totals.tax} />
              <SummaryRow label={`Overhead (${active.rates.overheadPct||0}%)`} value={totals.overhead} />
              <SummaryRow label={`Profit (${active.rates.profitPct||0}%)`} value={totals.profit} />
              <SummaryRow label={`Contingency (${active.rates.contingencyPct||0}%)`} value={totals.contingency} />
              <div className="h-px bg-neutral-200 my-2"/>
              <SummaryRow label="TOTAL" value={totals.total} strong large />
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
        }
      `}</style>
    </div>
  );
}

function SummaryRow({ label, value, strong, large }) {
  return (
    <div className={`flex items-center justify-between ${large ? "text-xl" : ""} ${strong ? "font-semibold" : ""}`}>
      <div>{label}</div>
      <div className="tabular-nums">{money(value)}</div>
    </div>
  );
}

// ----------------------------
// csv helpers
// ----------------------------
const csvEscape = (val) => {
  const s = String(val ?? "");
  if (/[",\n]/.test(s)) return '"' + s.replaceAll('"', '""') + '"';
  return s;
};

const safe = (s) => (s ?? "").toString();
const sanitizeFilename = (s) => s.replace(/[^a-z0-9-_]+/gi, "_").slice(0, 80);

// Basic CSV line parser (no embedded newlines)
function parseCsvLine(line) {
  const out = [];
  let cur = ""; let inQ = false; for (let i=0;i<line.length;i++) { const ch=line[i];
    if (inQ) {
      if (ch==='"' && line[i+1]==='"') { cur+='"'; i++; }
      else if (ch==='"') { inQ=false; }
      else { cur+=ch; }
    } else {
      if (ch===',') { out.push(cur); cur=''; }
      else if (ch==='"') { inQ=true; }
      else { cur+=ch; }
    }
  }
  out.push(cur);
  return out;
}

// ----------------------------
// lightweight sanity tests (run once in dev)
// ----------------------------
(function devTests(){
  try {
    if (typeof window === 'undefined') return;
    if (window.__ESTIMATOR_TESTS_RUN__) return; // run once

    // Test money formatter
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
})();



