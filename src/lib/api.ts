export const MOCK_RESPONSE = {
  profile: {
    language: "node",
    framework: "nextjs",
    db: "postgres",
    port: 3000,
  },
  devcontainer: JSON.stringify(
    {
      name: "Next.js + Postgres",
      image: "mcr.microsoft.com/devcontainers/typescript-node:20",
      features: {
        "ghcr.io/devcontainers/features/docker-in-docker:2": {},
        "ghcr.io/devcontainers/features/node:1": { version: "20" },
      },
      forwardPorts: [3000, 5432],
      postCreateCommand: "npm install",
      customizations: {
        vscode: {
          extensions: [
            "dbaeumer.vscode-eslint",
            "esbenp.prettier-vscode",
            "bradlc.vscode-tailwindcss",
            "ms-azuretools.vscode-docker",
          ],
        },
      },
    },
    null,
    2
  ),
  compose: `version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    volumes:
      - .:/workspace:cached
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/app
    depends_on:
      - postgres

  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: app
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  postgres-data:`,
};

export async function generateFromUrl(repoUrl: string) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return MOCK_RESPONSE;
}
