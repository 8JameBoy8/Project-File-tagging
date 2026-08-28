// This project uses SQLite (via @prisma/adapter-libsql), not Postgres/Prisma Accelerate.
// Re-export the single shared client from lib/prisma so every route talks to the same
// SQLite-backed PrismaClient instance instead of spinning up a second, incompatible one.
export { default as prisma } from './prisma'
