import yargs from "yargs";
import { hideBin } from "yargs/helpers";

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
