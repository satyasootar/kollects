import { db } from "./packages/database/src/index";
import { formsTable } from "./packages/database/src/models/form";
import { eq } from "drizzle-orm";

async function main() {
  const forms = await db.select({
    slug: formsTable.slug,
    themeId: formsTable.themeId,
    settings: formsTable.settings,
  }).from(formsTable).where(eq(formsTable.slug, "untitled-form-2"));
  
  console.log("=== DB RESULT ===");
  console.log(JSON.stringify(forms, null, 2));
  process.exit(0);
}

main().catch(console.error);
