import { defineConfig } from "@prisma/config";
import fs from "fs";
import path from "path";

let dbUrl;
try {
  const envPath = path.join(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const envStr = fs.readFileSync(envPath, "utf8");
    const dbUrlMatch = envStr.match(/DATABASE_URL_UNPOOLED="?([^"\n]+)"?/);
    dbUrl = dbUrlMatch ? dbUrlMatch[1] : undefined;
  }
} catch (e) {
  // Ignore
}

export default defineConfig({
  datasource: {
    url: dbUrl || process.env.DATABASE_URL_UNPOOLED,
  },
});

