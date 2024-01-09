import { transports } from "winston";
import "winston-daily-rotate-file";

import { LOGS_DIR } from "~/shared/constants";

const LOG_PREFIX_CLI = "cli";
const LOG_PREFIX_API = "api";

const COMMON_TRANSPORT_OPTIONS = {
  datePattern: "YYYY-MM-DD-HH",
  zippedArchive: false,
  maxSize: "8m",
  maxFiles: "7d",
};

export const fileTransportForCli = new transports.DailyRotateFile({
  ...COMMON_TRANSPORT_OPTIONS,
  filename: `${LOGS_DIR}/${LOG_PREFIX_CLI}-%DATE%.log`,
});

export const fileTransportForApi = new transports.DailyRotateFile({
  ...COMMON_TRANSPORT_OPTIONS,
  filename: `${LOGS_DIR}/${LOG_PREFIX_API}-%DATE%.log`,
});
