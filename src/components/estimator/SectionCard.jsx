import React from 'react';
import { Plus, Trash2, GripVertical, FileText, Edit3 } from 'lucide-react';
import { CategorySelect } from './CategorySelect';
import { CurrencyInput } from './CurrencyInput';
import { QtyInput } from './QtyInput';

export function SectionCard({
  section,
  sectionIndex,
  onRename,
  onRemove,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  onUpdateSection,
  onReorder,
  money
}) {
  const sectionSubtotal = (section) => (section.items || []).reduce((sum, it) => sum + Number(it.qty || 0) * Number(it.unitCost || 0), 0);

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', section.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const draggedSectionId = e.dataTransfer.getData('text/plain');
    if (draggedSectionId !== section.id) {
      onReorder(draggedSectionId, section.id);
    }
  };

  const inputClasses = "w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 placeholder:text-slate-400";
  const buttonSecondary = "inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500/20 transition-all duration-200";
  const buttonDanger = "inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-200";
  const buttonPrimary = "inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg hover:from-amber-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all duration-200 shadow-sm shadow-amber-500/20";

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="transition-shadow duration-200 bg-white border shadow-sm rounded-2xl border-slate-200 hover:shadow-md"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center gap-3">
          <div className="cursor-move p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <GripVertical className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">{section.name}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className={buttonSecondary} onClick={() => onRename(section.id)}>
            <Edit3 className="h-3.5 w-3.5" />
            Rename
          </button>
          <button className={buttonDanger} onClick={() => onRemove(section.id)}>
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      </div>

      {/* Items Table */}
      <div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left bg-slate-50">
              <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider w-[35%]">Description</th>
              <th className="px-4 py-3 text-xs font-semibold tracking-wider uppercase text-slate-600">Category</th>
              <th className="px-4 py-3 text-xs font-semibold tracking-wider uppercase text-slate-600">Qty</th>
              <th className="px-4 py-3 text-xs font-semibold tracking-wider uppercase text-slate-600">Unit</th>
              <th className="px-4 py-3 text-xs font-semibold tracking-wider uppercase text-slate-600">Unit Cost</th>
              <th className="px-4 py-3 text-xs font-semibold tracking-wider text-center uppercase text-slate-600">Tax</th>
              <th className="px-4 py-3 text-xs font-semibold tracking-wider text-right uppercase text-slate-600">Line Total</th>
              <th className="w-12 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(section.items || []).map((it, idx) => (
              <tr key={it.id} className="transition-colors group hover:bg-slate-50/50">
                <td className="px-4 py-2.5">
                  <input
                    className={inputClasses}
                    value={it.desc}
                    onChange={(e) => onUpdateItem(section.id, it.id, { desc: e.target.value })}
                    placeholder="Item description"
                  />
                </td>
                <td className="px-4 py-2.5">
                  <CategorySelect
                    value={it.category}
                    onValueChange={(v) => onUpdateItem(section.id, it.id, { category: v })}
                  />
                </td>
                <td className="px-4 py-2.5 w-24">
                  <QtyInput
                    value={it.qty}
                    onValue={(raw) => onUpdateItem(section.id, it.id, { qty: raw })}
                    className={`${inputClasses} text-right tabular-nums`}
                  />
                </td>
                <td className="px-4 py-2.5 w-24">
                  <input
                    className={inputClasses}
                    value={it.unit}
                    onChange={(e) => onUpdateItem(section.id, it.id, { unit: e.target.value })}
                    placeholder="ea"
                  />
                </td>
                <td className="px-4 py-2.5 w-32">
                  <CurrencyInput
                    value={it.unitCost}
                    onValue={(num) => onUpdateItem(section.id, it.id, { unitCost: num })}
                    className={`${inputClasses} text-right font-medium tabular-nums`}
                  />
                </td>
                <td className="px-4 py-2.5 w-16 text-center">
                  <label className="inline-flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={it.taxable}
                      onChange={(e) => onUpdateItem(section.id, it.id, { taxable: e.target.checked })}
                      className="w-4 h-4 rounded cursor-pointer text-amber-600 border-slate-300 focus:ring-amber-500 focus:ring-offset-0"
                    />
                  </label>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span className="font-semibold text-slate-800 tabular-nums">
                    {money(Number(it.qty || 0) * Number(it.unitCost || 0))}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <button
                    onClick={() => onRemoveItem(section.id, it.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer - Add Line & Subtotal */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
        <button className={buttonPrimary} onClick={() => onAddItem(section.id)}>
          <Plus className="w-4 h-4" />
          Add Line
        </button>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">{section.name} Subtotal:</span>
          <span className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-semibold text-slate-800 tabular-nums shadow-sm">
            {money(sectionSubtotal(section))}
          </span>
        </div>
      </div>

      {/* Section Notes */}
      <div className="px-4 py-4 border-t border-slate-100 bg-gradient-to-br from-slate-50 to-white">
        <label className="flex items-center gap-1.5 mb-2 text-sm font-medium text-slate-700">
          <FileText className="w-3.5 h-3.5" />
          Section Notes
        </label>
        <textarea
          className={`${inputClasses} min-h-20 resize-none`}
          placeholder="Add notes for this section (will appear on the estimate)..."
          value={section.notes || ""}
          onChange={(e) => {
            onUpdateSection(section.id, { notes: e.target.value });
          }}
        />
      </div>
    </div>
  );
}
