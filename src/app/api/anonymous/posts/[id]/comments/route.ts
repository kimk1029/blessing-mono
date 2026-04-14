import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

// GET /api/anonymous/posts/:id/comments
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const comments = await prisma.anonymousComment.findMany({
      where: { postId: parseInt(id), parentId: null },
      orderBy: { createdAt: "asc" },
      include: {
        replies: { orderBy: { createdAt: "asc" } },
      },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

// POST /api/anonymous/posts/:id/comments
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ip = getIp(req);

  try {
    const { content, parentId } = await req.json();
    if (!content) {
      return NextResponse.json({ message: "내용은 필수입니다." }, { status: 400 });
    }

    const post = await prisma.anonymousPost.findUnique({ where: { id: parseInt(id) } });
    if (!post) {
      return NextResponse.json({ message: "게시글을 찾을 수 없습니다." }, { status: 404 });
    }

    if (parentId) {
      const parent = await prisma.anonymousComment.findUnique({ where: { id: parentId } });
      if (!parent) {
        return NextResponse.json({ message: "부모 댓글을 찾을 수 없습니다." }, { status: 404 });
      }
    }

    const comment = await prisma.anonymousComment.create({
      data: {
        content,
        ipAddress: ip,
        postId: parseInt(id),
        parentId: parentId || null,
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
