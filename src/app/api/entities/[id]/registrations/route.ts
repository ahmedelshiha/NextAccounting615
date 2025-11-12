import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { entityService } from "@/services/entities";
import { tenantContext } from "@/lib/tenant-context";
import { logger } from "@/lib/logger";
import { z } from "zod";

// Validation schema for adding registration
const addRegistrationSchema = z.object({
  type: z.enum(["TRN", "ZATCA", "ZAKAT", "WHT", "ETA", "VAT"]),
  value: z.string().min(1),
  source: z.string().optional(),
});

/**
 * POST /api/entities/[id]/registrations
 * Add a registration (TRN, ZATCA, ETA, etc.) to an entity
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const input = addRegistrationSchema.parse(body);

    // Add registration
    await entityService.addRegistration(
      ctx.tenantId,
      params.id,
      session.user.id,
      input.type,
      input.value,
      input.source
    );

    logger.info("Registration added successfully", {
      entityId: params.id,
      type: input.type,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Registration added",
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

    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json(
          { error: "Not found or unauthorized" },
          { status: 404 }
        );
      }
      if (error.message.includes("Invalid") || error.message.includes("already has")) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }

    logger.error("Error adding registration", { error, entityId: params.id });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
