# Building Guide

## Pre-requisites
*  [Node.js](https://nodejs.org/en/)
*  [pnpm](https://pnpm.io/)
*  [Go](https://golang.org/doc/install)

## Running from Source

Useful for local development, you dont even need golang to do this.

1. Install dependencies
```pwsh
pnpm install
```

2. Run Command
```pwsh
pnpm start:dev
```

## Complete Build (CLI + JS Bundle)

Steps are as follows,

1. Install dependencies
```pwsh
pnpm install && go mod download
```

2. Build Command
```pwsh
pnpm build
```

3. Run the binary located at `out/vryjs.exe`