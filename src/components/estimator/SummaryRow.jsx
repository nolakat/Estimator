import React from 'react';

export function SummaryRow({ label, value, strong, large }) {
  return (
    <div className={`flex items-center justify-between ${large ? "text-xl" : ""} ${strong ? "font-semibold" : ""}`}>
      <div>{label}</div>
      <div className="tabular-nums">{value}</div>
    </div>
  );
}
