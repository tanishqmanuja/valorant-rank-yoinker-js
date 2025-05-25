import ora from "ora";

import { ValorantApi } from "~/api";
import { ValorantConnection, createValorantConnection } from "~/connection";
import { initDB } from "~/db/init";
import { EntityManager } from "~/entities/entity.manager";
import { LOGGER } from "~/logger";
import { register, resolve } from "~/shared/dependencies";
import { ConfigService } from "~/shared/services/config.service";
import { GameDataService } from "~/shared/services/game-data.service";
import { GameStateService } from "~/shared/services/game-state.service";
import { MatchService } from "~/shared/services/match.service";
import { NamesService } from "~/shared/services/names.service";
import { PartyService } from "~/shared/services/party.service";
import { PresenceService } from "~/shared/services/presence.service";
import { GlobalSpinner } from "~/shared/spinner";
import { Table } from "~/table";

import { onExit } from "./exit";
import { enableHotkeys } from "./hotkeys";
import { TAGS } from "./tags";
import { autoStartValorant } from "./valorant";

const logger = LOGGER.CLI;

export async function doBootstrap() {
  logger.info("Bootstrap started");

  /* Config */
  const configService = new ConfigService();
  register(ConfigService, configService);

  const config = configService.config;

  if (config.features["auto-start-valorant"]) {
    console.log(TAGS.vryjs, "Valorant auto start enabled\n");
    await autoStartValorant();
  }

  /* Connection */
  const spinner = ora({
    prefixText: TAGS.link,
  });
  onExit(() => {
    if (spinner.isSpinning) {
      spinner.fail("Aborted...\n");
    }
  });

  const connection = await createValorantConnection(spinner);
  register(ValorantConnection, connection);
  register(ValorantApi, connection.api);
  onExit(() => {
    connection.close();
  });

  LOGGER.API.info("Authenticated");

  const globalSpinner = register(
    GlobalSpinner,
    ora({
      // FIX FOR HOTKEYS
      // read: https://github.com/sindresorhus/ora/issues/156
      hideCursor: true,
      discardStdin: false,
    }),
  );
  onExit(() => {
    if (globalSpinner.isSpinning) {
      globalSpinner.fail("Aborted...\n");
    }
  });

  /* Services */
  resolve(PresenceService);
  resolve(PartyService);
  resolve(MatchService);
  resolve(NamesService);
  resolve(GameStateService);
  const gameDataService = resolve(GameDataService);

  /* Others */
  resolve(EntityManager);
  resolve(Table);

  await initDB();

  enableHotkeys(() => gameDataService.requestUpdate());

  logger.info("Bootstrap done!");
}
