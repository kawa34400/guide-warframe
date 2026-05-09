// Shared catalog of all checklistable items, used by Search palette, Team view, and stats.
import construction from "@/data/construction.json";
import incarnonData from "@/data/incarnon.json";

export type CatalogItem = {
  id: string;
  label: string;
  page: string; // route to navigate to
  ns: "construction" | "incarnon" | "warframes";
};

type Pair = {
  resource: { name: string; source: string | null } | null;
  built: { name: string; source: string | null } | null;
};

export function buildCatalog(): Record<
  "construction" | "incarnon" | "warframes",
  CatalogItem[]
> {
  const items: ReturnType<typeof buildCatalog> = {
    construction: [],
    incarnon: [],
    warframes: [],
  };

  for (const [section, pairs] of Object.entries(
    construction as Record<string, Pair[]>,
  )) {
    pairs.forEach((p, i) => {
      if (p.resource)
        items.construction.push({
          id: `${section}:res:${p.resource.name}:${i}`,
          label: `[${section}] ${p.resource.name}`,
          page: "/construction",
          ns: "construction",
        });
      if (p.built)
        items.construction.push({
          id: `${section}:built:${p.built.name}:${i}`,
          label: `[${section}] ${p.built.name} (craft)`,
          page: "/construction",
          ns: "construction",
        });
    });
  }

  const inc = incarnonData as {
    evolutions: string[];
    evolutionsZariman: string[];
    incarnonRotation: Record<string, string[]>;
    warframeRotation: Record<string, string[]>;
  };

  for (const [w, list] of Object.entries(inc.incarnonRotation))
    for (const n of list)
      items.incarnon.push({
        id: `rot:${w}:${n}`,
        label: `S${w} — ${n}`,
        page: "/incarnon",
        ns: "incarnon",
      });
  for (const n of inc.evolutions)
    items.incarnon.push({
      id: `evo:${n}`,
      label: `Évo — ${n}`,
      page: "/incarnon",
      ns: "incarnon",
    });
  for (const n of inc.evolutionsZariman)
    items.incarnon.push({
      id: `zariman:${n}`,
      label: `Zariman — ${n}`,
      page: "/incarnon",
      ns: "incarnon",
    });

  for (const [w, list] of Object.entries(inc.warframeRotation))
    for (const n of list)
      items.warframes.push({
        id: `wf:${n}`,
        label: `S${w} — ${n}`,
        page: "/warframes",
        ns: "warframes",
      });

  return items;
}

export function flatCatalog(): CatalogItem[] {
  const c = buildCatalog();
  return [...c.construction, ...c.incarnon, ...c.warframes];
}
