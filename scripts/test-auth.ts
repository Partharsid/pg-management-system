const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function test() {
  const p = new PrismaClient();
  
  const user = await p.user.findUnique({ where: { email: 'admin@pg.com' } });
  console.log('User found:', !!user);
  if (user) {
    console.log('Email:', user.email);
    console.log('Name:', user.name);
    console.log('Role:', user.role);
    console.log('Active:', user.isActive);
    console.log('Password hash:', user.password.substring(0, 30) + '...');
    
    const match = await bcrypt.compare('admin123', user.password);
    console.log('Password match:', match);
  }
  
  await p.$disconnect();
}

test().catch(console.error);
