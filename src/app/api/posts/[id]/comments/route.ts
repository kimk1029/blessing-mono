import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/posts/:id/comments
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const comments = await prisma.comment.findMany({
      where: { postId: parseInt(id), parentId: null },
      orderBy: { created_at: "asc" },
      include: {
        author: { select: { id: true, username: true } },
        replies: {
          orderBy: { created_at: "asc" },
          include: {
            author: { select: { id: true, username: true } },
          },
        },
      },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

// POST /api/posts/:id/comments
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "인증되지 않은 사용자입니다." }, { status: 401 });
  }

  try {
    const { content, parentId } = await req.json();
    if (!content) {
      return NextResponse.json({ message: "댓글 내용을 입력해주세요." }, { status: 400 });
    }

    const post = await prisma.post.findUnique({ where: { id: parseInt(id) } });
    if (!post) {
      return NextResponse.json({ message: "게시글을 찾을 수 없습니다." }, { status: 404 });
    }

    if (parentId) {
      const parentComment = await prisma.comment.findUnique({ where: { id: parseInt(parentId) } });
      if (!parentComment) {
        return NextResponse.json({ message: "부모 댓글을 찾을 수 없습니다." }, { status: 404 });
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        authorId: parseInt(session.user.id),
        postId: parseInt(id),
        parentId: parentId ? parseInt(parentId) : null,
      },
      include: {
        author: { select: { id: true, username: true } },
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
