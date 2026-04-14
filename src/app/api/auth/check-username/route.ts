import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json();
    if (!username) {
      return NextResponse.json({ message: "username이 필요합니다." }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { username } });
    return NextResponse.json({ exists: !!user });
  } catch {
    return NextResponse.json({ message: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
