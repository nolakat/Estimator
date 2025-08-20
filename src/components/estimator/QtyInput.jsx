import React, { useEffect, useState } from 'react';
import { Input } from '../ui/input';

export function QtyInput({ value, onValue, className }) {
  const [text, setText] = useState("");

  useEffect(() => {
    setText(value === undefined || value === null ? "" : String(value));
  }, [value]);

  const normalizeQtyString = (s) => {
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
  };

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
