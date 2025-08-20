// safe uuid (works even if crypto.randomUUID is unavailable in this environment)
export const uuid = () => {
  try {
    const g = typeof window !== 'undefined' ? window : {};
    if (g.crypto && typeof g.crypto.randomUUID === 'function') return g.crypto.randomUUID();
  } catch {}
  // fallback
  return `id-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
};

export const money = (n) => {
  const num = Number(n);
  if (!isFinite(num)) return "$0.00";
  return num.toLocaleString(undefined, { style: "currency", currency: "USD" });
};

export const allItems = (project) => {
  // flatten items across sections, tolerate legacy `items`
  if (project.sections?.length) return project.sections.flatMap((s) => s.items || []);
  return project.items || [];
};

export function calcTotals(project) {
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

export const sectionSubtotal = (section) => (section.items || []).reduce((sum, it) => sum + Number(it.qty || 0) * Number(it.unitCost || 0), 0);

// parse currency-like text to number (e.g. "$1,234.50" -> 1234.5)
export function parseCurrency(str) {
  if (typeof str === "number") return isFinite(str) ? str : 0;
  const n = Number(String(str).replace(/[^0-9.-]/g, ""));
  return isFinite(n) ? n : 0;
}

// csv helpers
export const csvEscape = (val) => {
  const s = String(val ?? "");
  if (/[",\n]/.test(s)) return '"' + s.replaceAll('"', '""') + '"';
  return s;
};

export const safe = (s) => (s ?? "").toString();
export const sanitizeFilename = (s) => s.replace(/[^a-z0-9-_]+/gi, "_").slice(0, 80);

// Basic CSV line parser (no embedded newlines)
export function parseCsvLine(line) {
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
