export const env = {
  isProduction: process.env.NODE_ENV === "production",
  isStreamerModeEnabled: process.env.NODE_ENV === "production",
  version:
    process.env.VRYJS_VERSION ?? process.env.npm_package_version ?? "0.0.0",
};

export const isProduction = () => env.isProduction;
export const isDevelopment = () => !env.isProduction;
export const isStreamerModeEnabled = () => env.isStreamerModeEnabled;
