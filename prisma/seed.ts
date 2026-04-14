// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require("@prisma/client");
import bcrypt from "bcrypt";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new (PrismaClient as any)();

async function main() {
  console.log("Seeding database...");

  // 기본 사용자 생성
  const hashedPassword = await bcrypt.hash("devpass", 10);
  const user = await prisma.user.upsert({
    where: { email: "dev@example.com" },
    update: {},
    create: {
      username: "devuser",
      email: "dev@example.com",
      password: hashedPassword,
      points: 0,
    },
  });

  console.log("Created user:", user.username);

  // 더미 게시글
  const tags = [
    "technology",
    "science",
    "health",
    "business",
    "entertainment",
    "news",
  ] as const;

  const existingCount = await prisma.post.count();
  if (existingCount === 0) {
    const posts = await prisma.post.createMany({
      data: Array.from({ length: 10 }, (_, i) => ({
        title: `더미 게시글 ${i + 1}`,
        content: `이것은 더미 내용 ${i + 1} 입니다. 실제 내용으로 교체하세요.`,
        tag: tags[i % tags.length],
        images: [],
        authorId: user.id,
      })),
    });
    console.log(`Created ${posts.count} dummy posts`);
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
