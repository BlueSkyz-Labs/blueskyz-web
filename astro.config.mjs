import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import cjkHeadingBreaks from "./src/integrations/cjk-heading-breaks.mjs";
import localizedNotFound from "./src/integrations/localized-not-found.mjs";
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const site = process.env.PUBLIC_SITE_URL?.trim() || "http://localhost:4321";

/**
 * WP-12 (LSN-marketing-002): stamp the build with the built commit.
 * Writes .astro/build-commit (git-ignored, outside the deployed dist/) at
 * build done. If git is unavailable, writes "unknown". Never fails the build.
 * 2026-10-24 recurrence: local builds (not CI / Workers Builds) also write the
 * commit to dist/.well-known/build-commit so global-setup can verify the
 * SERVED build on a loopback PLAYWRIGHT_BASE_URL. The file holds only the
 * commit sha (public on GitHub) and is never emitted by CI, so deployments
 * do not carry it.
 */
function buildStamp() {
  return {
    name: "build-stamp",
    hooks: {
      "astro:build:done": ({ dir }) => {
        let commit = "unknown";
        try {
          commit = execSync("git rev-parse HEAD", {
            encoding: "utf8",
            stdio: ["ignore", "pipe", "ignore"],
          }).trim();
        } catch {
          // git unavailable: stamp stays "unknown", build continues.
        }
        try {
          mkdirSync(".astro", { recursive: true });
          writeFileSync(".astro/build-commit", commit + "\n", "utf8");
        } catch {
          // Filesystem write failed: do not fail the build.
        }
        // PDV 1.0 (sgps-core POST_DEPLOY_VERIFICATION_STANDARD): a Workers
        // Builds deploy serves /version.json = {"commit": sha} so the
        // post-deploy check can confirm the served build. Only the commit
        // sha (already public on GitHub); GitHub CI builds do not emit it.
        if (process.env.WORKERS_CI) {
          const served = (process.env.WORKERS_CI_COMMIT_SHA || commit).trim();
          if (/^[0-9a-f]{7,40}$/i.test(served)) {
            try {
              writeFileSync(
                fileURLToPath(new URL("version.json", dir)),
                JSON.stringify({ commit: served }) + "\n",
                "utf8",
              );
            } catch {
              // Filesystem write failed: do not fail the build.
            }
          }
        }
        if (
          commit !== "unknown" &&
          !process.env.CI &&
          !process.env.WORKERS_CI
        ) {
          try {
            const target = fileURLToPath(
              new URL(".well-known/build-commit", dir),
            );
            mkdirSync(fileURLToPath(new URL(".well-known/", dir)), {
              recursive: true,
            });
            writeFileSync(target, commit + "\n", "utf8");
          } catch {
            // Filesystem write failed: do not fail the build.
          }
        }
      },
    },
  };
}

export default defineConfig({
  site,
  // cjkHeadingBreaks runs first so the copied localized 404 pages carry it too.
  integrations: [cjkHeadingBreaks(), localizedNotFound(), buildStamp()],
  output: "static",
  trailingSlash: "always",
  vite: {
    plugins: [tailwindcss()],
    build: {
      // Keep component scripts as EXTERNAL files: the production CSP
      // (`script-src 'self'`, no unsafe-inline) blocks inline scripts, and
      // Astro would otherwise inline hoisted script chunks below
      // vite's default assetsInlineLimit (4 KB). check-client-budget also
      // fails the build if an inline executable script ever reappears.
      assetsInlineLimit: 0,
    },
  },
});
