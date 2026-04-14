import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/posts/:id
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  try {
    // 조회수 증가
    await prisma.post.update({
      where: { id: parseInt(id) },
      data: { views: { increment: 1 } },
    });

    const post = await prisma.post.findUnique({
      where: { id: parseInt(id) },
      include: {
        author: { select: { id: true, username: true, affiliation: true } },
        _count: { select: { comments: true, likes: true } },
      },
    });

    if (!post) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }

    let liked = false;
    if (session?.user?.id) {
      const like = await prisma.like.findUnique({
        where: {
          postId_userId: {
            postId: post.id,
            userId: parseInt(session.user.id),
          },
        },
      });
      liked = !!like;
    }

    return NextResponse.json({
      ...post,
      category: post.tag,
      imageUrls: post.images.map((img: string) => `/uploads/${img}`),
      commentCount: post._count.comments,
      likeCount: post._count.likes,
      liked,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

// PATCH /api/posts/:id
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, content } = await req.json();
    if (!title || !content) {
      return NextResponse.json({ message: "Please provide title and content" }, { status: 400 });
    }

    const post = await prisma.post.findUnique({ where: { id: parseInt(id) } });
    if (!post) return NextResponse.json({ message: "Post not found" }, { status: 404 });
    if (post.authorId !== parseInt(session.user.id)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.post.update({
      where: { id: parseInt(id) },
      data: { title, content },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

// DELETE /api/posts/:id
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const post = await prisma.post.findUnique({ where: { id: parseInt(id) } });
    if (!post) return NextResponse.json({ message: "Post not found" }, { status: 404 });
    if (post.authorId !== parseInt(session.user.id)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await prisma.post.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
