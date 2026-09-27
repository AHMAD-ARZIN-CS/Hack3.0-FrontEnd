"use client";

import { Search, X } from "lucide-react";
import { useState } from "react";

/**
 * Controlled-on-submit search box. Calls onSearch when the user submits or clears.
 * Parent passes a `key` tied to the committed value if it needs to reset the text.
 */
export function SearchBar({
  initialValue = "",
  placeholder,
  label,
  onSearch,
}: {
  initialValue?: string;
  placeholder: string;
  label: string;
  onSearch: (value: string) => void;
}) {
  const [value, setValue] = useState(initialValue);
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(value.trim());
      }}
      className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 focus-within:ring-2 focus-within:ring-brand"
    >
      <Search aria-hidden className="size-5 shrink-0 text-ink-soft" />
      <label className="sr-only" htmlFor="search-input">
        {label}
      </label>
      <input
        id="search-input"
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="min-h-12 w-full bg-transparent text-base outline-none placeholder:text-ink-soft"
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            setValue("");
            onSearch("");
          }}
          className="flex size-9 items-center justify-center rounded-full hover:bg-muted"
        >
          <X aria-hidden className="size-4" />
        </button>
      )}
    </form>
  );
}
