"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowUpRight, FileUp, Link2, Sparkles, Trash2 } from "lucide-react";
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    setError("");
    setIsSubmitting(true);
    const fd = new FormData();
    fd.append("title", title);
    fd.append("description", description);
    fd.append("type", form.type);
    fd.append("tags", form.tags);
    fd.append("url", form.url);
    fd.append("classId", selectedClassId);
    if (selectedFile) fd.append("file", selectedFile);

    try {
      const result = await addResourceAction(null, fd);
      if (result?.error) {
        setError(result.error);
        return;
      }

      setForm(initialForm);
      setSelectedFile(null);
      setItems((current) => [
        {
          id: `new-${Date.now()}`,
          title,
          description,
          type: form.type,
          tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
          url: result.url ?? (form.url.trim() || null),
          fileName: result.fileName,
          filePath: result.filePath,
          uploadedBy: "מורה",
          createdAt: new Date().toISOString(),
          classId: selectedClassId || null,
        },
        ...current,
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const chooseFile = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      setError("גודל הקובץ המרבי הוא 20MB");
      return;
    }
    setSelectedFile(file);
    setError("");
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
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Card className="border-0 bg-slate-950 p-5 text-white shadow-[0_20px_45px_rgba(15,23,42,0.18)] sm:col-span-2 xl:col-span-1">
          <div className="flex items-center justify-between"><p className="text-sm text-slate-300">סה״כ חומרים</p><Sparkles className="size-4 text-cyan-300" /></div>
          <p className="mt-3 text-4xl font-black">{stats.all}</p>
        </Card>
        <Card className="border-0 bg-white/75 p-5 shadow-[0_18px_35px_rgba(15,23,42,0.06)]">
          <p className="text-sm text-slate-500">סיכומים</p>
          <p className="mt-3 text-4xl font-black text-slate-900">{stats.summary}</p>
        </Card>
        <Card className="border-0 bg-white/75 p-5 shadow-[0_18px_35px_rgba(15,23,42,0.06)]">
          <p className="text-sm text-slate-500">מצגות</p>
          <p className="mt-3 text-4xl font-black text-slate-900">{stats.presentation}</p>
        </Card>
        <Card className="border-0 bg-white/75 p-5 shadow-[0_18px_35px_rgba(15,23,42,0.06)]">
          <p className="text-sm text-slate-500">נוסחאות</p>
          <p className="mt-3 text-4xl font-black text-slate-900">{stats.formula}</p>
        </Card>
        <Card className="border-0 bg-white/75 p-5 shadow-[0_18px_35px_rgba(15,23,42,0.06)]">
          <p className="text-sm text-slate-500">קישורים</p>
          <p className="mt-3 text-4xl font-black text-slate-900">{stats.links}</p>
        </Card>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.25fr]">
        <Card className="border-0 bg-white/80 shadow-[0_22px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
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

              <div
                className={`relative rounded-[1.5rem] border-2 border-dashed p-5 transition ${isDragging ? "border-cyan-500 bg-cyan-50" : "border-slate-200 bg-slate-50/80 hover:border-cyan-400 hover:bg-cyan-50/40"}`}
                onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(event) => { event.preventDefault(); setIsDragging(false); chooseFile(event.dataTransfer.files[0]); }}
              >
                <input ref={fileInputRef} type="file" className="sr-only" onChange={(event) => chooseFile(event.target.files?.[0])} accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.png,.jpg,.jpeg" />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex w-full items-center gap-4 text-right">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-cyan-300 shadow-lg"><FileUp className="size-5" /></span>
                  <span className="min-w-0"><span className="block font-bold text-slate-900">{selectedFile ? selectedFile.name : "גררו קובץ לכאן או בחרו מהמחשב"}</span><span className="mt-1 block text-xs text-slate-500">PDF, Word, PowerPoint, Excel או תמונה · עד 20MB</span></span>
                </button>
                {selectedFile && <button type="button" onClick={() => setSelectedFile(null)} className="absolute left-3 top-3 text-xs font-semibold text-slate-500 hover:text-red-600">הסר</button>}
              </div>

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

              {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}

              <Button type="submit" disabled={isSubmitting} className="w-full"><FileUp className="size-4" />{isSubmitting ? "מעלה..." : "העלה חומר"}</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white/80 shadow-[0_22px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
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
                  className="group rounded-[1.5rem] border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/80 p-5 transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-lg"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-cyan-100 px-2.5 py-1 text-[10px] font-bold text-cyan-800">
                        {resourceTypeLabels[item.type]}
                      </span>
                      <p className="font-semibold text-slate-900">{item.title}</p>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(item.id)} aria-label="הסר חומר">
                      <Trash2 className="size-4" />
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
                      download={item.fileName || undefined}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700"
                    >
                      {item.fileName ? <FileUp className="size-4" /> : <Link2 className="size-4" />} {item.fileName || "פתח קישור"} <ArrowUpRight className="size-3" />
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
