"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { MagnifyingGlass, X } from "@phosphor-icons/react";

export function SearchBar({ basePath }: { basePath: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (query) {
      params.set("q", query);
    } else {
      params.delete("q");
    }
    params.delete("page");
    router.push(`${basePath}?${params.toString()}`);
  }

  function handleClear() {
    setQuery("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    params.delete("page");
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 16px",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 999,
        color: "var(--text-dim)",
        flex: 1,
        maxWidth: 360,
        transition: "border-color 0.3s ease",
      }}
    >
      <MagnifyingGlass size={16} weight="bold" />
      <input
        type="text"
        placeholder="搜索..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          background: "none",
          border: "none",
          color: "var(--text-hi)",
          fontFamily: "var(--font-body)",
          fontSize: "0.9rem",
          outline: "none",
          width: "100%",
        }}
      />
      {query && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="清除搜索"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-dim)",
            padding: 2,
            display: "flex",
            alignItems: "center",
          }}
        >
          <X size={14} weight="bold" />
        </button>
      )}
    </form>
  );
}
