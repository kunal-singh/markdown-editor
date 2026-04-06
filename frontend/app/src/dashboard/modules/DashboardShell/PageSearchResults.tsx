import DOMPurify from "dompurify";
import { useNavigate } from "react-router-dom";
import type { PageSearchResult } from "@markdown-editor/domain";

// Allow only <mark> — the one tag the server puts in excerpts for highlights.
const EXCERPT_PURIFY_CONFIG = { ALLOWED_TAGS: ["mark"], ALLOWED_ATTR: [] as string[] };

interface PageSearchResultsProps {
  results: PageSearchResult[];
  query: string;
  isSearching: boolean;
  onSelect: () => void;
}

function truncateExcerpt(html: string, maxTextLen: number): string {
  const text = html.replace(/<[^>]+>/g, "");
  if (text.length <= maxTextLen) return html;
  // Walk char by char tracking plain-text length, preserve tags
  let textLen = 0;
  let i = 0;
  while (i < html.length && textLen < maxTextLen) {
    if (html[i] === "<") {
      while (i < html.length && html[i] !== ">") i++;
    } else {
      textLen++;
    }
    i++;
  }
  return html.slice(0, i) + "…";
}

function truncateTitle(title: string): string {
  return title.length > 30 ? title.slice(0, 30) + "…" : title;
}

export function PageSearchResults({
  results,
  query,
  isSearching,
  onSelect,
}: PageSearchResultsProps) {
  const navigate = useNavigate();

  if (!query.trim()) return null;

  return (
    <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-[300px] overflow-y-auto rounded-md border bg-popover shadow-md">
      {isSearching && <p className="px-3 py-2 text-xs text-muted-foreground">Searching…</p>}
      {!isSearching && results.length === 0 && (
        <p className="px-3 py-2 text-xs text-muted-foreground">No results found.</p>
      )}
      {!isSearching && results.length > 0 && (
        <ul>
          {results.map((r) => (
            <li key={r.slug}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-accent focus:bg-accent focus:outline-none"
                onClick={() => {
                  void navigate(`/dashboard/pages/${r.slug}`);
                  onSelect();
                }}
              >
                <p className="text-sm font-medium">{truncateTitle(r.title)}</p>
                <p
                  className="text-xs text-muted-foreground mt-0.5 [&_mark]:bg-yellow-200 [&_mark]:rounded-sm"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(
                      truncateExcerpt(r.excerpt, 20),
                      EXCERPT_PURIFY_CONFIG,
                    ),
                  }}
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
