import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create two demo users
  const hash1 = await bcrypt.hash("password123", 10);
  const hash2 = await bcrypt.hash("password123", 10);

  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: { email: "alice@example.com", name: "Alice", passwordHash: hash1 },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: { email: "bob@example.com", name: "Bob", passwordHash: hash2 },
  });

  // Create a demo league
  const league = await prisma.league.upsert({
    where: { inviteCode: "DEMO1234" },
    update: {},
    create: {
      name: "Masters 2026 Demo League",
      inviteCode: "DEMO1234",
      ownerId: alice.id,
    },
  });

  // Add both as members
  await prisma.leagueMember.upsert({
    where: { userId_leagueId: { userId: alice.id, leagueId: league.id } },
    update: {},
    create: { userId: alice.id, leagueId: league.id },
  });

  await prisma.leagueMember.upsert({
    where: { userId_leagueId: { userId: bob.id, leagueId: league.id } },
    update: {},
    create: { userId: bob.id, leagueId: league.id },
  });

  console.log("Seed complete. Demo credentials:");
  console.log("  alice@example.com / password123");
  console.log("  bob@example.com / password123");
  console.log(`  League invite code: DEMO1234`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
