import { join } from "path";

const ROOT_DIR = process.env.VRYJS_ROOT ?? ".";

export const CACHE_DIR = join(ROOT_DIR, "cache");
export const LOGS_DIR = join(ROOT_DIR, "logs");
export const CONFIG_FILE_PATH = join(ROOT_DIR, "config.yaml");
