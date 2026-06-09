import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function generateMonthlyInvoices() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  console.log(`Generating invoices for ${month}/${year}...`);

  // Mark overdue invoices
  const overdueResult = await prisma.invoice.updateMany({
    where: {
      status: { in: ["PENDING", "PARTIALLY_PAID"] },
      dueDate: { lt: now },
    },
    data: { status: "OVERDUE" },
  });
  console.log(`Marked ${overdueResult.count} invoices as OVERDUE`);

  // Get all active tenants
  const activeTenants = await prisma.tenant.findMany({
    where: { status: "ACTIVE" },
  });

  let created = 0;
  let skipped = 0;

  for (const tenant of activeTenants) {
    // Check if invoice already exists
    const existing = await prisma.invoice.findUnique({
      where: {
        tenantId_month_year: {
          tenantId: tenant.id,
          month,
          year,
        },
      },
    });

    if (existing) {
      skipped++;
      continue;
    }

    const invoiceNumber = `INV-${year}${month.toString().padStart(2, "0")}-${tenant.id.slice(-6).toUpperCase()}`;

    await prisma.invoice.create({
      data: {
        invoiceNumber,
        month,
        year,
        baseRent: tenant.baseRent,
        totalAmount: tenant.baseRent,
        dueDate: new Date(year, month - 1, 5),
        tenantId: tenant.id,
      },
    });

    created++;
    console.log(`Created invoice for ${tenant.name}`);
  }

  console.log(`\nSummary:`);
  console.log(`- Created: ${created} invoices`);
  console.log(`- Skipped: ${skipped} (already exist)`);
  console.log(`- Marked overdue: ${overdueResult.count}`);
}

generateMonthlyInvoices()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
