import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { searchDirectoryDepartments } from "@/lib/directory";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const q = request.nextUrl.searchParams.get("q") ?? "";
    if (!q.trim()) {
      return NextResponse.json({ items: [] });
    }

    return NextResponse.json(await searchDirectoryDepartments(q));
  } catch (error) {
    console.error("[GET /api/directory/departments/search]", error);
    return NextResponse.json(
      { error: "Department search is temporarily unavailable" },
      { status: 502 },
    );
  }
}
