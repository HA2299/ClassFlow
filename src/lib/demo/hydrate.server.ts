import "server-only";

import fs from "fs";
import path from "path";
import { getStore, replaceStore } from "./store";
import { createSeedStore, type DemoStore } from "./seed";

const DATA_DIR = path.join(process.cwd(), ".demo");
const DATA_FILE = path.join(DATA_DIR, "store.json");

let hydrated = false;

function mergeWithSeed(partial: Partial<DemoStore>): DemoStore {
  const seed = createSeedStore();

  return {
    institutions: partial.institutions?.length
      ? partial.institutions
      : seed.institutions,
    profiles: partial.profiles?.length ? partial.profiles : seed.profiles,
    classes: partial.classes?.length ? partial.classes : seed.classes,
    students: partial.students?.length ? partial.students : seed.students,
    assignments: partial.assignments?.length
      ? partial.assignments
      : seed.assignments,
    submissions: partial.submissions?.length
      ? partial.submissions
      : seed.submissions,
    grades: partial.grades?.length ? partial.grades : seed.grades,
    riskFlags: partial.riskFlags?.length ? partial.riskFlags : seed.riskFlags,
    aiInsights: partial.aiInsights?.length ? partial.aiInsights : seed.aiInsights,
    passwords: {
      ...seed.passwords,
      ...(partial.passwords ?? {}),
    },
  };
}

function loadFromDisk(): DemoStore {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const parsed = JSON.parse(
        fs.readFileSync(DATA_FILE, "utf-8")
      ) as DemoStore;
      return mergeWithSeed(parsed);
    }
  } catch {
    // corrupted file — fall back to seed
  }

  return createSeedStore();
}

export function ensureDemoStoreHydrated(): void {
  if (hydrated) {
    return;
  }

  replaceStore(loadFromDisk());
  hydrated = true;
}

export function saveDemoStore(): void {
  ensureDemoStoreHydrated();
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(getStore(), null, 2), "utf-8");
}
