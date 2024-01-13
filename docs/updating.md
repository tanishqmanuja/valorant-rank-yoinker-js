# Updating Guide

VryJS is composed of two files namely `vryjs.exe` and `vryjs.mjs` (located inside the bin folder, relative to vryjs.exe). **TLDR**, Updating these two files will update the app to the latest version.

There are two ways to update this app to the latest github release.

## 1. Using VryJS CLI (Recommended)

1. Open a terminal at the folder where vryjs.exe is located.
2. Run `./vryjs.exe upgrade` to update the cli.
3. On next start of the app, the latest version of vryjs.mjs bundle will be downloaded.

> [!TIP]
> There is also a command `./vryjs update` that update only the bundle.

## 2. Manually

1. Download `vryjs.exe` and `vryjs.mjs` from the latest [release](https://github.com/tanishqmanuja/valorant-rank-yoinker-js/releases/).
2. Replace/Overwrite the following
  - `vryjs.exe` at the root
  - `vryjs.mjs` inside the `bin` folder