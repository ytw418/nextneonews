import "./env";

import { prisma } from "@kmedia/db";

import { collectors } from "./collectors";
import { log } from "./log";
import { upsertSignals } from "./store";

async function collect(names: string[]) {
  const targets = names.length > 0 ? names : Object.keys(collectors);

  for (const name of targets) {
    const collector = collectors[name];
    if (!collector) {
      log.error(`unknown collector: ${name}`, { available: Object.keys(collectors) });
      process.exitCode = 1;
      continue;
    }
    try {
      const signals = await collector.collect();
      const saved = await upsertSignals(signals);
      log.info(`collected ${name}`, { saved });
    } catch (error) {
      log.error(`collector failed: ${name}`, { error: String(error) });
      process.exitCode = 1;
    }
  }
}

const [command, ...args] = process.argv.slice(2);

try {
  if (command === "collect") {
    await collect(args);
  } else {
    log.error("usage: cli.ts collect [collector...]", { available: Object.keys(collectors) });
    process.exitCode = 1;
  }
} finally {
  await prisma.$disconnect();
}
