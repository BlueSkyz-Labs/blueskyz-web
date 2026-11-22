import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const wrangler = readFileSync("wrangler.toml", "utf8");

test("Workers serves the Astro static build", () => {
  assert.match(wrangler, /\[assets\]/);
  assert.match(wrangler, /directory\s*=\s*["']\.\/dist["']/);
  assert.match(wrangler, /not_found_handling\s*=\s*["']404-page["']/);
  assert.match(wrangler, /html_handling\s*=\s*["']auto-trailing-slash["']/);
  assert.match(wrangler, /workers_dev\s*=\s*false/);
  assert.match(wrangler, /preview_urls\s*=\s*false/);
  assert.match(wrangler, /\[observability\]/);
  assert.match(wrangler, /enabled\s*=\s*true/);
  assert.match(wrangler, /\[observability\.logs\]/);
  assert.match(wrangler, /invocation_logs\s*=\s*true/);
  assert.match(wrangler, /persist\s*=\s*true/);
  assert.match(wrangler, /redact_query_string\s*=\s*true/);
  assert.doesNotMatch(wrangler, /workers_dev\s*=\s*true/);
  assert.doesNotMatch(wrangler, /pages_build_output_dir/);
  assert.equal(existsSync(".github/workflows/qa.yml"), false);
});

test("Worker names follow PNS 1.1 ({role}-{environment})", () => {
  const analytics = readFileSync("workers/analytics/wrangler.toml", "utf8");
  assert.match(wrangler, /^name = "web"$/m);
  assert.match(analytics, /^name = "analytics"$/m);
});
