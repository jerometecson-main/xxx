"use client";
import { useState } from "react";

interface Result {
  title: string;
  url: string;
  description: string;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setResults([]);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: query }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  function getDomain(url: string) {
    try {
      return new URL(url).hostname.replace("www.", "");
    } catch {
      return url;
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-10 font-sans">
      <h1 className="text-xl font-semibold mb-6">Search</h1>

      <div className="flex gap-2 mb-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search anything..."
          className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
        />
        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="px-4 py-2 bg-black text-white text-sm rounded-md disabled:opacity-40 hover:bg-gray-800 transition-colors"
        >
          {loading ? "..." : "Search"}
        </button>
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {loading && <p className="text-gray-400 text-sm">Searching...</p>}

      <div className="flex flex-col gap-5">
        {results.map((r, i) => (
          <div key={i} className="border-b border-gray-100 pb-5">
            <p className="text-xs text-gray-400 mb-1">{getDomain(r.url)}</p>
            <a
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm font-medium block mb-1"
            >
              {r.title}
            </a>
            {r.description && (
              <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed">
                {r.description}
              </p>
            )}
          </div>
        ))}
      </div>

      {!loading && results.length === 0 && query && !error && (
        <p className="text-gray-400 text-sm">No results found.</p>
      )}
    </main>
  );
}
