import chalk from "chalk";
import cliCursor from "cli-cursor";
import { retry, switchMap, tap, timer } from "rxjs";

import { doBootstrap } from "./helpers/bootstrap";
import { isRateLimitError } from "./helpers/errors";
import { TAGS } from "./helpers/tags";
import { LOGGER } from "./logger";
import { inject } from "./shared/dependencies";
import { env, isDevelopment } from "./shared/environment";
import { ConfigService } from "./shared/services/config.service";
import { GameDataService } from "./shared/services/game-data.service";
import { GlobalSpinner } from "./shared/spinner";
import { Table } from "./table";
import { sleep } from "./utils/promise";

const logger = LOGGER.CLI;

console.log(
  chalk.whiteBright.bold(
    `Valorant Rank Yoinker JS v${env.version}`.concat(
      isDevelopment() ? "-DEV" : "",
    ),
  ),
);
process.stdout.write("\n");
logger.info("Starting VALORANT Rank Yoinker JS");

try {
  await doBootstrap();
} catch (e) {
  logger.error(e);
  logger.info("Bootstrap failed!");
  await sleep(100); // IDK why, but this fixes logger
  process.exit(1);
}

const spinner = inject(GlobalSpinner);
const gameDataService = inject(GameDataService);
const table = inject(Table);

const configService = inject(ConfigService);
const config = configService.config;

gameDataService.gameData$
  .pipe(
    switchMap(async data => await table.display(data)),
    tap({
      next: () => {
        console.log(
          TAGS.info,
          chalk.gray`Press Ctrl+C to exit or Ctrl+R to refresh\n`,
        );
        if (process.stdin.isTTY) {
          process.stdin.setRawMode(true);
          cliCursor.hide();
        }
      },
      error: err => {
        if (isRateLimitError(err)) {
          spinner.fail("Table Creation Failed!, Rate Limited :(\n");
        } else {
          if (isDevelopment() && !config.features["no-dev-logs"]) {
            console.error(err);
          }
          logger.error(err);
          spinner.fail("Table Creation Failed!\n");
        }
      },
    }),
    retry({
      resetOnSuccess: true,
      count: 5,
      delay: (err, retryCount) => {
        const retryTime = isRateLimitError(err)
          ? (48 + Math.min(10 + 2 ** retryCount, 60)) * 1000
          : Math.min((10 + 2 ** retryCount) * 1000, 60 * 1000);
        spinner.start(
          `Automatic Retry After ${
            retryTime / 1000
          }s, attempt[${retryCount}/5]`,
        );
        return timer(retryTime);
      },
    }),
    retry({
      delay: () => {
        console.log(
          TAGS.vryjs,
          chalk.gray`Automatic Retry Disabled (press Ctrl+R for manual retry)\n`,
        );
        return gameDataService.updateRequest$.pipe(
          switchMap(() => timer(1000)),
        );
      },
    }),
  )
  .subscribe();
