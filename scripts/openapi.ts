import { OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";
import yaml from "js-yaml";
import fs from "node:fs";
import path from "node:path";

import { getAllCommands } from "@/domain";
import { registry } from "@/lib/openapi";

export async function exportOpenApiSpec(outputPath: string) {
  const commands = await getAllCommands();
  const commandCount = Object.keys(commands).length;

  const generator = new OpenApiGeneratorV31(registry.definitions);
  const doc = generator.generateDocument({
    info: {
      description: "Auto-generated from Domain Commands + Prisma Zod Schemas",
      title: "App RPC Command API",
      version: "2026.08.27",
    },
    openapi: "3.1.0",
    servers: [{ url: "/" }],
  });

  const fullPath = path.resolve(process.cwd(), outputPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, yaml.dump(doc), "utf-8");
  console.log(
    `[OpenAPI Export] Discovered ${commandCount} commands. Contract written to: ${fullPath}`,
  );
}

const targetFile = process.argv[2] || "lib/openapi.yaml";
exportOpenApiSpec(targetFile).catch((error) => {
  console.error(error);
  process.exit(1);
});
