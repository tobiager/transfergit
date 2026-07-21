import { test } from "node:test";
import assert from "node:assert/strict";
import { parseRepoSlug, detectQueryKind } from "./parseRepoSlug.ts";

test("parseRepoSlug: owner/repo", () => {
  assert.deepEqual(parseRepoSlug("vercel/next.js"), { owner: "vercel", repo: "next.js" });
});

test("parseRepoSlug: github.com URL variants", () => {
  assert.deepEqual(parseRepoSlug("https://github.com/vercel/next.js/"), { owner: "vercel", repo: "next.js" });
  assert.deepEqual(parseRepoSlug("github.com/vercel/next.js.git"), { owner: "vercel", repo: "next.js" });
});

test("parseRepoSlug: rejects a bare username", () => {
  assert.equal(parseRepoSlug("torvalds"), null);
});

test("detectQueryKind: bare token is a player, owner/repo or URL is a squad", () => {
  assert.equal(detectQueryKind(""), null);
  assert.equal(detectQueryKind("   "), null);
  assert.equal(detectQueryKind("torvalds"), "player");
  assert.equal(detectQueryKind("vercel/next.js"), "squad");
  assert.equal(detectQueryKind("https://github.com/vercel/next.js"), "squad");
});
