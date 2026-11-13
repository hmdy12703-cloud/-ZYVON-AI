import 'reflect-metadata';
import { PrismaClient, UserRole } from '@prisma/client';

async function main() {
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Set ADMIN_BOOTSTRAP_EMAIL to the existing account email you want to promote.');
  }

  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.update({
      where: { email },
      data: { role: UserRole.ADMIN },
      select: { id: true, email: true, role: true },
    });
    process.stdout.write(`Administrator role granted to ${user.email} (user ${user.id}).\n`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`Admin bootstrap failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
