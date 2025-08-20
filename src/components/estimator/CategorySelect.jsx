import React, { useState } from 'react';
import { SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';

export function CategorySelect({ value, onValueChange }) {
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
