import {
  VapicProvider,
  getLogFileData,
  getRegionAndShardFromGlzServer,
} from "@tqman/valorant-api-client";

/**
 * @client remote
 * @provides shard, region, client-version
 */
export function provideLogFile(logfilePath?: string) {
  return (async () => {
    const logfile = await getLogFileData(logfilePath);

    //DIRTY FIX for double shipping in logfile clientVersion
    logfile.clientVersion = logfile.clientVersion.replace(
      "shipping-shipping",
      "shipping",
    );

    return {
      ...logfile,
      ...getRegionAndShardFromGlzServer(logfile.servers.glz),
    } as const;
  }) satisfies VapicProvider;
}
