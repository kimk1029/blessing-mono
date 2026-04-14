import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLevelFromPoints } from "@/lib/level";
import bcrypt from "bcrypt";

// GET /api/account?id=123  (id 없으면 본인)
export async function GET(req: NextRequest) {
  const session = await auth();
  const { searchParams } = new URL(req.url);
  const idParam = searchParams.get("id");

  let userId: number;
  if (idParam) {
    userId = parseInt(idParam);
    if (isNaN(userId)) {
      return NextResponse.json({ message: "Invalid user id" }, { status: 400 });
    }
  } else if (session?.user?.id) {
    userId = parseInt(session.user.id);
  } else {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        affiliation: true,
        points: true,
        created_at: true,
      },
    });

    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    const [posts, comments] = await Promise.all([
      prisma.post.findMany({
        where: { authorId: userId },
        orderBy: { created_at: "desc" },
        include: { _count: { select: { comments: true, likes: true } } },
      }),
      prisma.comment.findMany({
        where: { authorId: userId },
        orderBy: { created_at: "desc" },
        include: { post: { select: { id: true, title: true } } },
      }),
    ]);

    const postsFormatted = posts.map((p: typeof posts[number]) => ({
      ...p,
      category: p.tag,
      imageUrls: p.images.map((img: string) => `/uploads/${img}`),
      comments: p._count.comments,
      likes: p._count.likes,
    }));

    const commentsFormatted = comments.map((c: typeof comments[number]) => ({
      ...c,
      postTitle: c.post?.title ?? null,
    }));

    return NextResponse.json({
      user: { ...user, level: getLevelFromPoints(user.points) },
      posts: postsFormatted,
      comments: commentsFormatted,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

// PATCH /api/account
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { username, password, affiliation } = await req.json();
    const userId = parseInt(session.user.id);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    const updateData: Record<string, unknown> = {};
    if (username) updateData.username = username;
    if (password) updateData.password = await bcrypt.hash(password, 10);
    if (typeof affiliation === "string") {
      updateData.affiliation = affiliation.trim() || null;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, username: true, email: true, affiliation: true, created_at: true },
    });

    return NextResponse.json({ message: "User updated", user: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
