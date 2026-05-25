import { db } from "./index";
import { usersTable, themesTable, formTemplatesTable } from "./schema";
import bcrypt from "bcrypt";
import crypto from "crypto";

async function main() {
  console.log("🌱 Starting database seeding...");

  try {
    // 1. Create Demo User
    const demoEmail = "demo@kollects.tech";
    const passwordHash = await bcrypt.hash("Demo123!@#", 10);

    const [demoUser] = await db
      .insert(usersTable)
      .values({
        name: "Demo User",
        email: demoEmail,
        passwordHash,
        emailVerified: true,
        plan: "enterprise", // Give them full access
      })
      .onConflictDoUpdate({
        target: usersTable.email,
        set: { passwordHash, plan: "enterprise" },
      })
      .returning();

    console.log(`✅ Demo User seeded: ${demoUser.email} (ID: ${demoUser.id})`);

    // 2. Create System Themes
    const themesData = [
      {
        name: "Light (System)",
        slug: "system-light",
        description: "The default light theme.",
        isSystem: true,
        isPublic: true,
        colorScheme: "light" as const,
        creatorId: demoUser.id,
        config: {},
      },
      {
        name: "Dark (System)",
        slug: "system-dark",
        description: "The default dark theme.",
        isSystem: true,
        isPublic: true,
        colorScheme: "dark" as const,
        creatorId: demoUser.id,
        config: {},
      },
    ];

    const themes = [];
    for (const theme of themesData) {
      const [insertedTheme] = await db
        .insert(themesTable)
        .values(theme)
        .onConflictDoUpdate({
          target: themesTable.slug,
          set: theme,
        })
        .returning();
      themes.push(insertedTheme);
      console.log(`✅ System Theme seeded: ${insertedTheme.name}`);
    }

    const lightTheme = themes.find((t) => t.slug === "system-light")!;

    // 3. Create System Templates
    const templatesData = [
      {
        name: "Contact Form",
        slug: "system-contact-form",
        description: "A simple contact form to receive inquiries.",
        themeId: lightTheme.id,
        isSystem: true,
        isFeatured: true,
        definition: {
          title: "Contact Us",
          description: "Please fill out the form below to get in touch.",
          fields: [
            {
              id: crypto.randomUUID(),
              type: "short_text",
              label: "Name",
              required: true,
              order: 1,
              pageNumber: 1,
            },
            {
              id: crypto.randomUUID(),
              type: "email",
              label: "Email Address",
              required: true,
              order: 2,
              pageNumber: 1,
            },
            {
              id: crypto.randomUUID(),
              type: "long_text",
              label: "Message",
              required: true,
              order: 3,
              pageNumber: 1,
            },
          ],
        },
      },
      {
        name: "Customer Feedback",
        slug: "system-customer-feedback",
        description: "Collect feedback from your customers to improve your services.",
        themeId: lightTheme.id,
        isSystem: true,
        isFeatured: true,
        definition: {
          title: "Customer Feedback",
          description: "We value your feedback. Let us know how we did!",
          fields: [
            {
              id: crypto.randomUUID(),
              type: "rating",
              label: "How would you rate our service?",
              required: true,
              order: 1,
              pageNumber: 1,
              settings: { max: 5 },
            },
            {
              id: crypto.randomUUID(),
              type: "long_text",
              label: "What can we improve?",
              required: false,
              order: 2,
              pageNumber: 1,
            },
          ],
        },
      },
    ];

    for (const tpl of templatesData) {
      await db
        .insert(formTemplatesTable)
        .values(tpl)
        .onConflictDoUpdate({
          target: formTemplatesTable.slug,
          set: tpl,
        });
      console.log(`✅ System Template seeded: ${tpl.name}`);
    }

    console.log("🎉 Seeding complete!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    process.exit(0);
  }
}

main();
