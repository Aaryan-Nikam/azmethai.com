"use client";

import React, { useState } from "react";
import type { AzmethNodeProperty, AzmethNodePropertyDisplayOptions } from "@/lib/workflow/types";

// ── displayOptions evaluation ─────────────────────────────────────────────

export function shouldDisplayProperty(
  displayOptions: AzmethNodePropertyDisplayOptions | undefined,
  currentValues: Record<string, any>
): boolean {
  if (!displayOptions) return true;

  if (displayOptions.show) {
    for (const [key, allowedValues] of Object.entries(displayOptions.show)) {
      const current = currentValues[key];
      if (!allowedValues.some(v => String(v) === String(current))) return false;
    }
  }

  if (displayOptions.hide) {
    for (const [key, hiddenValues] of Object.entries(displayOptions.hide)) {
      const current = currentValues[key];
      if (hiddenValues.some(v => String(v) === String(current))) return false;
    }
  }

  return true;
}

// ── Individual Field Components ───────────────────────────────────────────

const inputBase =
  "w-full bg-[var(--bg-root)] border border-[var(--border-subtle)] rounded-lg px-3 py-2.5 text-[13px] text-[var(--text-main)] focus:border-[var(--accent-main)]/50 focus:ring-1 outline-none transition-all placeholder:text-[var(--text-muted)]/50 font-mono";

interface FieldProps {
  property: AzmethNodeProperty;
  value: any;
  onChange: (name: string, value: any) => void;
}

function StringField({ property, value, onChange }: FieldProps) {
  return (
    <input
      type="text"
      value={value ?? property.default ?? ""}
      onChange={(e) => onChange(property.name, e.target.value)}
      placeholder={property.placeholder}
      className={inputBase}
    />
  );
}

function NumberField({ property, value, onChange }: FieldProps) {
  return (
    <input
      type="number"
      value={value ?? property.default ?? 0}
      onChange={(e) => onChange(property.name, Number(e.target.value))}
      placeholder={property.placeholder}
      className={inputBase}
    />
  );
}

function BooleanField({ property, value, onChange }: FieldProps) {
  const checked = value ?? property.default ?? false;
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(property.name, !checked)}
        className={`relative w-11 h-6 rounded-full transition-all ${
          checked ? "bg-[var(--accent-main)]" : "bg-[var(--border-strong)]"
        }`}
      >
        <div
          className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-all ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
      <span className="text-[12px] text-[var(--text-muted)] font-medium">
        {checked ? "Enabled" : "Disabled"}
      </span>
    </div>
  );
}

function OptionsField({ property, value, onChange }: FieldProps) {
  return (
    <select
      value={value ?? property.default ?? ""}
      onChange={(e) => onChange(property.name, e.target.value)}
      className={`${inputBase} cursor-pointer`}
    >
      {(property.options || []).map((opt) => (
        <option key={String(opt.value)} value={String(opt.value)}>
          {opt.name}
        </option>
      ))}
    </select>
  );
}

function MultiOptionsField({ property, value, onChange }: FieldProps) {
  const selected: string[] = value ?? property.default ?? [];
  const toggle = (v: string) => {
    const next = selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v];
    onChange(property.name, next);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {(property.options || []).map((opt) => {
        const active = selected.includes(String(opt.value));
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => toggle(String(opt.value))}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all border ${
              active
                ? "bg-[var(--accent-main)]/15 border-[var(--accent-main)]/40 text-[var(--accent-main)]"
                : "bg-[var(--bg-root)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }`}
          >
            {opt.name}
          </button>
        );
      })}
    </div>
  );
}

function JsonField({ property, value, onChange }: FieldProps) {
  return (
    <textarea
      value={value ?? property.default ?? ""}
      onChange={(e) => onChange(property.name, e.target.value)}
      placeholder={property.placeholder ?? "{{ $json }}"}
      rows={4}
      className={`${inputBase} resize-y custom-scrollbar`}
    />
  );
}

