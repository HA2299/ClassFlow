export type ResourceType = "summary" | "presentation" | "formula" | "link" | "notes";

export interface ResourceItem {
  id: string;
  title: string;
  description: string;
  type: ResourceType;
  tags: string[];
  url?: string | null;
  uploadedBy: string;
  createdAt: string;
}

export const resourceTypeLabels: Record<ResourceType, string> = {
  summary: "סיכום",
  presentation: "מצגת",
  formula: "נוסחאות",
  link: "קישור",
  notes: "הערות",
};

export const resourceTypeOptions: Array<{ label: string; value: ResourceType }> = [
  { label: "סיכום", value: "summary" },
  { label: "מצגת", value: "presentation" },
  { label: "נוסחאות", value: "formula" },
  { label: "קישור", value: "link" },
  { label: "הערות", value: "notes" },
];

export const defaultResources: ResourceItem[] = [
  {
    id: "r-1",
    title: "סיכום פרק 1 – פונקציות",
    description: "מושגי יסוד, תחום, טווח, סימטריה, ודרכי פתרון של שאלות מהירה.",
    type: "summary",
    tags: ["מתמטיקה", "פונקציות", "פרק 1"],
    uploadedBy: "מורה",
    createdAt: "2026-08-10T09:00:00.000Z",
  },
  {
    id: "r-2",
    title: "מצגת – מבוא לסטטיסטיקה",
    description: "הסבר קצר על ממוצע, חציון, סטיית תקן והסקה מהנתונים.",
    type: "presentation",
    tags: ["סטטיסטיקה", "ממוצע", "חציון"],
    url: "https://example.com/statistics-presentation",
    uploadedBy: "מורה",
    createdAt: "2026-08-11T10:30:00.000Z",
  },
  {
    id: "r-3",
    title: "נוסחאות חשבון לדף מהיר",
    description: "אוסף נוסחאות חיוניות לתרגול מהיר לפני מבחן.",
    type: "formula",
    tags: ["חשבון", "נוסחאות", "מבחן"],
    uploadedBy: "מורה",
    createdAt: "2026-08-12T12:00:00.000Z",
  },
  {
    id: "r-4",
    title: "קישור – תרגולים נוספים",
    description: "אתר עם תרגילים, סרטונים ובחינות לדוגמא.",
    type: "link",
    tags: ["תרגול", "משאבים", "אינטרנט"],
    url: "https://example.com/practice-bank",
    uploadedBy: "מורה",
    createdAt: "2026-08-13T08:15:00.000Z",
  },
];

export const resourceStorageKey = "classflow-resource-library";

export function loadResources(): ResourceItem[] {
  if (typeof window === "undefined") {
    return defaultResources;
  }

  try {
    const stored = window.localStorage.getItem(resourceStorageKey);
    if (!stored) return defaultResources;

    const parsed = JSON.parse(stored) as ResourceItem[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultResources;
  } catch {
    return defaultResources;
  }
}

export function saveResources(items: ResourceItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(resourceStorageKey, JSON.stringify(items));
}
