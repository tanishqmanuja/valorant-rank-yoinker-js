import { constants } from "fs";
import { access } from "fs/promises";

export async function isFileAccessible(...files: string[]) {
  return Promise.all(files.map(file => access(file, constants.R_OK)))
    .then(() => true)
    .catch(() => false);
}
