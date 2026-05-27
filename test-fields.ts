import { db, eq } from "@repo/database";
import { formsTable } from "@repo/database/models/form";

async function test() {
  const dbForm = await db.query.formsTable.findFirst({
    where: eq(formsTable.slug, "untitled-form-1"),
    with: {
      fields: {
        orderBy: (fields: any, { asc }: any) => [asc(fields.order)],
      },
    },
  });

  console.log(JSON.stringify(dbForm, null, 2));
}

test().catch(console.error);