function CollectionField({ property, value, onChange }: FieldProps) {
  const [open, setOpen] = useState(false);
  const currentVal = value ?? {};

  return (
    <div className="border border-[var(--border-subtle)] rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-3 py-2.5 flex items-center justify-between text-[12px] font-bold text-[var(--text-main)] bg-[var(--bg-surface-hover)] hover:bg-[var(--bg-root)] transition-colors"
      >
        <span className="text-[var(--text-muted)]">
          {Object.keys(currentVal).length} field(s) configured
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="p-3 space-y-3 bg-[var(--bg-root)] border-t border-[var(--border-subtle)]">
          {(property.options || []).map((subProp: any) => (
            <div key={subProp.name}>
              <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">{subProp.displayName || subProp.name}</label>
              <input
                type="text"
                value={currentVal[subProp.name] ?? ""}
                onChange={(e) =>
                  onChange(property.name, { ...currentVal, [subProp.name]: e.target.value })
                }
                className={inputBase}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DateTimeField({ property, value, onChange }: FieldProps) {
  return (
    <input
      type="datetime-local"
      value={value ?? property.default ?? ""}
      onChange={(e) => onChange(property.name, e.target.value)}
      className={inputBase}
    />
  );
}

function ColorField({ property, value, onChange }: FieldProps) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={value ?? property.default ?? "#6366f1"}
        onChange={(e) => onChange(property.name, e.target.value)}
        className="w-10 h-10 rounded-lg border border-[var(--border-subtle)] cursor-pointer bg-transparent"
      />
      <input
        type="text"
        value={value ?? property.default ?? ""}
        onChange={(e) => onChange(property.name, e.target.value)}
        className={`${inputBase} flex-1`}
        placeholder="#6366f1"
      />
    </div>
  );
}

function NoticeField({ property }: FieldProps) {
  return (
    <div className="flex gap-2.5 p-3 bg-[var(--bg-root)] border border-[var(--border-subtle)] rounded-lg text-[12px] text-[var(--text-muted)] leading-relaxed">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--accent-main)] shrink-0 mt-0.5">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span>{property.description || property.displayName}</span>
    </div>
  );
}

function ResourceLocatorField({ property, value, onChange }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <input
        type="text"
        value={value?.value ?? ""}
        onChange={(e) => onChange(property.name, { mode: "id", value: e.target.value })}
        placeholder={property.placeholder ?? "Enter ID or URL..."}
        className={inputBase}
      />
      <p className="text-[10px] text-[var(--text-muted)]">Enter the resource ID or URL directly.</p>
    </div>
  );
}

function HiddenField() {
  return null;
}

function FallbackField({ property, value, onChange }: FieldProps) {
  return (
    <div className="space-y-1">
      <input
        type="text"
        value={typeof value === "string" ? value : JSON.stringify(value ?? "")}
        onChange={(e) => onChange(property.name, e.target.value)}
        placeholder={property.placeholder}
        className={`${inputBase} opacity-80`}
      />
      <p className="text-[10px] text-amber-500/70 font-mono">[{property.originalType || property.type} field — basic input fallback]</p>
    </div>
  );
}

// ── Field Type Registry ───────────────────────────────────────────────────

const FIELD_COMPONENTS: Record<string, React.ComponentType<FieldProps>> = {
  string: StringField,
  number: NumberField,
  boolean: BooleanField,
  options: OptionsField,
  multiOptions: MultiOptionsField,
  collection: CollectionField,
  fixedCollection: CollectionField,
  json: JsonField,
  dateTime: DateTimeField,
  color: ColorField,
  notice: NoticeField,
  hidden: HiddenField,
  credentialsSelect: OptionsField,
  resourceLocator: ResourceLocatorField,
  resourceMapper: JsonField,
  filter: JsonField,
};

export function renderField(property: AzmethNodeProperty, value: any, onChange: (name: string, value: any) => void): React.ReactNode {
  const Component = FIELD_COMPONENTS[property.type] ?? FallbackField;
  return <Component property={property} value={value} onChange={onChange} />;
}

// ── Main NodePropertiesPanelV2 ────────────────────────────────────────────

interface NodePropertiesPanelV2Props {
  nodeId: string;
  schema: AzmethNodeProperty[];
  data: Record<string, any>;
  onChange: (key: string, value: any) => void;
}

export function NodePropertiesPanelV2({ nodeId, schema, data, onChange }: NodePropertiesPanelV2Props) {
  if (!schema?.length) {
    return (
      <p className="text-[12px] text-[var(--text-muted)] italic">No configurable parameters for this node.</p>
    );
  }

  return (
    <div className="space-y-5">
      {schema.map((prop) => {
        if (!shouldDisplayProperty(prop.displayOptions, data)) return null;
        if (prop.type === "hidden") return null;

        return (
          <div key={prop.name}>
            <div className="flex items-baseline justify-between mb-1.5">
              <label className="text-[12px] font-bold text-[var(--text-main)] flex items-center gap-1.5">
                {prop.displayName || prop.name}
                {prop.required && <span className="text-rose-500 text-[10px]">*</span>}
              </label>
            </div>
            {prop.hint && <p className="text-[11px] text-[var(--text-muted)] mb-1.5 leading-relaxed">{prop.hint}</p>}

            {renderField(prop, data[prop.name], onChange)}

            {prop.description && prop.type !== "notice" && (
              <p className="text-[11px] text-[var(--text-muted)] mt-1.5 leading-relaxed">{prop.description}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
