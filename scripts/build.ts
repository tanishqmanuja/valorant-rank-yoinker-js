import { BuildOptions, build } from "esbuild";
import { execa } from "execa";
import { copyFile } from "fs/promises";
import { createRequire } from "module";
import pkg from "package.json";

const VERSION = pkg.version ?? "0.0.0";
const [VERSION_MAJOR = "", VERSION_MINOR = "", VERSION_PATCH = ""] =
  VERSION.split(".");

const BUNDLE_PATH = "./out/vryjs.mjs";
const COPY_BUNDLE_PATH = "./bin/vryjs.mjs";
const EXECUTABLE_PATH = "./out/vryjs.exe";

const isProduction =
  process.env.NODE_ENV === "production" ||
  process.argv.slice(2).includes("--prod");

const makeBinary = process.argv.slice(2).includes("--bin");
const copyBundle = process.argv.slice(2).includes("--copy");

const ESM_FIX_BANNER = `
// ESM Fixes
const require = (await import("node:module")).createRequire(import.meta.url);
const __filename = (await import("node:url")).fileURLToPath(import.meta.url);
const __dirname = (await import("node:path")).dirname(__filename);
`;

const LIBSQL_FIX_BANNER = `
// LibSQL Fixes
import {Module} from "node:module"
import {join as __join} from "node:path"

const originalLoad = Module._load
Module._load = function (request, parent, isMain) {
  if (request === '@libsql/win32-x64-msvc') {
    // Return the real .node file
    return require(__join(__dirname, 'libsql.node'));
  }
  return originalLoad.apply(this, arguments);
};
`;

async function bundle() {
  const config = {
    entryPoints: ["./src/index.ts"],
    format: "esm",
    outfile: BUNDLE_PATH,
    platform: "node",
    bundle: true,
    minify: isProduction,
    sourcemap: !isProduction,
    define: {
      "process.env.NODE_ENV": isProduction ? `"production"` : `"development"`,
      "process.env.VRYJS_VERSION": `"${VERSION}"`,
    },
    banner: {
      js: [ESM_FIX_BANNER, LIBSQL_FIX_BANNER]
        .map(x => x.trim())
        .join("\n\n")
        .concat("\n"),
    },
  } satisfies BuildOptions;

  await build(config);

  const require = createRequire(import.meta.url);
  const modulePath = require.resolve("@libsql/win32-x64-msvc");
  await copyFile(modulePath, "./out/libsql.node");
}

async function resource() {
  const { exitCode } = await execa("goversioninfo", ["--help"]).catch(() => ({
    exitCode: 1,
  }));

  if (exitCode !== 0) {
    console.log(" • ⚠️ Missing goversioninfo");
    await execa(
      "go",
      [
        "install",
        "github.com/josephspurrier/goversioninfo/cmd/goversioninfo@latest",
      ],
      { stdio: "inherit" },
    );
  }

  return execa(
    "goversioninfo",
    [
      "-icon",
      "./assets/vryjs.ico",
      "-manifest",
      "./assets/vryjs.manifest",
      "-ver-major",
      VERSION_MAJOR,
      "-ver-minor",
      VERSION_MINOR!,
      "-ver-patch",
      VERSION_PATCH!,
      "-o",
      "./pkg/vryjs/main.syso",
      "./assets/version.json",
    ],
    { stdio: "inherit" },
  );
}

async function executable() {
  return execa(
    "go",
    [
      "build",
      "-ldflags",
      `-X vryjs/pkg/vryjs/constants.VERSION=${VERSION}`,
      "-o",
      EXECUTABLE_PATH,
      "./pkg/vryjs",
    ],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        GOOS: "windows",
        GOARCH: "amd64",
      },
    },
  );
}

try {
  const start = performance.now();
  console.log(`🏗️  Building v${VERSION}`);
  process.stdout.write("\n");

  await prettyTask("Bundle", bundle());

  if (isProduction || makeBinary) {
    await prettyTask("Resource", resource());
    await prettyTask("Executable", executable());
  }

  process.stdout.write("\n");
  console.log(
    "🥳 Build success",
    `[ ${(performance.now() - start).toFixed(2)}ms ]`,
  );

  if (copyBundle) {
    await copyFile(BUNDLE_PATH, COPY_BUNDLE_PATH);
    process.stdout.write("\n");
    console.log(`📦 Copied ${BUNDLE_PATH} to ${COPY_BUNDLE_PATH}`);
  }

  process.exit(0);
} catch (e) {
  process.stdout.write("\n");
  console.log("☠️  Build failed");
  process.stdout.write("\n");
  console.error(e);
  process.exit(1);
}

function prettyTask<T>(tag: string, task: Promise<T>) {
  return task.then(
    () => console.log(` • ✅ ${tag}`),
    e => {
      console.log(` • ❌ ${tag}`);
      throw e;
    },
  );
}
