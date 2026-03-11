"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateKitType } from "@/lib/actions/customer.actions";

interface KitTypeToggleProps {
  kitId: string;
  currentType: string;
  disabled?: boolean;
}

const options = [
  {
    value: "DIGITAL" as const,
    label: "Digital Kit",
    desc: "Print your own shipping label",
  },
  {
    value: "PHYSICAL" as const,
    label: "Physical Kit",
    desc: "We mail you a kit box + prepaid label",
  },
];

export default function KitTypeToggle({ kitId, currentType, disabled = false }: KitTypeToggleProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState(currentType);

  const handleToggle = (type: "PHYSICAL" | "DIGITAL") => {
    if (type === selected || isPending || disabled) return;

    setSelected(type);
    startTransition(async () => {
      const result = await updateKitType(kitId, type);
      if (result.success) {
        router.refresh();
      } else {
        setSelected(currentType);
      }
    });
  };

  return (
    <div style={{
      display: "flex",
      gap: 10,
      opacity: isPending || disabled ? 0.6 : 1,
      transition: "opacity 0.2s",
    }}>
      {options.map((opt) => {
        const isSelected = selected === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleToggle(opt.value)}
            disabled={isPending || disabled}
            style={{
              flex: 1,
              padding: "14px 16px",
              borderRadius: 8,
              border: isSelected ? "2px solid #AD7B2A" : "2px solid #E5E5E5",
              background: isSelected ? "#FBF7EF" : "#FFFFFF",
              cursor: disabled ? "default" : isPending ? "wait" : "pointer",
              transition: "all 0.2s",
              textAlign: "center",
            }}
          >
            <div style={{
              fontSize: 15,
              fontWeight: 600,
              color: isSelected ? "#AD7B2A" : "#2E1F0C",
              marginBottom: 4,
            }}>
              {opt.label}
            </div>
            <div style={{
              fontSize: 12,
              color: isSelected ? "#AD7B2A" : "#6B7280",
              lineHeight: 1.3,
            }}>
              {opt.desc}
            </div>
          </button>
        );
      })}
    </div>
  );
}
