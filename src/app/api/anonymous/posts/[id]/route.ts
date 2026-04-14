import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

// GET /api/anonymous/posts/:id
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ip = getIp(req);

  try {
    const post = await prisma.anonymousPost.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: { select: { comments: true, likes: true } },
      },
    });

    if (!post) {
      return NextResponse.json({ message: "게시글을 찾을 수 없습니다." }, { status: 404 });
    }

    await prisma.anonymousPost.update({
      where: { id: post.id },
      data: { views: { increment: 1 } },
    });

    return NextResponse.json({
      ...post,
      isAuthor: post.ipAddress === ip,
      comments: post._count.comments,
      likes: post._count.likes,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

// PATCH /api/anonymous/posts/:id
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ip = getIp(req);

  try {
    const { title, content } = await req.json();
    const post = await prisma.anonymousPost.findUnique({ where: { id: parseInt(id) } });
    if (!post) return NextResponse.json({ message: "게시글을 찾을 수 없습니다." }, { status: 404 });
    if (post.ipAddress !== ip) return NextResponse.json({ message: "수정 권한이 없습니다." }, { status: 403 });

    const updated = await prisma.anonymousPost.update({
      where: { id: parseInt(id) },
      data: { title, content },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

// DELETE /api/anonymous/posts/:id
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ip = getIp(req);

  try {
    const post = await prisma.anonymousPost.findUnique({ where: { id: parseInt(id) } });
    if (!post) return NextResponse.json({ message: "게시글을 찾을 수 없습니다." }, { status: 404 });
    if (post.ipAddress !== ip) return NextResponse.json({ message: "삭제 권한이 없습니다." }, { status: 403 });

    await prisma.anonymousPost.delete({ where: { id: parseInt(id) } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
