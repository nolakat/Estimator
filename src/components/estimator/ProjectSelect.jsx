import React, { useState } from 'react';
import { SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';

export function ProjectSelect({ value, onValueChange, projects }) {
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
