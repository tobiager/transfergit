// Preload hook for scripts/build-legends.ts: the "server-only"
// package unconditionally throws outside a Next.js server bundle, so it's
// stubbed out here to allow running lib/github.ts and lib/player.ts as a
// plain Node script.
const Module = require("module");
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "server-only") return {};
  return originalLoad.apply(this, arguments);
};
