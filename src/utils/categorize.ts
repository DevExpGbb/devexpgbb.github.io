// Categorization utility for GitHub repositories
// This file contains logic to automatically categorize repos based on their metadata

export type RepoCategory =
  | "workshop"
  | "demo"
  | "template"
  | "library"
  | "tool"
  | "infrastructure"
  | "sample"
  | "other";

export interface CategoryInfo {
  name: RepoCategory;
  label: string;
  color: string;
  bgColor: string;
  emoji: string;
}

export const CATEGORIES: Record<RepoCategory, CategoryInfo> = {
  workshop: {
    name: "workshop",
    label: "Workshop",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    emoji: "🎓",
  },
  demo: {
    name: "demo",
    label: "Demo",
    color: "text-green-700",
    bgColor: "bg-green-100",
    emoji: "🎪",
  },
  template: {
    name: "template",
    label: "Template",
    color: "text-purple-700",
    bgColor: "bg-purple-100",
    emoji: "📋",
  },
  library: {
    name: "library",
    label: "Library",
    color: "text-orange-700",
    bgColor: "bg-orange-100",
    emoji: "📚",
  },
  tool: {
    name: "tool",
    label: "Tool",
    color: "text-cyan-700",
    bgColor: "bg-cyan-100",
    emoji: "🛠️",
  },
  infrastructure: {
    name: "infrastructure",
    label: "Infrastructure",
    color: "text-slate-700",
    bgColor: "bg-slate-100",
    emoji: "🏗️",
  },
  sample: {
    name: "sample",
    label: "Sample",
    color: "text-pink-700",
    bgColor: "bg-pink-100",
    emoji: "🧪",
  },
  other: {
    name: "other",
    label: "Other",
    color: "text-gray-700",
    bgColor: "bg-gray-100",
    emoji: "📦",
  },
};

// Keywords mapped to categories (order matters - first match wins)
const CATEGORY_KEYWORDS: [RepoCategory, string[]][] = [
  ["workshop", ["workshop", "hands-on", "lab", "training", "learn"]],
  ["demo", ["demo", "showcase", "example", "poc", "proof-of-concept"]],
  ["template", ["template", "starter", "boilerplate", "scaffold", "bootstrap"]],
  ["library", ["lib", "library", "sdk", "package", "module", "common-"]],
  [
    "tool",
    ["tool", "cli", "util", "helper", "bot", "automation", "action", "runner"],
  ],
  [
    "infrastructure",
    ["infra", "terraform", "bicep", "iac", "hub-spoke", "network"],
  ],
  ["sample", ["sample", "samples", "examples", "test", "testing"]],
];

export interface Repository {
  name: string;
  description: string | null;
  url: string;
  owner: { id: string; login: string };
  isArchived: boolean;
  isFork: boolean;
  repositoryTopics: { name: string }[] | null;
  languages: { size: number; node: { name: string } }[];
  primaryLanguage: { name: string } | null;
  createdAt: string;
  updatedAt: string;
  stargazerCount: number;
  topContributor: { login: string; avatarUrl: string } | null;
}

export interface CategorizedRepository extends Repository {
  category: RepoCategory;
  categoryInfo: CategoryInfo;
}

/**
 * Categorizes a repository based on its name, description, and topics
 */
export function categorizeRepo(repo: Repository): RepoCategory {
  const searchText = [
    repo.name.toLowerCase(),
    (repo.description || "").toLowerCase(),
    ...(repo.repositoryTopics?.map((t) => t.name.toLowerCase()) || []),
  ].join(" ");

  for (const [category, keywords] of CATEGORY_KEYWORDS) {
    if (keywords.some((keyword) => searchText.includes(keyword))) {
      return category;
    }
  }

  // Check if it's primarily infrastructure code
  if (
    repo.primaryLanguage?.name === "HCL" ||
    repo.primaryLanguage?.name === "Bicep"
  ) {
    return "infrastructure";
  }

  return "other";
}

/**
 * Categorizes all repositories and returns them with category info
 */
export function categorizeRepositories(
  repos: Repository[],
): CategorizedRepository[] {
  return repos.map((repo) => {
    const category = categorizeRepo(repo);
    return {
      ...repo,
      category,
      categoryInfo: CATEGORIES[category],
    };
  });
}

/**
 * Groups repositories by category
 */
export function groupByCategory(
  repos: CategorizedRepository[],
): Record<RepoCategory, CategorizedRepository[]> {
  const grouped = {} as Record<RepoCategory, CategorizedRepository[]>;

  for (const category of Object.keys(CATEGORIES) as RepoCategory[]) {
    grouped[category] = [];
  }

  for (const repo of repos) {
    grouped[repo.category].push(repo);
  }

  return grouped;
}

/**
 * Formats a date string to a human-readable format
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Gets the top languages from a repository
 */
export function getTopLanguages(repo: Repository, limit = 3): string[] {
  return repo.languages
    .sort((a, b) => b.size - a.size)
    .slice(0, limit)
    .map((lang) => lang.node.name);
}
