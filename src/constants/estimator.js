import { uuid } from '../utils/estimator';

export const STORAGE_KEY = "contractor_estimator_v1";

export const defaultItem = () => ({
  id: uuid(),
  desc: "",
  category: "materials", // materials | labor | subcontract | other
  qty: 1,
  unit: "ea",
  unitCost: 0,
  taxable: true,
});

export const defaultSection = (name = "Section 1") => ({
  id: uuid(),
  name,
  items: [defaultItem()],
  notes: "",
});

export const emptyProject = (name = "New Project") => ({
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
  estimateDate: new Date().toISOString().split('T')[0],
  createdAt: Date.now(),
  updatedAt: Date.now(),
});
