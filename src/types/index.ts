export type PostTag =
  | "technology"
  | "science"
  | "health"
  | "business"
  | "entertainment"
  | "news";

export interface Author {
  id: number;
  username: string;
  affiliation?: string | null;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  tag: PostTag;
  category?: PostTag;
  images: string[];
  imageUrls?: string[];
  views: number;
  created_at: string;
  author: Author;
  comments: number;
  likes: number;
  liked?: boolean;
  commentCount?: number;
  likeCount?: number;
}

export interface Comment {
  id: number;
  content: string;
  created_at: string;
  author: Author;
  parentId?: number | null;
  replies?: Comment[];
}

export interface AnonymousPost {
  id: number;
  title: string;
  content: string;
  views: number;
  created_at: string;
  comments: number;
  likes: number;
  isAuthor?: boolean;
}

export interface AnonymousComment {
  id: string;
  content: string;
  createdAt: string;
  parentId?: string | null;
  replies?: AnonymousComment[];
}

export interface AffiliationPost {
  id: number;
  title: string;
  content: string;
  affiliation: string | null;
  images: string[];
  views: number;
  created_at: string;
  author: Author;
}

export interface LevelInfo {
  level: number;
  title: string;
  nextLevelPoints: number | null;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  affiliation?: string | null;
  points: number;
  created_at: string;
  level?: LevelInfo;
}

export const POST_TAGS: PostTag[] = [
  "technology",
  "science",
  "health",
  "business",
  "entertainment",
  "news",
];

export const TAG_LABELS: Record<PostTag, string> = {
  technology: "기술",
  science: "과학",
  health: "건강",
  business: "비즈니스",
  entertainment: "엔터테인먼트",
  news: "뉴스",
};
