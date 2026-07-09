import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/** Demo login: studio@vynedres.com / studio123 */
const DEMO_PASSWORD = "studio123";

/** Demo portal invite (raw token — only the hash is stored). */
const DEMO_PORTAL_TOKEN = "demo-portal-amara-2026";

function hashPortalToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function main() {
  // Self-contained hash (matches src/lib/auth.ts) so the seed has no runtime
  // dependency on the app source — important for the production Docker image,
  // whose runner stage ships only dist/.
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const tenant = await prisma.tenant.upsert({
    where: { slug: "vynedres" },
    update: {},
    create: {
      slug: "vynedres",
      name: "VYNEDRES",
      currency: "GBP",
    },
  });

  await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: "studio@vynedres.com",
      },
    },
    update: {
      passwordHash,
      name: "VYNEDRES Studio",
      role: "OWNER",
    },
    create: {
      tenantId: tenant.id,
      email: "studio@vynedres.com",
      name: "VYNEDRES Studio",
      passwordHash,
      role: "OWNER",
    },
  });

  let client = await prisma.client.findFirst({
    where: { tenantId: tenant.id, email: "amara@example.com" },
  });

  if (!client) {
    client = await prisma.client.create({
      data: {
        tenantId: tenant.id,
        firstName: "Amara",
        lastName: "Okonkwo",
        email: "amara@example.com",
        phone: "+44 7700 900000",
        notes: "Demo client for development",
        measurements: {
          create: {
            tenantId: tenant.id,
            label: "Initial fitting",
            data: {
              chest: 92,
              waist: 76,
              hips: 98,
              shoulder: 42,
              sleeve: 62,
              inseam: 78,
              unit: "cm",
            },
          },
        },
      },
    });
  }

  const existingOrder = await prisma.order.findFirst({
    where: { tenantId: tenant.id, orderNumber: "VYN-2026-0001" },
  });

  if (!existingOrder) {
    const order = await prisma.order.create({
      data: {
        tenantId: tenant.id,
        clientId: client.id,
        orderNumber: "VYN-2026-0001",
        garmentType: "Bespoke Evening Gown",
        fabric: "Midnight silk crepe",
        styleNotes: "Floor-length, off-shoulder, fitted bodice",
        price: 1200,
        deposit: 400,
        status: "DELIVERED",
        statusHistory: {
          create: [
            { status: "NEW", note: "Order created" },
            { status: "IN_PROGRESS", note: "Pattern cutting started" },
            { status: "FITTING", note: "First fitting scheduled" },
            { status: "READY", note: "Finishing complete" },
            { status: "DELIVERED", note: "Collected by client — fit confirmed" },
          ],
        },
        fittingRounds: {
          create: [
            {
              tenantId: tenant.id,
              roundNumber: 1,
              label: "First fitting",
              measurements: {
                chest: 92,
                waist: 79,
                hips: 98,
                shoulder: 42,
                sleeve: 62,
                inseam: 78,
                unit: "cm",
              },
              alterations: "Take in waist 1cm at side seams",
              notes: "Client prefers slightly closer fit at waist",
            },
            {
              tenantId: tenant.id,
              roundNumber: 2,
              label: "Second fitting",
              measurements: {
                chest: 92,
                waist: 77,
                hips: 98,
                shoulder: 42,
                sleeve: 62,
                inseam: 78,
                unit: "cm",
              },
              alterations: "Final waist adjustment complete — ready for finishing",
              notes: "Client approved fit at waist and bodice",
            },
          ],
        },
        outcome: {
          create: {
            fitSuccess: true,
            remakeRequired: false,
            notes: "Excellent final fit — client delighted at collection",
          },
        },
      },
    });
    console.log("Created demo order:", order.orderNumber);
  } else {
    const hasRound = await prisma.fittingRound.findFirst({
      where: { orderId: existingOrder.id, roundNumber: 1 },
    });
    if (!hasRound) {
      await prisma.fittingRound.create({
        data: {
          tenantId: tenant.id,
          orderId: existingOrder.id,
          roundNumber: 1,
          label: "First fitting",
          measurements: {
            chest: 92,
            waist: 79,
            hips: 98,
            shoulder: 42,
            sleeve: 62,
            inseam: 78,
            unit: "cm",
          },
          alterations: "Take in waist 1cm at side seams",
        },
      });
      console.log("Added demo fitting round 1 to", existingOrder.orderNumber);
    }

    const hasRound2 = await prisma.fittingRound.findFirst({
      where: { orderId: existingOrder.id, roundNumber: 2 },
    });
    if (!hasRound2) {
      await prisma.fittingRound.create({
        data: {
          tenantId: tenant.id,
          orderId: existingOrder.id,
          roundNumber: 2,
          label: "Second fitting",
          measurements: {
            chest: 92,
            waist: 77,
            hips: 98,
            shoulder: 42,
            sleeve: 62,
            inseam: 78,
            unit: "cm",
          },
          alterations: "Final waist adjustment complete — ready for finishing",
          notes: "Client approved fit at waist and bodice",
        },
      });
      console.log("Added demo fitting round 2 to", existingOrder.orderNumber);
    }

    const hasOutcome = await prisma.orderOutcome.findUnique({
      where: { orderId: existingOrder.id },
    });
    if (!hasOutcome) {
      await prisma.orderOutcome.create({
        data: {
          orderId: existingOrder.id,
          fitSuccess: true,
          remakeRequired: false,
          notes: "Excellent final fit — client delighted at collection",
        },
      });
      console.log("Added delivery outcome to", existingOrder.orderNumber);
    }

    if (existingOrder.status !== "DELIVERED") {
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: existingOrder.id },
          data: { status: "DELIVERED" },
        });
        const deliveredHistory = await tx.orderStatusHistory.findFirst({
          where: { orderId: existingOrder.id, status: "DELIVERED" },
        });
        if (!deliveredHistory) {
          await tx.orderStatusHistory.create({
            data: {
              orderId: existingOrder.id,
              status: "DELIVERED",
              note: "Collected by client — fit confirmed",
            },
          });
        }
      });
      console.log("Marked", existingOrder.orderNumber, "as DELIVERED");
    }
  }

  // Portal invite for Amara — email alone is not enough; clients need this link.
  const tokenHash = hashPortalToken(DEMO_PORTAL_TOKEN);
  const existingInvite = await prisma.portalAccessToken.findFirst({
    where: { clientId: client.id, revokedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!existingInvite) {
    await prisma.portalAccessToken.create({
      data: {
        tenantId: tenant.id,
        clientId: client.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    });
  } else if (existingInvite.tokenHash !== tokenHash) {
    await prisma.portalAccessToken.update({
      where: { id: existingInvite.id },
      data: {
        tokenHash,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        revokedAt: null,
        lastUsedAt: null,
      },
    });
  }

  console.log("Seed complete — studio slug: vynedres");
  console.log(`Login: studio@vynedres.com / ${DEMO_PASSWORD}`);
  console.log(
    `Portal invite: http://localhost:3000/portal/vynedres?token=${DEMO_PORTAL_TOKEN}`,
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
