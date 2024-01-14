import {
  createAuthRefreshInterceptor,
  createCacheInterceptor,
  createRateLimitInterceptor,
  createRetryInterceptor,
} from "@tqman/axios-interceptor-suite";
import {
  ValorantApiClient,
  getAccessTokenHeader,
  getEntitlementsJWTHeader,
  provideAuthViaLocalApi,
} from "@tqman/valorant-api-client";
import type { AxiosError } from "axios";

import { LOGGER } from "~/logger";

import { createLoggerInterceptor } from "./interceptors";

const logger = LOGGER.API;

export function modifyApiBehaviour(api: ValorantApiClient) {
  const localAxiosInstance = api.local.axiosInstance;
  const remoteAxiosInstance = api.remote.axiosInstance;

  createRateLimitInterceptor(localAxiosInstance, {
    count: 10,
    interval: 1 * 1000,
  });

  createRateLimitInterceptor(remoteAxiosInstance, {
    count: 2,
    interval: 0.5 * 1000,
  });

  createCacheInterceptor(localAxiosInstance);
  createCacheInterceptor(remoteAxiosInstance);

  createAuthRefreshInterceptor(remoteAxiosInstance, {
    statusCodes: [400],
    onRefresh: error => refreshTokens(api, error),
  });

  createRetryInterceptor(remoteAxiosInstance, {
    count: 2,
    delay: 2 * 1000,
    condition: error =>
      error.code !== "ECONNABORTED" &&
      (!error.response ||
        (error.response.status >= 500 && error.response.status <= 599)),
  });

  createLoggerInterceptor(localAxiosInstance, {
    info: (msg: string) => logger.info(msg),
    error: (msg: string) => logger.error(msg),
  });

  createLoggerInterceptor(remoteAxiosInstance, {
    info: (msg: string) => logger.info(msg),
    error: (msg: string) => logger.error(msg),
  });
}

async function refreshTokens(api: ValorantApiClient, error: AxiosError) {
  logger.info("Refreshing tokens");

  const authProvider = provideAuthViaLocalApi();

  const { accessToken, entitlementsToken } = await authProvider(api);

  LOGGER.API.info("Refreshed tokens");

  // Set for whole instance
  api.remote.reinitialize({
    ...api.remote.options,
    accessToken,
    entitlementsToken,
  });

  // Set for this request
  if (error.response) {
    const authHeaders = {
      ...getAccessTokenHeader(accessToken),
      ...getEntitlementsJWTHeader(entitlementsToken),
    };

    error.response.config.headers = Object.assign(
      error.response.config.headers,
      authHeaders,
    );

    return Promise.resolve();
  }

  return Promise.reject(error);
}
