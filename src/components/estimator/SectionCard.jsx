import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Plus, Trash2, Copy, GripVertical } from 'lucide-react';
import { CategorySelect } from './CategorySelect';
import { CurrencyInput } from './CurrencyInput';
import { QtyInput } from './QtyInput';

export function SectionCard({
  section,
  sectionIndex,
  onRename,
  onDuplicate,
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

  return (
    <Card
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <CardContent className="p-0">
        {/* header */}
        <div className="flex items-center justify-between p-3 border-b bg-neutral-50">
          <div className="flex items-center gap-2">
            <div className="cursor-move text-neutral-400 hover:text-neutral-600">
              <GripVertical className="h-4 w-4" />
            </div>
            <div className="font-semibold">{sectionIndex + 1}. {section.name}</div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onRename(section.id)}>Rename</Button>
            <Button variant="secondary" onClick={() => onDuplicate(section.id)}><Copy className="h-4 w-4 mr-1"/>Duplicate</Button>
            <Button variant="destructive" onClick={() => onRemove(section.id)}><Trash2 className="h-4 w-4 mr-1"/>Delete</Button>
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
              {(section.items || []).map((it) => (
                <tr key={it.id} className="border-t hover:bg-neutral-50">
                  <td className="p-2">
                    <Input
                      value={it.desc}
                      onChange={(e) => onUpdateItem(section.id, it.id, { desc: e.target.value })}
                    />
                  </td>
                  <td className="p-2">
                    <CategorySelect
                      value={it.category}
                      onValueChange={(v) => onUpdateItem(section.id, it.id, { category: v })}
                    />
                  </td>
                  <td className="p-2 w-24">
                    <QtyInput
                      value={it.qty}
                      onValue={(raw) => onUpdateItem(section.id, it.id, { qty: raw })}
                      className="text-right tabular-nums"
                    />
                  </td>
                  <td className="p-2 w-24">
                    <Input
                      value={it.unit}
                      onChange={(e) => onUpdateItem(section.id, it.id, { unit: e.target.value })}
                    />
                  </td>
                  <td className="p-2 w-36">
                    <CurrencyInput
                      value={it.unitCost}
                      onValue={(num) => onUpdateItem(section.id, it.id, { unitCost: num })}
                      className="text-right font-medium tabular-nums"
                    />
                  </td>
                  <td className="p-2 w-24 text-center">
                    <input
                      type="checkbox"
                      checked={it.taxable}
                      onChange={(e) => onUpdateItem(section.id, it.id, { taxable: e.target.checked })}
                    />
                  </td>
                  <td className="p-2 text-right font-medium tabular-nums">
                    {money(Number(it.qty || 0) * Number(it.unitCost || 0))}
                  </td>
                  <td className="p-2 text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onRemoveItem(section.id, it.id)}
                    >
                      <Trash2 className="h-4 w-4"/>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t flex items-center justify-between">
          <Button className="gap-2" onClick={() => onAddItem(section.id)}>
            <Plus className="h-4 w-4"/>Add line
          </Button>
          <div className="text-sm text-neutral-600">
            {section.name} Subtotal: <span className="font-medium tabular-nums">{money(sectionSubtotal(section))}</span>
          </div>
        </div>

        {/* Section Notes */}
        <div className="p-3 border-t bg-gray-50">
          <Label className="text-sm font-medium text-gray-700">Section Notes</Label>
          <textarea
            className="mt-2 w-full rounded-md border border-gray-300 p-2 text-sm min-h-20 resize-none"
            placeholder="Add notes for this section..."
            value={section.notes || ""}
            onChange={(e) => {
              onUpdateSection(section.id, { notes: e.target.value });
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
