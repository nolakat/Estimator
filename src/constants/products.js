import { uuid } from '../utils/estimator';

export const PRODUCT_CATEGORIES = [
  { value: "lumber", label: "Lumber" },
  { value: "drywall", label: "Drywall" },
  { value: "paint", label: "Paint" },
  { value: "flooring", label: "Flooring" },
  { value: "hardware", label: "Hardware" },
  { value: "electrical", label: "Electrical" },
  { value: "plumbing", label: "Plumbing" },
  { value: "roofing", label: "Roofing" },
  { value: "insulation", label: "Insulation" },
  { value: "concrete", label: "Concrete" },
  { value: "other", label: "Other" },
];

export const ITEM_CATEGORIES = [
  { value: "materials", label: "Materials" },
  { value: "labor", label: "Labor" },
  { value: "subcontract", label: "Subcontract" },
  { value: "other", label: "Other" },
];

export const defaultProduct = () => ({
  id: uuid(),
  name: "",
  productCategory: "lumber",
  category: "materials",
  unit: "ea",
  unitPrice: 0,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});
