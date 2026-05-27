# Kollects.tech

**Kollects.tech** is a modern, high-performance form builder designed with a stunning editorial aesthetic. Built to provide a premium user experience, it allows users to effortlessly create, design, and analyze beautiful forms, surveys, and polls.

## ✨ Features

- **Intuitive Form Builder**: An interactive, drag-and-drop canvas for composing forms.
- **Pre-configured Templates**: Start quickly with curated templates (Contact Us, Lead Generation, Event Registration, etc.).
- **Editorial Aesthetic**: A refined, warm, and highly-polished UI that feels premium and responsive.
- **Real-time Analytics**: Built-in dashboards to track form responses and performance.
- **Customization & Theming**: Configure form colors, fonts, and layouts to match your brand.
- **High Performance**: Built on a modern tech stack ensuring rapid load times and smooth interactions.

## 🛠 Tech Stack

Kollects is built inside a **Turborepo** monorepo to separate concerns efficiently and ensure fast builds.

- **Frontend**: [Next.js](https://nextjs.org/) (App Router), React, Tailwind CSS, Lucide Icons, and specialized UI components.
- **Backend**: Next.js API Routes, [tRPC](https://trpc.io/) for end-to-end typesafe APIs.
- **Database**: PostgreSQL managed with [Drizzle ORM](https://orm.drizzle.team/).
- **Monorepo Management**: [Turborepo](https://turborepo.org/) and pnpm.

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js and `pnpm` installed.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/kollects.git
   cd kollects
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Environment Setup:**
   - Copy `.env.example` to `.env` in the required applications (`apps/web`, `packages/database`, etc.).
   - Fill in your database URL and other necessary API keys.

4. **Database Push:**
   Push the schema to your Postgres database:
   ```bash
   pnpm db:push
   ```

5. **Start the Development Server:**
   ```bash
   pnpm dev
   ```
   This will start the web application and all necessary services. The app will be available at `http://localhost:3000`.

## 📦 Workspace Structure

- `apps/web`: The main Next.js application containing the marketing site, dashboard, and form builder.
- `apps/api`: Auxiliary API services (if applicable).
- `packages/database`: Drizzle ORM schema, migrations, and database connection logic.
- `packages/trpc`: The tRPC routers bridging the database and the frontend.
- `packages/services`: Business logic and backend services (Forms, Users, etc.).
- `packages/ui`: Shared UI components used across the monorepo.

## 🤝 Contributing
Contributions are welcome! Please open an issue or submit a pull request for any bugs, improvements, or new features.

## 📄 License
This project is licensed under the MIT License.
