"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
}

interface Props {
  /** Name of the filter, shown on the button while nothing is chosen. */
  label: string;
  options: Option[];
  value: string;
  /** The value that means "no filter"; the button looks inactive while it is selected. */
  defaultValue: string;
  onChange: (value: string) => void;
  align?: "start" | "end";
}

/** A pill button that opens a single-choice menu. */
export function FilterMenu({ label, options, value, defaultValue, onChange, align = "start" }: Props) {
  const active = value !== defaultValue;
  const current = options.find((o) => o.value === value);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        className={cn(
          "group flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-[0.95rem] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:ring-offset-2 focus-visible:ring-offset-amber-50",
          active ? "border-amber-950 bg-amber-950 text-amber-50" : "border-amber-300 bg-amber-100 text-amber-950 hover:border-amber-950",
        )}
      >
        <span className={cn(!active && "text-amber-600")}>{label}</span>
        {active && <span className="font-medium">{current?.label}</span>}
        <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" aria-hidden="true" />
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align={align}
          sideOffset={8}
          className="menu-pop z-50 min-w-[14rem] rounded-2xl border border-amber-200 bg-amber-100 p-1.5 shadow-[0_1px_2px_rgb(44_40_37/0.04),0_16px_40px_-12px_rgb(44_40_37/0.25)]"
        >
          <DropdownMenu.RadioGroup value={value} onValueChange={onChange}>
            {options.map((option) => (
              <DropdownMenu.RadioItem
                key={option.value}
                value={option.value}
                className="flex h-11 cursor-pointer select-none items-center justify-between gap-6 rounded-xl px-3 text-[0.95rem] text-amber-950 outline-none data-[highlighted]:bg-amber-100 data-[state=checked]:font-medium"
              >
                {option.label}
                <DropdownMenu.ItemIndicator>
                  <Check className="h-4 w-4 text-amber-700" aria-hidden="true" />
                </DropdownMenu.ItemIndicator>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
