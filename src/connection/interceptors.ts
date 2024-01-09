import { AxiosInstance } from "axios";
import {
  errorLogger,
  requestLogger,
  responseLogger,
  setGlobalConfig,
} from "axios-logger";

let isGlobalSet = false;

export function createLoggerInterceptor(
  axiosInstance: AxiosInstance,
  logger: {
    info: (msg: string) => void;
    error: (msg: string) => void;
  },
) {
  if (!isGlobalSet) {
    setGlobalConfig({
      dateFormat: false,
      method: true,
      url: true,
      headers: false,
      prefixText: false,
      data: false,
      params: false,
      logger: logger.info,
    });

    isGlobalSet = true;
  }

  axiosInstance.interceptors.request.use(
    config => {
      if (
        "__retryCount" in config &&
        typeof config.__retryCount === "number" &&
        config.__retryCount > 1
      ) {
        return {
          ...requestLogger(config, {
            prefixText: `Retry ${config.__retryCount}`,
          }),
          ...config,
        };
      } else {
        return { ...requestLogger(config), ...config };
      }
    },
    err =>
      errorLogger(err, {
        logger: logger.info,
      }),
  );

  axiosInstance.interceptors.response.use(
    res => {
      if ("cached" in res && res.cached) {
        return { ...responseLogger(res, { prefixText: "Cached" }), ...res };
      } else {
        return { ...responseLogger(res), ...res };
      }
    },
    err =>
      errorLogger(err, {
        logger: logger.error,
      }),
  );
}
