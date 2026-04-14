import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile } from "fs/promises";
import path from "path";

// GET /api/affiliations/posts  (본인 소속 게시글 목록)
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  try {
    const me = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      select: { affiliation: true },
    });

    if (!me?.affiliation?.trim()) {
      return NextResponse.json(
        { message: "소속 정보가 없습니다. 프로필에서 소속을 설정해주세요." },
        { status: 400 }
      );
    }

    const posts = await prisma.affiliationPost.findMany({
      where: { affiliation: me.affiliation },
      orderBy: { created_at: "desc" },
      include: {
        author: { select: { id: true, username: true, affiliation: true } },
      },
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

// POST /api/affiliations/posts
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      select: { affiliation: true },
    });

    if (!user?.affiliation?.trim()) {
      return NextResponse.json(
        { message: "소속 정보가 없습니다. 프로필에서 소속을 설정해주세요." },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const imageFile = formData.get("image") as File | null;

    if (!title || !content) {
      return NextResponse.json({ message: "제목과 내용은 필수입니다." }, { status: 400 });
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

    const post = await prisma.affiliationPost.create({
      data: {
        title,
        content,
        images,
        affiliation: user.affiliation,
        authorId: parseInt(session.user.id),
      },
      include: {
        author: { select: { id: true, username: true } },
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
