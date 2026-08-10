import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2 } from "lucide-react";
import { searchConstitution, logConstitutionEvent, type ArticleMatch } from "@/lib/constitution";
import { markSearch } from "@/lib/constitutionProgress";
import ArticleResultCard from "./ArticleResultCard";

const examples = ["14", "समानता", "शिक्षण", "अस्पृश्यता", "स्वातंत्र्य", "धर्म", "education"];

const ConstitutionSearch = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ArticleMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const cache = useRef(new Map<string, ArticleMatch[]>());

  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) {
      setResults([]);
      setSearched(false);
      return;
    }
    let active = true;
    const t = setTimeout(async () => {
      const cached = cache.current.get(q);
      if (cached) {
        setResults(cached);
        setSearched(true);
        return;
      }
      setLoading(true);
      const r = await searchConstitution(q);
      if (!active) return;
      cache.current.set(q, r);
      setResults(r);
      setSearched(true);
      setLoading(false);
      markSearch();
      logConstitutionEvent({ event_type: "search", query_text: q, matched_count: r.length });
    }, 400);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [query]);

  return (
    <div>
      <div className="relative max-w-xl mx-auto mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-accent animate-spin" size={18} />
        )}
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="कलम क्रमांक, मराठी/इंग्रजी शब्द किंवा विषय शोधा"
          className="pl-10 pr-10 h-12"
          aria-label="संविधान शोध"
        />
      </div>

      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {examples.map((e) => (
          <Badge
            key={e}
            variant={query === e ? "default" : "secondary"}
            className="cursor-pointer text-xs py-1 px-3"
            onClick={() => setQuery(e)}
          >
            {e}
          </Badge>
        ))}
      </div>

      {searched && !loading && results.length === 0 && (
        <p className="text-center text-muted-foreground">
          या शब्दासाठी कोणतेही कलम सापडले नाही. दुसरा शब्द किंवा कलम क्रमांक वापरून पहा.
        </p>
      )}

      {results.length > 0 && (
        <>
          <p className="text-center text-sm text-muted-foreground mb-4">{results.length} कलमे सापडली</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {results.map((m) => (
              <ArticleResultCard key={m.article.id} match={m} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ConstitutionSearch;
