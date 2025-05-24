// import { sql } from "drizzle-orm";
import chalk from "chalk";

import { interpolateColor } from "./table/plugins/player-winrate.plugin";

// import { db } from "./db";
// import { statements } from "./db/migrations";
// import { recentMatches } from "./db/schema";

// const rows = await db
//   .run(
//     `SELECT COUNT(*) as count FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'`,
//   )
//   .then(res => res.rows[0]?.count);

// if (!rows) {
//   for (const migration of statements) {
//     await db.run(migration);
//   }
// }

// async function record(id: string) {
//   return db.transaction(async tx => {
//     const result = await tx
//       .insert(recentMatches)
//       .values({ id })
//       .onConflictDoNothing();

//     const { count } = await tx.get<{ count: number }>(
//       sql`SELECT COUNT(*) as count FROM ${recentMatches}`,
//     );

//     if (count > 3) {
//       const oldest = await tx.get<{ rowid: number }>(
//         sql`SELECT rowid FROM ${recentMatches} ORDER BY rowid ASC LIMIT 1`,
//       );
//       if (oldest) {
//         await tx.run(
//           sql`DELETE FROM ${recentMatches} WHERE rowid = ${oldest.rowid}`,
//         );
//       }
//     }

//     return result.rowsAffected === 1;
//   });
// }

// await record("test");
// await record("test2");
// await record("test3");
// await record("test5");
// await record("test5");
// await record("test5");

const enemyWinRate = getRatio(1, 2);

console.log(
  `Enemy Record(${chalk.hex(getInterpolatedColor(enemyWinRate))((enemyWinRate * 100).toFixed(0) + "%")}): `,
);

function getRatio(num: number, denom: number): number {
  if (denom === 0) return 0;
  const res = num / denom;
  if (isNaN(res)) return 0;
  return res;
}

function getInterpolatedColor(input: number): string {
  if (input < 0 || input > 1) {
    throw new Error("Input should be between 0 and 1");
  }
  // Define color range
  const colorRange = ["#db4a5c", "#fcffb5", "#c1fda9"];
  // Interpolate color
  const color = input * (colorRange.length - 1);
  const lowerColor = colorRange[Math.floor(color)]!;
  const upperColor = colorRange[Math.ceil(color)]!;
  const interpolation = color - Math.floor(color);
  return interpolateColor(lowerColor, upperColor, interpolation);
}
