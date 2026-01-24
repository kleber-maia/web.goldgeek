"use client";

import { PaymentMethod } from "@/lib/account";

interface PaymentOptionProps {
  method: PaymentMethod;
  label: string;
  detail?: string;
  selected: boolean;
  onChange: (method: PaymentMethod) => void;
}

export default function PaymentOption({
  method,
  label,
  detail,
  selected,
  onChange,
}: PaymentOptionProps) {
  return (
    <label
      className={`account-payment-option ${selected ? "selected" : ""}`}
      onClick={() => onChange(method)}
    >
      <input
        type="radio"
        name="payment"
        value={method}
        checked={selected}
        onChange={() => onChange(method)}
      />
      <span className="account-payment-option-label">{label}</span>
      {detail && <span className="account-payment-option-detail">{detail}</span>}
    </label>
  );
}
