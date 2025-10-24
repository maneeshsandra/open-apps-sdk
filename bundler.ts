#!/usr/bin/env bun
import { rm } from "fs/promises";
import { rename } from "fs/promises";
import { existsSync } from "fs";

async function build() {
  console.log("Starting build process...");

  // Clean dist directory
  console.log("Cleaning dist directory...");
  if (existsSync("dist")) {
    await rm("dist", { recursive: true, force: true });
  }

  // Build main library
  console.log("Building main library...");
  const mainResult = await Bun.build({
    entrypoints: ["./src/lib/index.ts"],
    outdir: "dist",
    target: "node",
    format: "esm",
    minify: true,
    sourcemap: "external",
    external: ["react", "react-dom"]
  });

  if (!mainResult.success) {
    throw new Error("Failed to build main library");
  }

  // Build server
  console.log("Building server...");
  const serverResult = await Bun.build({
    entrypoints: ["./src/lib/server.ts"],
    outdir: "dist",
    target: "node",
    format: "esm",
    minify: true,
    sourcemap: "external",
    external: ["react", "react-dom"]
  });

  if (!serverResult.success) {
    throw new Error("Failed to build server");
  }

  // Rename server output
  if (existsSync("dist/server.ts.js")) {
    await rename("dist/server.ts.js", "dist/server.js");
  }

  // Build client
  console.log("Building client...");
  const clientResult = await Bun.build({
    entrypoints: ["./src/lib/client.ts"],
    outdir: "dist",
    target: "browser",
    format: "esm",
    minify: true,
    sourcemap: "external",
    external: ["react", "react-dom"]
  });

  if (!clientResult.success) {
    throw new Error("Failed to build client");
  }

  // Rename client output
  if (existsSync("dist/client.ts.js")) {
    await rename("dist/client.ts.js", "dist/client.js");
  }

  // Build CLI
  console.log("Building CLI...");
  const cliResult = await Bun.build({
    entrypoints: ["./src/cli.ts"],
    outdir: "dist",
    target: "node",
    format: "esm",
    minify: true,
    sourcemap: "external"
  });

  if (!cliResult.success) {
    throw new Error("Failed to build CLI");
  }

  // Rename CLI output
  if (existsSync("dist/cli.ts.js")) {
    await rename("dist/cli.ts.js", "dist/cli.js");
  }

  // Generate TypeScript declarations
  console.log("Generating TypeScript declarations...");
  const { $ } = await import("bun");
   `npx tsc --project tsconfig.json`;

  // Move type definition files
  console.log("Moving type definition files...");
  if (existsSync("dist/src/lib/index.d.ts")) {
    await rename("dist/src/lib/index.d.ts", "dist/index.d.ts");
  }
  if (existsSync("dist/src/lib/server.d.ts")) {
    await rename("dist/src/lib/server.d.ts", "dist/server.d.ts");
  }
  if (existsSync("dist/src/lib/client.d.ts")) {
    await rename("dist/src/lib/client.d.ts", "dist/client.d.ts");
  }

  // Clean up unnecessary directories
  console.log("Cleaning up build artifacts...");
  if (existsSync("dist/src")) {
    await rm("dist/src", { recursive: true, force: true });
  }
  if (existsSync("dist/examples")) {
    await rm("dist/examples", { recursive: true, force: true });
  }

  console.log("Build completed successfully!");
}

if (import.meta.main) {
  build().catch((error) => {
    console.error("Build failed:", error);
    process.exit(1);
  });
}