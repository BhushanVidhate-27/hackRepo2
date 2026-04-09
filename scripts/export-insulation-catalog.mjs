import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { INSULATION_CATALOG_META, INSULATION_MODES } from "../src/lib/insulationCatalog.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "public", "config");
const outFile = join(outDir, "insulation-catalog.v1.json");

mkdirSync(outDir, { recursive: true });

const payload = {
  meta: INSULATION_CATALOG_META,
  modes: INSULATION_MODES,
};

writeFileSync(outFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`Wrote ${outFile}`);
