import React from 'react';

export function SummaryRow({ label, value, strong, large }) {
  return (
    <div
      className={`flex items-center justify-between py-1.5 ${
        large ? "text-lg" : "text-sm"
      }`}
    >
      <span className={`${strong ? "font-semibold text-slate-800" : "text-slate-600"}`}>
        {label}
      </span>
      <span className={`tabular-nums ${
        strong
          ? "font-semibold text-slate-800"
          : "text-slate-700"
      } ${large ? "text-xl font-bold" : ""}`}>
        {value}
      </span>
    </div>
  );
}
