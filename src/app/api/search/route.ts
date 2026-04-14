import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/search?q=keyword
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || searchParams.get("query") || "").trim();

  if (!q) {
    return NextResponse.json({ message: "검색어를 입력해주세요." }, { status: 400 });
  }

  try {
    const posts = await prisma.post.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { content: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { created_at: "desc" },
      include: {
        author: { select: { id: true, username: true } },
        _count: { select: { comments: true, likes: true } },
      },
    });

    const formatted = posts.map((p: typeof posts[number]) => ({
      id: p.id,
      title: p.title,
      content: p.content,
      tag: p.tag,
      category: p.tag,
      images: p.images,
      imageUrls: p.images.map((img: string) => `/uploads/${img}`),
      views: p.views,
      created_at: p.created_at,
      author: p.author,
      comments: p._count.comments,
      likes: p._count.likes,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
