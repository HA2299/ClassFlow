"use client";

import { useMemo, useState } from "react";
import { addResourceAction, deleteResourceAction, type ResourceItem } from "@/app/actions/resources";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { resourceTypeLabels, resourceTypeOptions } from "@/lib/resources";

const initialForm = {
  title: "",
  description: "",
  type: "summary" as ResourceItem["type"],
  tags: "",
  url: "",
};

export function ResourceManager({
  initialItems,
  classes,
}: {
  initialItems: ResourceItem[];
  classes: Array<{ id: string; name: string }>;
}) {
  const [items, setItems] = useState<ResourceItem[]>(initialItems);
  const [form, setForm] = useState(initialForm);
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id ?? "");
  const [error, setError] = useState("");

  const stats = useMemo(() => {
    const totals = {
      all: items.length,
      summary: items.filter((item) => item.type === "summary").length,
      presentation: items.filter((item) => item.type === "presentation").length,
      formula: items.filter((item) => item.type === "formula").length,
      links: items.filter((item) => item.type === "link").length,
    };

    return totals;
  }, [items]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = form.title.trim();
    const description = form.description.trim();
    if (!title || !description) {
      setError("יש למלא כותרת ותיאור");
      return;
    }

    const fd = new FormData();
    fd.append("title", title);
    fd.append("description", description);
    fd.append("type", form.type);
    fd.append("tags", form.tags);
    fd.append("url", form.url);
    fd.append("classId", selectedClassId);

    const result = await addResourceAction(null, fd);
    if (result?.error) {
      setError(result.error);
      return;
    }

    setError("");
    setForm(initialForm);
    setItems((current) => [
      {
        id: `new-${Date.now()}`,
        title,
        description,
        type: form.type,
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        url: form.url.trim() || null,
        uploadedBy: "מורה",
        createdAt: new Date().toISOString(),
        classId: selectedClassId || null,
      },
      ...current,
    ]);
  };

  const removeItem = async (id: string) => {
    const success = await deleteResourceAction(id);
    if (!success) {
      setError("לא ניתן למחוק את החומר");
      return;
    }

    setItems((current) => current.filter((item) => item.id !== id));
    setError("");
  };

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card className="border-0 bg-white/80 p-5 shadow-[0_18px_35px_rgba(15,23,42,0.06)]">
          <p className="text-sm text-slate-500">סה״כ חומרים</p>
          <p className="mt-3 text-4xl font-black text-slate-900">{stats.all}</p>
        </Card>
        <Card className="border-0 bg-white/80 p-5 shadow-[0_18px_35px_rgba(15,23,42,0.06)]">
          <p className="text-sm text-slate-500">סיכומים</p>
          <p className="mt-3 text-4xl font-black text-slate-900">{stats.summary}</p>
        </Card>
        <Card className="border-0 bg-white/80 p-5 shadow-[0_18px_35px_rgba(15,23,42,0.06)]">
          <p className="text-sm text-slate-500">מצגות</p>
          <p className="mt-3 text-4xl font-black text-slate-900">{stats.presentation}</p>
        </Card>
        <Card className="border-0 bg-white/80 p-5 shadow-[0_18px_35px_rgba(15,23,42,0.06)]">
          <p className="text-sm text-slate-500">נוסחאות</p>
          <p className="mt-3 text-4xl font-black text-slate-900">{stats.formula}</p>
        </Card>
        <Card className="border-0 bg-white/80 p-5 shadow-[0_18px_35px_rgba(15,23,42,0.06)]">
          <p className="text-sm text-slate-500">קישורים</p>
          <p className="mt-3 text-4xl font-black text-slate-900">{stats.links}</p>
        </Card>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.25fr]">
        <Card className="border-0 bg-white/80 shadow-[0_18px_35px_rgba(15,23,42,0.06)]">
          <CardHeader>
            <CardTitle className="text-xl text-slate-900">העלאת חומר עזר</CardTitle>
            <CardDescription>הוסף סיכום, מצגת, נוסחאות או קישור שניתן לשתף עם הכיתה.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {classes.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">כיתה</label>
                  <select
                    value={selectedClassId}
                    onChange={(event) => setSelectedClassId(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  >
                    {classes.map((classItem) => (
                      <option key={classItem.id} value={classItem.id}>
                        {classItem.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">כותרת</label>
                <input
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  placeholder="למשל: סיכום בוחן מסכם"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">תיאור</label>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  rows={4}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  placeholder="תוכן המידע, דרישה לצפייה או הוראות שימוש"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">סוג</label>
                  <select
                    value={form.type}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, type: event.target.value as ResourceItem["type"] }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  >
                    {resourceTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">תגיות</label>
                  <input
                    value={form.tags}
                    onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))}
                    placeholder="מתמטיקה, בוחן, נוסחאות"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">קישור (אופציונלי)</label>
                <input
                  value={form.url}
                  onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))}
                  placeholder="https://example.com/material"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <Button type="submit" className="w-full">העלה חומר</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white/80 shadow-[0_18px_35px_rgba(15,23,42,0.06)]">
          <CardHeader>
            <CardTitle className="text-xl text-slate-900">חומרי עזר שהועלו</CardTitle>
            <CardDescription>רשימת משאבים פעילים שזמינים לתלמידים.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.length === 0 ? (
              <p className="text-sm text-slate-500">עדיין לא הועלו חומרים.</p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-[10px] font-semibold text-blue-700">
                        {resourceTypeLabels[item.type]}
                      </span>
                      <p className="font-semibold text-slate-900">{item.title}</p>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(item.id)}>
                      הסר
                    </Button>
                  </div>

                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</p>

                  {item.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.tags.map((tag) => (
                        <span key={`${item.id}-${tag}`} className="rounded-full bg-slate-200 px-2 py-1 text-[10px] font-medium text-slate-700">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex text-sm font-medium text-blue-700 underline underline-offset-2"
                    >
                      לפתוח קישור
                    </a>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
