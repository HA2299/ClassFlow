"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { resourceTypeLabels, resourceTypeOptions, type ResourceItem } from "@/lib/resources";

export function ResourceBrowser({ initialItems }: { initialItems: ResourceItem[] }) {
  const [items] = useState<ResourceItem[]>(initialItems);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("all");

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesType = selectedType === "all" || item.type === selectedType;
      const haystack = `${item.title} ${item.description} ${item.tags.join(" ")}`.toLowerCase();
      const matchesSearch = haystack.includes(search.trim().toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [items, search, selectedType]);

  const allTags = useMemo(
    () => Array.from(new Set(items.flatMap((item) => item.tags))).slice(0, 12),
    [items]
  );

  return (
    <div className="space-y-6">
      <Card className="border-0 bg-white/80 shadow-[0_18px_35px_rgba(15,23,42,0.06)]">
        <CardHeader>
          <CardTitle className="text-xl text-slate-900">מרכז חומרי עזר</CardTitle>
          <CardDescription>סיכומים, מצגות, נוסחאות וקישורים שימושיים לכל הכיתה.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="חפשו לפי נושא, קטע או תגית"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />

            <select
              value={selectedType}
              onChange={(event) => setSelectedType(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              <option value="all">כל הסוגים</option>
              {resourceTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <Button
                  key={tag}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSearch(tag)}
                >
                  #{tag}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <Card key={item.id} className="border-0 bg-white/80 shadow-[0_18px_35px_rgba(15,23,42,0.06)]">
              <CardContent className="space-y-3 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-semibold text-blue-700">
                      {resourceTypeLabels[item.type]}
                    </span>
                    <p className="text-lg font-bold text-slate-900">{item.title}</p>
                  </div>
                  <span className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleDateString("he-IL")}</span>
                </div>

                <p className="text-sm leading-relaxed text-slate-600">{item.description}</p>

                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <span key={`${item.id}-${tag}`} className="rounded-full bg-slate-200 px-2 py-1 text-[10px] font-medium text-slate-700">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {item.url ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                  >
                    פתח חומר
                  </a>
                ) : (
                  <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700">
                    חומר זמין בתוך המערכת
                  </span>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="border-dashed border-slate-300 bg-white/80">
            <CardContent className="flex min-h-40 items-center justify-center text-center">
              <div>
                <p className="text-lg font-semibold text-slate-700">לא נמצאו חומרי עזר</p>
                <p className="mt-2 text-sm text-slate-500">נסו לשנות את החיפוש או לבחור סוג אחר.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
