import 'dotenv/config';
import { PrismaClient } from '.prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';

async function createAdmin() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    const username = 'admin_new';
    const password = 'admin_password_123';
    
    const adminExists = await prisma.user.findUnique({
      where: { username },
    });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          role: 'ADMIN',
        },
      });
      console.log(`✅ Admin user created successfully!`);
      console.log(`Username: ${username}`);
      console.log(`Password: ${password}`);
    } else {
      console.log(`ℹ️ User '${username}' already exists.`);
    }
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
