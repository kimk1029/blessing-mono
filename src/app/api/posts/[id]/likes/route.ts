import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/posts/:id/likes (toggle)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const postId = parseInt(id);
  const userId = parseInt(session.user.id);

  try {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }

    const existing = await prisma.like.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (existing) {
      await prisma.like.delete({ where: { postId_userId: { postId, userId } } });
      // 작성자 포인트 -1 (최소 0)
      await prisma.user.update({
        where: { id: post.authorId },
        data: { points: { decrement: 1 } },
      });
      return NextResponse.json({ message: "Like removed", liked: false });
    } else {
      await prisma.like.create({ data: { postId, userId } });
      // 작성자 포인트 +1
      await prisma.user.update({
        where: { id: post.authorId },
        data: { points: { increment: 1 } },
      });
      return NextResponse.json({ message: "Like added", liked: true }, { status: 201 });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
