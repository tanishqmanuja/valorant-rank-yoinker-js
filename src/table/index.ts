import boxen from "boxen";
import chalk from "chalk";
import CliTable3, { Cell } from "cli-table3";
import stringWidth from "string-width";
import { match } from "ts-pattern";

import { ValorantApi } from "~/api";
import { EntityManager } from "~/entities/entity.manager";
import { LOGGER } from "~/logger";
import { inject } from "~/shared/dependencies";
import { QueueName, getQueueName } from "~/shared/luts/queue.lut";
import { ConfigService } from "~/shared/services/config.service";
import {
  type GameData,
  isInGameData,
  isMenuData,
  isPreGameData,
} from "~/shared/services/helpers/game-data";
import { PresenceService } from "~/shared/services/presence.service";
import { GlobalSpinner } from "~/shared/spinner";
import { ensureArray } from "~/utils/array";
import { GridStore } from "~/utils/grid-store";

import { colorizeGameState } from "./formatters/state.formatter";
import { EMPTY_ROW_ID, EMPTY_STRING } from "./helpers/string";
import { PluginManager } from "./plugin.manager";

const logger = LOGGER.forModule("Table");

export class Table {
  api = inject(ValorantApi);
  presenceService = inject(PresenceService);
  entityManager = inject(EntityManager);
  spinner = inject(GlobalSpinner);
  config = inject(ConfigService).config;

  pluginManager = new PluginManager(this);

  #data: GameData | null = null;

  // These store the internal state of the table
  // Will be manipulated using 'auto' plugins
  grid = new GridStore<string>();
  headers = new Map<string, string>();
  alignments = new Map<string, "left" | "center" | "right">();
  notes = new Map<string, string | string[]>();

  // These are the final rowIds and colIds that will be printed
  // Will be manipulated using 'post' plugins
  rowIds: string[] = [];
  colIds: string[] = [];

  async display(data: GameData) {
    this.spinner.start("Generating Table...");
    logger.info("Generating Table");

    this.clear();

    this.#data = data;
    await this.pluginManager.exec();
    this.print();
  }

  private print() {
    const table = this.getCliTable(this.colIds, this.rowIds);

    const tableStr = table.toString();
    const headerStr = boxen(this.title, {
      width: stringWidth(tableStr.split(/\s/)[0] ?? "") || this.title.length,
      textAlignment: "center",
      borderStyle: "none",
    });

    if (this.spinner.isSpinning) {
      this.spinner.stop();
    }

    console.log(headerStr);
    console.log(tableStr);
    process.stdout.write("\n");

    if (this.notes.size) {
      for (const [noteTitle, note] of this.notes) {
        const titleStr = chalk.gray.bold(" * ") + noteTitle;
        const titleWidth = stringWidth(titleStr);

        const subnotes = ensureArray(note).filter(Boolean);

        if (!subnotes.length) {
          continue;
        }

        console.log(titleStr + " " + subnotes[0]);
        for (let i = 1; i < subnotes.length; i++) {
          console.log(" ".repeat(titleWidth + 1) + subnotes[i]);
        }
      }
    }

    process.stdout.write("\n");
  }

  private clear() {
    this.#data = null;
    this.grid.clear();
    this.headers.clear();
    this.alignments.clear();
    this.notes.clear();
  }

  private getCliTable(colIds: string[], rowIds: string[]) {
    const table = new CliTable3({
      head: colIds.map(h => ({
        content: chalk.bold(this.headers.get(h) ?? h),
        hAlign: "center",
      })) as any[],
      chars: {
        "top-left": "╭",
        "top-right": "╮",
        "bottom-left": "╰",
        "bottom-right": "╯",
      },
      style: {
        compact: true,
        head: [],
      },
    });

    const rows: Cell[][] = [];

    const suitableAligment = (index: number, length: number) => {
      return match(index)
        .when(
          i => i === 0,
          () => "left" as const,
        )
        .when(
          i => i === length - 1,
          () => "right" as const,
        )
        .otherwise(() => "center" as const);
    };

    rowIds.forEach(rowId => {
      const row: Cell[] = [];
      if (rowId === EMPTY_ROW_ID) {
        rows.push(
          Array.from({ length: colIds.length }).map(() => {
            return { content: EMPTY_STRING };
          }),
        );
        return;
      }
      colIds.forEach((colId, i) => {
        const content = this.grid.getCell(rowId, colId) || EMPTY_STRING;
        row.push({
          content,
          hAlign:
            this.alignments.get(colId) || suitableAligment(i, colIds.length),
        });
      });
      rows.push(row);
    });

    rows.forEach(row => table.push(row.map(content => content)));

    return table;
  }

  get data() {
    if (!this.#data) {
      throw new Error("Data not initialized");
    }

    return this.#data;
  }

  get state() {
    if (!this.#data) {
      throw new Error("Cannot get state without data");
    }

    return this.#data?._state;
  }

  get title(): string {
    // Collect Data
    const t: Record<string, string> = {};

    t.state = colorizeGameState(this.state);

    if (!isMenuData(this.data)) {
      t.map = this.api.helpers.getMap(this.data.match.data.MapID).displayName;
      t.server =
        this.api.helpers.getServerName(this.data.match.data.GamePodID) ?? "";
    }

    if (isPreGameData(this.data)) {
      t.queue = getQueueName(this.data.match.data.QueueID);
      const team = this.data.match.data.AllyTeam?.TeamID;
      if (team) {
        t.team =
          team === "Blue" ? chalk.blue("//Defense") : chalk.red("//Attack");
      }
    }

    if (isInGameData(this.data)) {
      const presence = this.presenceService.snapshot.find(
        p => p.puuid === this.api.puuid,
      );

      if (presence) {
        t.queue = getQueueName(presence.private.queueId);
      }
      const team = this.data.match.data.Players.find(
        p => p.Subject === this.api.puuid,
      )?.TeamID;
      if (team) {
        t.team =
          team === "Blue" ? chalk.blue("//Defense") : chalk.red("//Attack");
      }
    }

    // Combine Data
    let tStr = "";

    t.map && (tStr += " " + t.map);
    t.queue && (tStr += " " + `(${t.queue})`);
    t.server && (tStr += " " + `[${t.server}]`);

    const TEAM_QUEUE_EXCLUSIONS: QueueName[] = ["Deathmatch"];
    const TEAM_MAP_EXCLUSIONS = ["The Range"];
    t.team &&
      !TEAM_QUEUE_EXCLUSIONS.includes(t.queue as QueueName) &&
      !TEAM_MAP_EXCLUSIONS.includes(t.map!) &&
      (tStr += " " + t.team);

    if (tStr.length > 0) {
      tStr = t.state + " - " + tStr.trim();
    } else {
      tStr = t.state;
    }

    return tStr;
  }
}
