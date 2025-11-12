import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { entityService } from "@/services/entities";
import { tenantContext } from "@/lib/tenant-context";
import { logger } from "@/lib/logger";
import { z } from "zod";

// Validation schema for entity updates
const updateEntitySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  legalForm: z.string().optional(),
  status: z.enum(["ACTIVE", "PENDING", "ARCHIVED", "SUSPENDED"]).optional(),
  activityCode: z.string().optional(),
});

/**
 * GET /api/entities/[id]
 * Get entity details
 */
export async function GET(
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
    const entity = await entityService.getEntity(ctx.tenantId, params.id);

    return NextResponse.json({
      success: true,
      data: entity,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Not found or unauthorized" },
        { status: 404 }
      );
    }

    logger.error("Error fetching entity", { error, entityId: params.id });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/entities/[id]
 * Update entity
 */
export async function PATCH(
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
    const input = updateEntitySchema.parse(body);

    // Update entity
    const entity = await entityService.updateEntity(
      ctx.tenantId,
      params.id,
      session.user.id,
      input
    );

    logger.info("Entity updated successfully", {
      entityId: entity.id,
    });

    return NextResponse.json({
      success: true,
      data: entity,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Not found or unauthorized" },
        { status: 404 }
      );
    }

    logger.error("Error updating entity", { error, entityId: params.id });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/entities/[id]
 * Archive or delete entity
 */
export async function DELETE(
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
    const searchParams = request.nextUrl.searchParams;
    const permanent = searchParams.get("permanent") === "true";

    if (permanent) {
      // Hard delete (requires archived status)
      await entityService.deleteEntity(ctx.tenantId, params.id, session.user.id);
    } else {
      // Soft delete (archive)
      await entityService.archiveEntity(ctx.tenantId, params.id, session.user.id);
    }

    logger.info("Entity deleted/archived successfully", {
      entityId: params.id,
      permanent,
    });

    return NextResponse.json({
      success: true,
      message: permanent ? "Entity deleted" : "Entity archived",
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Not found or unauthorized" },
        { status: 404 }
      );
    }

    logger.error("Error deleting entity", { error, entityId: params.id });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
