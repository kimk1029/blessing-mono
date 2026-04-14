import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/affiliations/posts/:id
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  try {
    const me = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      select: { affiliation: true },
    });

    const post = await prisma.affiliationPost.findUnique({
      where: { id: parseInt(id) },
      include: { author: { select: { id: true, username: true, affiliation: true } } },
    });

    if (!post) return NextResponse.json({ message: "게시글을 찾을 수 없습니다." }, { status: 404 });

    if ((post.affiliation || "").trim() !== (me?.affiliation || "").trim()) {
      return NextResponse.json({ message: "접근 권한이 없습니다." }, { status: 403 });
    }

    await prisma.affiliationPost.update({
      where: { id: parseInt(id) },
      data: { views: { increment: 1 } },
    });

    return NextResponse.json({ ...post, views: post.views + 1 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

// PATCH /api/affiliations/posts/:id
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  try {
    const post = await prisma.affiliationPost.findUnique({ where: { id: parseInt(id) } });
    if (!post) return NextResponse.json({ message: "게시글을 찾을 수 없습니다." }, { status: 404 });
    if (post.authorId !== parseInt(session.user.id)) {
      return NextResponse.json({ message: "작성자만 수정할 수 있습니다." }, { status: 403 });
    }

    const { title, content } = await req.json();
    const updated = await prisma.affiliationPost.update({
      where: { id: parseInt(id) },
      data: { title: title ?? post.title, content: content ?? post.content },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

// DELETE /api/affiliations/posts/:id
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  try {
    const post = await prisma.affiliationPost.findUnique({ where: { id: parseInt(id) } });
    if (!post) return NextResponse.json({ message: "게시글을 찾을 수 없습니다." }, { status: 404 });
    if (post.authorId !== parseInt(session.user.id)) {
      return NextResponse.json({ message: "작성자만 삭제할 수 있습니다." }, { status: 403 });
    }

    await prisma.affiliationPost.delete({ where: { id: parseInt(id) } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
