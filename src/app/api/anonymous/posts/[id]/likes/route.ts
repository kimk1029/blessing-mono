import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

// POST /api/anonymous/posts/:id/likes (toggle)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ip = getIp(req);
  const postId = parseInt(id);

  try {
    const post = await prisma.anonymousPost.findUnique({ where: { id: postId } });
    if (!post) return NextResponse.json({ message: "게시글을 찾을 수 없습니다." }, { status: 404 });

    const existing = await prisma.anonymousLike.findUnique({
      where: { postId_ipAddress: { postId, ipAddress: ip } },
    });

    if (existing) {
      await prisma.anonymousLike.delete({
        where: { postId_ipAddress: { postId, ipAddress: ip } },
      });
      return NextResponse.json({ message: "좋아요가 취소되었습니다.", liked: false });
    } else {
      await prisma.anonymousLike.create({ data: { postId, ipAddress: ip } });
      return NextResponse.json({ message: "좋아요가 추가되었습니다.", liked: true });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
