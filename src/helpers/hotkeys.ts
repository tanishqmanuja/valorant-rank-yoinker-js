/* NOTE: THIS MODULE CONTAINS SIDE EFFECTS */
import chalk from "chalk";
import TerminalEvents from "tty-events";

import { TAGS } from "./tags";

export const enableHotkeys = (refreshFn: () => void) => {
  if (process.stdin.isTTY) process.stdin.setRawMode(true);

  const term = new TerminalEvents(process.stdin, process.stdout, {
    timeout: 500,
    encoding: "utf-8",
  });

  term.on("keypress", key => {
    if (key.ctrl && key.name == "c") {
      process.exit(0);
    }

    if (key.ctrl && key.name == "x") {
      process.exit(0);
    }

    if (key.ctrl && key.name == "r") {
      console.log(
        TAGS.vryjs,
        chalk.gray`Table Refresh Requested (might take upto 15 secs)\n`,
      );
      refreshFn();
    }
  });
};
