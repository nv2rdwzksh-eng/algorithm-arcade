import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";

const output = new URL("../dist/", import.meta.url);
const html = await readFile(new URL("index.html", output), "utf8");
const base = "/algorithm-arcade/";
const assets = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
  .map((match) => match[1])
  .filter((url) => !/^(?:https?:|data:|#)/.test(url));

assert(!html.includes("/src/"), "Deploy the compiled dist directory, not source HTML.");
assert(assets.some((url) => url.endsWith(".js")), "Missing compiled JavaScript.");
assert(assets.some((url) => url.endsWith(".css")), "Missing compiled CSS.");

for (const asset of assets) {
  assert(asset.startsWith(base), `Asset must include ${base}: ${asset}`);
  const file = new URL(asset.slice(base.length), output);
  assert(file.href.startsWith(output.href), `Asset escapes dist: ${asset}`);
  assert((await stat(file)).isFile(), `Missing build asset: ${asset}`);
}

console.log(`Verified ${assets.length} compiled assets under ${base}`);
for (const asset of assets) console.log(`  ${asset}`);
