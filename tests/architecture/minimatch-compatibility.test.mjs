/**
 * Issue #715 — compatibility proof for CVE-2026-118764 mitigation.
 *
 * Lighthouse CI 0.15 imports chrome-launcher from CommonJS. Its current
 * transitive chrome-launcher 0.13 path pulls in rimraf 3 / glob 7, whose
 * private minimatch 3 assumptions are incompatible with minimatch 11. The
 * scoped override moves only that caller to the compatible launcher already
 * used by Lighthouse. Exercise LHCI's real loader and API, not an unrelated
 * root import.
 */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const fromTest = createRequire(import.meta.url);

test("Lighthouse CI loads the compatible chrome-launcher API after the minimatch fix", () => {
  const fromLhci = createRequire(fromTest.resolve("@lhci/cli/package.json"));
  const fromChromeLauncher = createRequire(
    fromLhci.resolve("chrome-launcher/package.json"),
  );
  const launcherPackage = fromLhci("chrome-launcher/package.json");
  const launcher = fromLhci("chrome-launcher");
  const lhciUtils = fromLhci("./src/utils.js");

  assert.equal(launcherPackage.version, "1.2.1");
  assert.equal(typeof launcher.Launcher.getInstallations, "function");
  assert.equal(typeof launcher.launch, "function");
  assert.throws(() => fromChromeLauncher.resolve("rimraf/package.json"));
  assert.ok(Array.isArray(lhciUtils.getChromeInstallationsSafe()));
});
