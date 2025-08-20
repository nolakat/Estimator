import React, { useEffect, useState } from 'react';
import { Input } from '../ui/input';

export function CurrencyInput({ value, onValue, className }) {
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(money(value ?? 0));
  }, [value, focused]);

  const money = (n) => {
    const num = Number(n);
    if (!isFinite(num)) return "$0.00";
    return num.toLocaleString(undefined, { style: "currency", currency: "USD" });
  };

  const parseCurrency = (str) => {
    if (typeof str === "number") return isFinite(str) ? str : 0;
    const n = Number(String(str).replace(/[^0-9.-]/g, ""));
    return isFinite(n) ? n : 0;
  };

  return (
    <Input
      type="text"
      inputMode="decimal"
      className={className}
      value={text}
      onFocus={(e) => {
        setFocused(true);
        const raw = String(value ?? "");
        setText(raw);
        queueMicrotask(() => e.target.select());
      }}
      onChange={(e) => {
        const v = e.target.value;
        setText(v);
        onValue?.(parseCurrency(v));
      }}
      onBlur={() => {
        const num = parseCurrency(text);
        onValue?.(num);
        setText(money(num));
        setFocused(false);
      }}
    />
  );
}
