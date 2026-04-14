import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/anonymous/posts
export async function GET() {
  try {
    const posts = await prisma.anonymousPost.findMany({
      orderBy: { created_at: "desc" },
      include: {
        _count: { select: { comments: true, likes: true } },
      },
    });

    const formatted = posts.map((p: typeof posts[number]) => ({
      id: p.id,
      title: p.title,
      content: p.content,
      views: p.views,
      created_at: p.created_at,
      comments: p._count.comments,
      likes: p._count.likes,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

// POST /api/anonymous/posts
export async function POST(req: NextRequest) {
  try {
    const { title, content } = await req.json();
    if (!title || !content) {
      return NextResponse.json({ message: "제목과 내용은 필수입니다." }, { status: 400 });
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const post = await prisma.anonymousPost.create({
      data: { title, content, ipAddress: ip },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
