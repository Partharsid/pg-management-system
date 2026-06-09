import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function sendReminders() {
  const now = new Date();

  console.log("Checking for overdue invoices...");

  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      status: { in: ["OVERDUE", "PENDING", "PARTIALLY_PAID"] },
      dueDate: { lt: now },
    },
    include: {
      tenant: true,
    },
  });

  let remindersSent = 0;

  for (const invoice of overdueInvoices) {
    const due = Number(invoice.totalAmount) - Number(invoice.paidAmount);
    if (due <= 0) continue;

    const message = `Dear ${invoice.tenant.name}, your rent payment of ₹${due.toLocaleString()} for invoice ${invoice.invoiceNumber} is overdue. Please make the payment at your earliest convenience.`;

    // Check if reminder already sent today
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const existingReminder = await prisma.reminder.findFirst({
      where: {
        tenantId: invoice.tenantId,
        invoiceId: invoice.id,
        createdAt: { gte: todayStart },
      },
    });

    if (existingReminder) continue;

    await prisma.reminder.create({
      data: {
        type: "SYSTEM",
        status: "SENT",
        message,
        sentAt: now,
        tenantId: invoice.tenantId,
        invoiceId: invoice.id,
      },
    });

    remindersSent++;
    console.log(`Reminder sent to ${invoice.tenant.name} for ${invoice.invoiceNumber}`);
  }

  console.log(`\nSent ${remindersSent} reminders`);
}

sendReminders()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
