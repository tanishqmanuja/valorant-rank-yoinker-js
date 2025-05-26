import {
  LOCK_FILE_PATH,
  LOG_FILE_PATH,
  ValorantApiClient,
  ValorantWebsocketClient,
  createValorantApiClient,
} from "@tqman/valorant-api-client";
import { presets } from "@tqman/valorant-api-client/presets";
import chalk from "chalk";
import ora, { type Ora } from "ora";
import {
  concatMap,
  debounceTime,
  defer,
  filter,
  firstValueFrom,
  from,
  retry,
  switchMap,
  tap,
  timer,
} from "rxjs";
import { isNativeError } from "util/types";

import { ValorantApi, createValorantApi } from "~/api";
import { LOGGER } from "~/logger";
import { isFileAccessible } from "~/utils/filesystem";
import { sleep } from "~/utils/promise";
import { isValorantRunning } from "~/utils/valorant";

import { modifyApiBehaviour } from "./helpers";

type MergedApi = ValorantApi & { internal: ValorantApiClient };

const CHECK_INTERVAL_MS = 10 * 1000;
const AUTH_RETRY_COUNT = 5;
const AUTH_RETRY_DELAY_MS = 5 * 1000;
const VAL_OPEN_DEBOUNCE_MS = 1000;
const VAL_RECONNECT_DELAY_MS = 5 * 1000;

// Config for authentication via local API
const VAPIC_OPTIONS = presets.local;

const logger = LOGGER.forModule("Connection");

export class ValorantConnection {
  #api: MergedApi | null = null;
  #ws: ValorantWebsocketClient | null = null;

  private async connect(spinner?: Ora) {
    logger.info("Connecting");
    LOGGER.API.info("Connecting");

    // API Setup
    const upstreamApi = await createValorantApiClient(VAPIC_OPTIONS).catch(
      () => {
        throw Error("Unable to connect with API");
      },
    );
    logger.info("API connected");
    LOGGER.API.info("Connected");

    modifyApiBehaviour(upstreamApi);
    const simplifiedApi = await createValorantApi(upstreamApi);
    this.#api = Object.assign(simplifiedApi, { internal: upstreamApi });

    // WS Setup
    try {
      const port = upstreamApi.local.options.port;
      logger.info(`Connecting to WS on port ${port}`);
      this.#ws = new ValorantWebsocketClient(upstreamApi.local.options);
      this.#ws.on("open", () => {
        logger.info(`WS Connected on port ${port}`);
      });
      this.#ws.on("close", async e => {
        logger.info("WS Disconnected", e);
        if (spinner) {
          spinner.warn("Connection lost!\n");
        }

        // Automatic reconnection
        await sleep(VAL_RECONNECT_DELAY_MS);
        await this.waitForConnection(spinner);
      });
    } catch (err) {
      if (isNativeError(err)) {
        logger.error(`Unable to connect with WS: ${err.message}`);
      }
      throw Error("Unable to connect with WS");
    }
  }

  private async reconnect() {
    logger.info("Reconnecting");

    if (!this.#api || !this.#ws) {
      throw Error("Cannot reconnect without connecting first");
    }

    try {
      await this.#api.internal.reinitializeWithProviders(VAPIC_OPTIONS);
      logger.info(`Connecting to WS on port ${this.#api.local.options.port}`);
      this.#ws.reconnect(this.#api.local.options);
    } catch {
      throw Error("Unable to reconnect");
    }
  }

  async waitForConnection(spinner: Ora = ora({})) {
    spinner.start("Waiting for Valorant to open...");

    const isValorantRunning$ = timer(0, CHECK_INTERVAL_MS).pipe(
      switchMap(async () => {
        const processFlag = await isValorantRunning();
        const filesFlag = await isFileAccessible(LOCK_FILE_PATH, LOG_FILE_PATH);
        return filesFlag && processFlag;
      }),
    );

    await firstValueFrom(
      isValorantRunning$.pipe(
        filter(Boolean),
        debounceTime(VAL_OPEN_DEBOUNCE_MS),
      ),
    );

    spinner.start("Authenticating...");

    const isConnected = this.#api && this.#ws;

    const authenticate$ = defer(() =>
      from(isConnected ? this.reconnect() : this.connect(spinner)),
    ).pipe(
      concatMap(async () => {
        const { acct } = await this.api.core.getRsoUserInfo();
        const account = `${acct.game_name}#${acct.tag_line}`;
        return account;
      }),
      retry({
        count: AUTH_RETRY_COUNT,
        delay: AUTH_RETRY_DELAY_MS,
      }),
      tap({
        error(err) {
          if (isNativeError(err)) {
            logger.error(`Unable to authenticate: ${err.message}`);
          }
        },
      }),
    );

    try {
      const account = await firstValueFrom(authenticate$);
      spinner.succeed(`Logged in as ${chalk.bold(account)}\n`);
    } catch (error) {
      spinner.fail("Authentication Failed\n");
      throw Error("Authentication Failed");
    }
  }

  close() {
    this.#ws?.disconnect();
  }

  get api(): MergedApi {
    if (!this.#api) {
      throw new Error("API not connected");
    }
    return this.#api;
  }

  get ws(): ValorantWebsocketClient {
    if (!this.#ws) {
      throw new Error("WS not connected");
    }
    return this.#ws;
  }

  get puuid(): string {
    if (!this.#api) {
      throw new Error("API not connected");
    }
    return this.#api.remote.puuid;
  }
}

export async function createValorantConnection(
  spinner?: Ora,
): Promise<ValorantConnection> {
  const connection = new ValorantConnection();
  await connection.waitForConnection(spinner);
  return connection;
}
