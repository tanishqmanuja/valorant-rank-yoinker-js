import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { clean } from "./helpers/clean";
import { env } from "./shared/environment";

yargs(hideBin(process.argv))
  .command({
    command: "version",
    describe: "Prints CLI version",
    builder: yargs => yargs,
    handler: () => {
      console.log(env.version);
    },
  })
  .command({
    command: "clean",
    describe: "Clean cache",
    builder: yargs => yargs,
    handler: async () => {
      await clean();
    },
  })
  .command({
    command: "*",
    describe: "Start VALORANT Rank Yoinker JS",
    builder: yargs => yargs,
    handler: () => {
      import("./vryjs");
    },
  })
  .version(env.version)
  .help()
  .parse();
