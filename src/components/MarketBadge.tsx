"use client";
import { useMarketPrice } from "@/lib/market";

type Props = {
  name: string;
  // If true, fetch on mount. Otherwise show a "💎" button that fetches on click.
  eager?: boolean;
  className?: string;
};

export default function MarketBadge({ name, eager = false, className }: Props) {
  const { data, loading, tried, error, load } = useMarketPrice(name, eager);

  if (data) {
    const isPrime = data.slug.endsWith("_prime_set");
    return (
      <a
        href={`https://warframe.market/items/${data.slug}`}
        target="_blank"
        rel="noopener"
        onClick={(e) => e.stopPropagation()}
        title={`min ${data.stats.min}p · max ${data.stats.max}p · vol ${data.stats.volume ?? "?"}`}
        className={`inline-flex items-center gap-1 text-[10px] px-1.5 rounded border border-accent-2/40 bg-accent-2/10 text-accent-2 hover:bg-accent-2/20 ${className ?? ""}`}
      >
        <span className="font-mono">{data.stats.median}p</span>
        {isPrime && <span className="text-[9px] tracking-wider">PRIME</span>}
      </a>
    );
  }

  if (loading) {
    return (
      <span className={`text-[10px] text-muted/50 ${className ?? ""}`}>…</span>
    );
  }

  if (tried) {
    return (
      <span
        title={error ?? "pas de match warframe.market"}
        className={`text-[10px] text-muted/40 px-1 ${className ?? ""}`}
      >
        —
      </span>
    );
  }

  if (eager) return null;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        load();
      }}
      title="Voir le prix warframe.market"
      className={`text-[10px] text-muted/40 hover:text-accent-2 px-1 rounded transition ${className ?? ""}`}
    >
      ◇
    </button>
  );
}
