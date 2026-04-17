import { NextResponse } from "next/server";
import { exportUserData } from "@/app/conta/actions";

export async function GET() {
  const data = await exportUserData();
  if ("error" in data) {
    return NextResponse.json({ error: data.error }, { status: 401 });
  }

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="forte365-dados-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
