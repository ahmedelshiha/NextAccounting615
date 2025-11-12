import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { entityService } from "@/services/entities";
import { tenantContext } from "@/lib/tenant-context";
import { logger } from "@/lib/logger";

/**
 * GET /api/entities/[id]/audit-history
 * Get entity audit history/changelog
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
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : 50;

    // Get audit history
    const history = await entityService.getAuditHistory(
      ctx.tenantId,
      params.id,
      limit
    );

    return NextResponse.json({
      success: true,
      data: history,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Not found or unauthorized" },
        { status: 404 }
      );
    }

    logger.error("Error fetching audit history", { error, entityId: params.id });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
