import { defineConfig } from "@prisma/config";
import fs from "fs";
import path from "path";

const envStr = fs.readFileSync(path.join(process.cwd(), ".env"), "utf8");
const dbUrlMatch = envStr.match(/DATABASE_URL_UNPOOLED="?([^"\n]+)"?/);
const dbUrl = dbUrlMatch ? dbUrlMatch[1] : undefined;

export default defineConfig({
  datasource: {
    url: dbUrl || process.env.DATABASE_URL_UNPOOLED,
  },
});

