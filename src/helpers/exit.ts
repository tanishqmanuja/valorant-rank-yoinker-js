/* NOTE: THIS IS A SINGLETON MODULE & CONTAINS SIDE EFFECTS */
import chalk from "chalk";
import cliCursor from "cli-cursor";

import { LOGGER } from "~/logger";
import { isDevelopment } from "~/shared/environment";

import { TAGS } from "./tags";

const onExitFunctions: ((code: number) => void)[] = [];

const logger = LOGGER.CLI;

export function onExit(fn: () => void) {
  onExitFunctions.push(fn);
}

process.on("uncaughtException", err => {
  logger.error(`Unhandled Exception: ${err}`);

  console.log(TAGS.error, chalk.gray`Check the logs for more details.`);

  if (isDevelopment()) {
    console.error(err);
  }

  process.stdout.write("\n");
  process.exit(1);
});

process.on("unhandledRejection", err => {
  logger.error(`Unhandled Rejection: ${err}`);

  console.log(TAGS.error, chalk.gray`Check the logs for more details.`);

  if (isDevelopment()) {
    console.error(err);
  }

  process.stdout.write("\n");
  process.exit(1);
});

process.on("SIGINT", () => {
  process.exit(0);
});

process.on("exit", code => {
  logger.info(`Exiting with code ${code}`);

  while (onExitFunctions.length > 0) {
    onExitFunctions.pop()?.(code);
  }

  if (code !== 0) {
    console.log(TAGS.vryjs, chalk.gray`Alas, there's been an error!\n`);
  } else {
    console.log(TAGS.vryjs, `Thank you :)\n`);
  }

  // manually reset terminal settings
  process.stdin.setRawMode(false);
  process.stdin.resume();
  cliCursor.show();

  process.exit(code);
});
