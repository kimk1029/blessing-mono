import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PostTag } from "@/types";
import { writeFile } from "fs/promises";
import path from "path";

const VALID_TAGS: PostTag[] = [
  "technology",
  "science",
  "health",
  "business",
  "entertainment",
  "news",
];

// GET /api/posts?category=technology&page=1
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") as PostTag | null;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where = category && VALID_TAGS.includes(category) ? { tag: category } : {};

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
        include: {
          author: { select: { id: true, username: true, affiliation: true } },
          _count: { select: { comments: true, likes: true } },
        },
      }),
      prisma.post.count({ where }),
    ]);

    const formatted = posts.map((p: typeof posts[number]) => ({
      id: p.id,
      title: p.title,
      content: p.content,
      tag: p.tag,
      category: p.tag,
      images: p.images,
      views: p.views,
      created_at: p.created_at,
      author: p.author,
      comments: p._count.comments,
      likes: p._count.likes,
    }));

    return NextResponse.json({ posts: formatted, total, page, limit });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

// POST /api/posts
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const category = formData.get("category") as PostTag;
    const imageFile = formData.get("image") as File | null;

    if (!title || !content || !category) {
      return NextResponse.json(
        { message: "제목, 내용, 카테고리는 필수입니다." },
        { status: 400 }
      );
    }

    if (!VALID_TAGS.includes(category)) {
      return NextResponse.json(
        { message: "유효하지 않은 카테고리입니다." },
        { status: 400 }
      );
    }

    let images: string[] = [];
    if (imageFile && imageFile.size > 0) {
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `${Date.now()}-${imageFile.name}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await writeFile(path.join(uploadDir, filename), buffer);
      images = [filename];
    }

    const post = await prisma.post.create({
      data: {
        title,
        content,
        tag: category,
        images,
        authorId: parseInt(session.user.id),
      },
      include: {
        author: { select: { id: true, username: true } },
      },
    });

    // 게시글 작성 보상 +10 포인트
    await prisma.user.update({
      where: { id: parseInt(session.user.id) },
      data: { points: { increment: 10 } },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
