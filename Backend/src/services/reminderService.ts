import prisma from '../prisma';

export const scanAndGenerateReminders = async () => {
  const sentLogs: any[] = [];
  const today = new Date();
  
  // 1. License Expiry Check (warning threshold: 30 days)
  const licenseThreshold = new Date();
  licenseThreshold.setDate(today.getDate() + 30);

  const expiringDrivers = await prisma.driver.findMany({
    where: {
      license_expiry_date: {
        gte: today,
        lte: licenseThreshold
      }
    }
  });

  for (const driver of expiringDrivers) {
    const recipient = driver.user_id 
      ? (await prisma.user.findUnique({ where: { id: driver.user_id } }))?.email || 'driver@transitops.com'
      : 'driver@transitops.com';
      
    const subject = `⚠️ URGENT: Driver License Expiration Alert - ${driver.name}`;
    const body = `Dear ${driver.name},\n\nThis is an automated reminder that your vehicle driving license (No: ${driver.license_number}) is set to expire on ${new Date(driver.license_expiry_date).toLocaleDateString()}. Please submit your renewed license documents to the administration console immediately to avoid suspension of active routes.\n\nBest Regards,\nTransitOps Operations Team`;

    // Avoid duplicate reminders for the same driver on the same day
    const existing = await prisma.reminder.findFirst({
      where: {
        recipient,
        type: 'License_Expiry',
        sent_at: {
          gte: new Date(today.getFullYear(), today.getMonth(), today.getDate())
        }
      }
    });

    if (!existing) {
      const reminder = await prisma.reminder.create({
        data: {
          type: 'License_Expiry',
          recipient,
          subject,
          body,
          status: 'Sent'
        }
      });
      sentLogs.push(reminder);
      console.log(`[Simulated Email Sent] To: ${recipient} | Subject: ${subject}`);
    }
  }

  // 2. Upcoming Maintenance Check (warning threshold: 3 days)
  const maintenanceThreshold = new Date();
  maintenanceThreshold.setDate(today.getDate() + 3);

  const urgentMaintenance = await prisma.maintenanceLog.findMany({
    where: {
      status: 'Scheduled',
      start_date: {
        gte: today,
        lte: maintenanceThreshold
      }
    },
    include: {
      vehicle: true
    }
  });

  for (const log of urgentMaintenance) {
    const recipient = 'fleet-manager@transitops.com';
    const subject = `🔧 Maintenance Scheduled Reminder: Vehicle ${log.vehicle.registration_number}`;
    const body = `Dear Operations Manager,\n\nVehicle ${log.vehicle.registration_number} (${log.vehicle.name_model}) is scheduled for a "${log.maintenance_type}" service starting on ${new Date(log.start_date).toLocaleDateString()}.\n\nDescription: ${log.description || 'Routine service'}\n\nPlease ensure dispatch vectors are cleared for this vehicle.\n\nBest Regards,\nTransitOps Maintenance Dispatcher`;

    const existing = await prisma.reminder.findFirst({
      where: {
        recipient,
        type: 'Maintenance',
        sent_at: {
          gte: new Date(today.getFullYear(), today.getMonth(), today.getDate())
        }
      }
    });

    if (!existing) {
      const reminder = await prisma.reminder.create({
        data: {
          type: 'Maintenance',
          recipient,
          subject,
          body,
          status: 'Sent'
        }
      });
      sentLogs.push(reminder);
      console.log(`[Simulated Email Sent] To: ${recipient} | Subject: ${subject}`);
    }
  }

  return sentLogs;
};

export const sendManualReminder = async (type: string, recipient: string, subject: string, body: string) => {
  const reminder = await prisma.reminder.create({
    data: {
      type,
      recipient,
      subject,
      body,
      status: 'Sent'
    }
  });
  console.log(`[Manual Simulated Email Sent] To: ${recipient} | Subject: ${subject}`);
  return reminder;
};
