import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { entityService } from "@/services/entities";
import { tenantContext } from "@/lib/tenant-context";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";

// Validation schema for setup wizard
const setupWizardSchema = z.object({
  country: z.string().length(2),
  tab: z.enum(["existing", "new", "individual"]),
  businessName: z.string().min(1).max(255),
  legalForm: z.string().optional(),
  licenseNumber: z.string().optional(),
  economicZoneId: z.string().optional(),
  registrations: z.array(z.object({
    type: z.string(),
    value: z.string(),
  })).optional(),
  consentVersion: z.string(),
  idempotencyKey: z.string().uuid(),
});

/**
 * POST /api/entities/setup
 * Idempotent entity setup endpoint from wizard
 * Returns entity_setup_id for tracking verification job
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const ctx = await tenantContext.getContext();
    const body = await request.json();

    // Validate input
    const input = setupWizardSchema.parse(body);

    // Check idempotency key
    const existingKey = await prisma.idempotencyKey.findUnique({
      where: {
        tenantId_key: {
          tenantId: ctx.tenantId,
          key: input.idempotencyKey,
        },
      },
    });

    if (existingKey?.entityId) {
      // Already processed - return existing entity
      return NextResponse.json({
        success: true,
        data: {
          entityId: existingKey.entityId,
          setupJobId: existingKey.entityId,
          status: "ALREADY_PROCESSED",
        },
      });
    }

    // Create entity with setup wizard data
    const entity = await entityService.createEntity(
      ctx.tenantId,
      session.user.id,
      {
        country: input.country,
        name: input.businessName,
        legalForm: input.legalForm,
        entityType: input.tab === "individual" ? "individual" : "company",
        licenses: input.licenseNumber ? [{
          country: input.country,
          authority: "DED", // Will be determined per country
          licenseNumber: input.licenseNumber,
          economicZoneId: input.economicZoneId,
        }] : undefined,
        registrations: input.registrations || [],
      }
    );

    // Record consent
    await prisma.consent.create({
      data: {
        tenantId: ctx.tenantId,
        entityId: entity.id,
        type: "terms",
        version: input.consentVersion,
        acceptedBy: session.user.id,
        ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
        userAgent: request.headers.get("user-agent") || undefined,
      },
    });

    // Mark idempotency key as processed
    if (existingKey) {
      await prisma.idempotencyKey.update({
        where: { id: existingKey.id },
        data: { entityId: entity.id, status: "PROCESSED" },
      });
    } else {
      await prisma.idempotencyKey.create({
        data: {
          tenantId: ctx.tenantId,
          key: input.idempotencyKey,
          userId: session.user.id,
          entityType: "entity",
          entityId: entity.id,
          status: "PROCESSED",
        },
      });
    }

    // Emit audit event
    await prisma.auditEvent.create({
      data: {
        tenantId: ctx.tenantId,
        userId: session.user.id,
        type: "entity.setup.requested",
        resource: "entity",
        details: {
          entityId: entity.id,
          country: input.country,
          tab: input.tab,
        },
      },
    });

    logger.info("Entity setup initiated", {
      entityId: entity.id,
      country: input.country,
      tab: input.tab,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          entityId: entity.id,
          setupJobId: entity.id,
          status: "PENDING_VERIFICATION",
          verificationEstimate: "~5 minutes",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    logger.error("Error in entity setup", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
