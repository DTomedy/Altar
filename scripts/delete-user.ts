import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'tomedy14@gmail.com';
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    console.log('User not found:', email);
    return;
  }

  console.log('Found user:', user.id, user.email);
  
  await prisma.walletTransaction.deleteMany({ where: { wallet: { userId: user.id } } });
  await prisma.wallet.deleteMany({ where: { userId: user.id } });
  await prisma.contribution.deleteMany({ where: { campaign: { ownerId: user.id } } });
  await prisma.wishlistItem.deleteMany({ where: { campaign: { ownerId: user.id } } });
  await prisma.campaign.deleteMany({ where: { ownerId: user.id } });
  await prisma.user.delete({ where: { id: user.id } });
  
  console.log('User deleted successfully');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
