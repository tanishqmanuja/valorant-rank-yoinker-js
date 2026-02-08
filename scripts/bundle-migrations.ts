import crypto from "crypto";
import fs from "fs";

interface JournalEntry {
  idx: number; // Incremental index (0, 1, 2...)
  when: number; // Timestamp of creation
  tag: string; // The filename (e.g., "0000_init_db")
  breakpoints: boolean; // Whether the migration uses "--> statement-breakpoint"
}

interface DrizzleJournal {
  version: string;
  dialect: "sqlite" | "postgresql" | "mysql";
  entries: JournalEntry[];
}

const migrationsFolder = "./drizzle";
const journal: DrizzleJournal = JSON.parse(
  fs.readFileSync(`${migrationsFolder}/meta/_journal.json`, "utf8"),
);

const bundled = journal.entries.map(entry => {
  const sqlRaw = fs.readFileSync(
    `${migrationsFolder}/${entry.tag}.sql`,
    "utf8",
  );
  return {
    id: entry.idx,
    // Split by breakpoint just like the internal function
    sql: sqlRaw.split("--> statement-breakpoint"),
    hash: crypto.createHash("sha256").update(sqlRaw).digest("hex"),
    when: entry.when,
  };
});

fs.writeFileSync("./src/db/migrations-bundle.json", JSON.stringify(bundled));
