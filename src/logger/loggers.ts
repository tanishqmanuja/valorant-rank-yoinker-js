import { createLogger, format } from "winston";

import { fileTransportForApi, fileTransportForCli } from "./transports";

const formatMeta = (meta: any) => {
  const splat = meta[Symbol.for("splat")];
  if (splat && splat.length) {
    return splat.length === 1
      ? JSON.stringify(splat[0], null, 2)
      : JSON.stringify(splat);
  }
  return "";
};

const lineFormat = format.printf(
  ({ level, message, timestamp, moduleName, ...meta }) => {
    if (moduleName) {
      return `${timestamp} | ${level.toUpperCase()} | ${moduleName} | ${message} ${formatMeta(
        meta,
      )}`;
    }
    return `${timestamp} | ${level.toUpperCase()} | ${message} ${formatMeta(
      meta,
    )}`;
  },
);

export const rawLogger = createLogger({
  format: format.combine(
    format.uncolorize(),
    format.printf(({ message }) => String(message)),
  ),
  transports: [fileTransportForCli],
});

export const apiLogger = createLogger({
  format: format.combine(
    format.timestamp({ format: "HH:mm:ss" }),
    format.uncolorize(),
    format.printf(
      ({ level, message, timestamp }) =>
        `${timestamp} | ${level.toUpperCase()} | ${message}`,
    ),
  ),
  transports: [fileTransportForApi],
});

export const cliLogger = createLogger({
  level: "debug",
  format: format.combine(
    format.timestamp({ format: "HH:mm:ss" }),
    format.splat(),
    format.uncolorize(),
    lineFormat,
  ),
  transports: [fileTransportForCli],
});
