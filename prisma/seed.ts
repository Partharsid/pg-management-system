import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@pg.com" },
    update: {},
    create: {
      email: "admin@pg.com",
      password: adminPassword,
      name: "Admin User",
      phone: "9876543210",
      role: "ADMIN",
    },
  });
  console.log("Created admin:", admin.email);

  // Create manager user
  const managerPassword = await bcrypt.hash("manager123", 12);
  const manager = await prisma.user.upsert({
    where: { email: "manager@pg.com" },
    update: {},
    create: {
      email: "manager@pg.com",
      password: managerPassword,
      name: "Manager User",
      phone: "9876543211",
      role: "MANAGER",
    },
  });
  console.log("Created manager:", manager.email);

  // Create property
  const property = await prisma.property.upsert({
    where: { id: "property-1" },
    update: {},
    create: {
      id: "property-1",
      name: "Sunshine PG",
      address: "123 Main Street",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560001",
      phone: "9876543200",
      email: "info@sunshinepg.com",
      managerId: manager.id,
    },
  });
  console.log("Created property:", property.name);

  // Create rooms with beds
  const roomTypes = [
    { roomNumber: "101", floor: 1, type: "SINGLE", beds: 1, rent: 12000 },
    { roomNumber: "102", floor: 1, type: "DOUBLE", beds: 2, rent: 8000 },
    { roomNumber: "103", floor: 1, type: "TRIPLE", beds: 3, rent: 6500 },
    { roomNumber: "201", floor: 2, type: "SINGLE", beds: 1, rent: 13000 },
    { roomNumber: "202", floor: 2, type: "DOUBLE", beds: 2, rent: 8500 },
    { roomNumber: "203", floor: 2, type: "DOUBLE", beds: 2, rent: 8500 },
    { roomNumber: "301", floor: 3, type: "TRIPLE", beds: 3, rent: 7000 },
    { roomNumber: "302", floor: 3, type: "QUAD", beds: 4, rent: 5500 },
  ];

  for (const roomData of roomTypes) {
    const room = await prisma.room.upsert({
      where: { propertyId_roomNumber: { propertyId: property.id, roomNumber: roomData.roomNumber } },
      update: {},
      create: {
        roomNumber: roomData.roomNumber,
        floor: roomData.floor,
        roomType: roomData.type as any,
        baseRent: roomData.rent,
        propertyId: property.id,
      },
    });

    // Create beds for each room
    for (let i = 1; i <= roomData.beds; i++) {
      await prisma.bed.upsert({
        where: { roomId_bedNumber: { roomId: room.id, bedNumber: `B${i}` } },
        update: {},
        create: {
          bedNumber: `B${i}`,
          roomId: room.id,
        },
      });
    }
    console.log(`Created room ${roomData.roomNumber} with ${roomData.beds} beds`);
  }

  // Create some sample tenants
  const tenants = [
    { name: "Rahul Sharma", phone: "9800000001", email: "rahul@email.com", room: "101", bed: "B1" },
    { name: "Priya Patel", phone: "9800000002", email: "priya@email.com", room: "102", bed: "B1" },
    { name: "Amit Kumar", phone: "9800000003", email: "amit@email.com", room: "102", bed: "B2" },
    { name: "Sneha Reddy", phone: "9800000004", email: "sneha@email.com", room: "201", bed: "B1" },
    { name: "Vikram Singh", phone: "9800000005", email: null, room: "103", bed: "B1" },
  ];

  for (const tenantData of tenants) {
    const room = await prisma.room.findFirst({
      where: { roomNumber: tenantData.room, propertyId: property.id },
    });
    if (!room) continue;

    const bed = await prisma.bed.findFirst({
      where: { bedNumber: tenantData.bed, roomId: room.id },
    });
    if (!bed) continue;

    const tenant = await prisma.tenant.upsert({
      where: { id: `tenant-${tenantData.phone}` },
      update: {},
      create: {
        id: `tenant-${tenantData.phone}`,
        name: tenantData.name,
        phone: tenantData.phone,
        email: tenantData.email,
        dateOfJoining: new Date("2024-01-15"),
        baseRent: room.baseRent,
        bedId: bed.id,
        status: "ACTIVE",
      },
    });

    await prisma.bed.update({
      where: { id: bed.id },
      data: { status: "OCCUPIED" },
    });

    // Create tenant user account
    const tenantPassword = await bcrypt.hash("tenant123", 12);
    const tenantUser = await prisma.user.upsert({
      where: { email: tenantData.email || `${tenantData.phone}@pg.com` },
      update: {},
      create: {
        email: tenantData.email || `${tenantData.phone}@pg.com`,
        password: tenantPassword,
        name: tenantData.name,
        phone: tenantData.phone,
        role: "TENANT",
      },
    });

    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { userId: tenantUser.id },
    });

    console.log(`Created tenant: ${tenantData.name}`);
  }

  // Create sample invoices for current month
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const activeTenants = await prisma.tenant.findMany({
    where: { status: "ACTIVE" },
  });

  for (const tenant of activeTenants) {
    const invoiceNumber = `INV-${currentYear}${currentMonth.toString().padStart(2, "0")}-${tenant.id.slice(-6).toUpperCase()}`;
    await prisma.invoice.upsert({
      where: { tenantId_month_year: { tenantId: tenant.id, month: currentMonth, year: currentYear } },
      update: {},
      create: {
        invoiceNumber,
        month: currentMonth,
        year: currentYear,
        baseRent: tenant.baseRent,
        totalAmount: tenant.baseRent,
        dueDate: new Date(currentYear, currentMonth - 1, 5),
        tenantId: tenant.id,
      },
    });
  }
  console.log("Created invoices for current month");

  // Create sample expenses
  const expenseCategories = [
    { category: "ELECTRICITY", description: "Electricity bill for the month", amount: 15000 },
    { category: "WATER", description: "Water bill", amount: 3000 },
    { category: "GROCERIES", description: "Groceries for common kitchen", amount: 8000 },
    { category: "MAINTENANCE", description: "Plumbing repair", amount: 2500 },
    { category: "INTERNET", description: "Broadband internet", amount: 1500 },
  ];

  for (const expenseData of expenseCategories) {
    await prisma.expense.create({
      data: {
        category: expenseData.category as any,
        description: expenseData.description,
        amount: expenseData.amount,
        expenseDate: new Date(),
        propertyId: property.id,
        recordedById: manager.id,
      },
    });
  }
  console.log("Created sample expenses");

  console.log("Database seeded successfully!");
  console.log("\nLogin credentials:");
  console.log("Admin: admin@pg.com / admin123");
  console.log("Manager: manager@pg.com / manager123");
  console.log("Tenant: 9800000001@pg.com / tenant123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
