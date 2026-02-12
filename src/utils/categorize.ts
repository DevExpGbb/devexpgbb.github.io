// Categorization utility for GitHub repositories
// This file contains logic to automatically categorize repos based on their metadata

// Catalog lifecycle states
export type CatalogState =
  | "not-in-catalog"
  | "published"
  | "needs-review"
  | "deprecated";

// Catalog maturity levels
export type CatalogMaturity = "incubating" | "production" | "deprecated";

// Catalog metadata interface
export interface CatalogMetadata {
  enabled: boolean;
  owner: string;
  display_name: string;
  description: string;
  maturity: CatalogMaturity;
  last_reviewed: string;
  review_cycle_days?: number;
  state: CatalogState;
  schema_version: number;
}

// Asset Category (what product/technology it relates to)
export type AssetCategory =
  | "github-copilot"
  | "ghas"
  | "github-platform"
  | "other";

// Asset Type (what kind of asset it is)
export type AssetType =
  | "code"
  | "design-guidance"
  | "migration-guidance"
  | "blog"
  | "level-up"
  | "demo-online"
  | "demo-deployable"
  | "other";

export interface AssetCategoryInfo {
  name: AssetCategory;
  label: string;
  color: string;
  bgColor: string;
  emoji: string;
}

export interface AssetTypeInfo {
  name: AssetType;
  label: string;
  color: string;
  bgColor: string;
  emoji: string;
}

export const ASSET_CATEGORIES: Record<AssetCategory, AssetCategoryInfo> = {
  "github-copilot": {
    name: "github-copilot",
    label: "GitHub Copilot",
    color: "text-purple-700",
    bgColor: "bg-purple-100",
    emoji: "🤖",
  },
  "ghas": {
    name: "ghas",
    label: "GHAS",
    color: "text-red-700",
    bgColor: "bg-red-100",
    emoji: "🔒",
  },
  "github-platform": {
    name: "github-platform",
    label: "GitHub Platform",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    emoji: "⚙️",
  },
  "other": {
    name: "other",
    label: "Other",
    color: "text-gray-700",
    bgColor: "bg-gray-100",
    emoji: "📦",
  },
};

export const ASSET_TYPES: Record<AssetType, AssetTypeInfo> = {
  "code": {
    name: "code",
    label: "Code",
    color: "text-slate-700",
    bgColor: "bg-slate-100",
    emoji: "💻",
  },
  "design-guidance": {
    name: "design-guidance",
    label: "Design Guidance",
    color: "text-indigo-700",
    bgColor: "bg-indigo-100",
    emoji: "✨",
  },
  "migration-guidance": {
    name: "migration-guidance",
    label: "Migration Guidance",
    color: "text-cyan-700",
    bgColor: "bg-cyan-100",
    emoji: "🔄",
  },
  "blog": {
    name: "blog",
    label: "Blog",
    color: "text-pink-700",
    bgColor: "bg-pink-100",
    emoji: "📝",
  },
  "level-up": {
    name: "level-up",
    label: "Level Up",
    color: "text-yellow-700",
    bgColor: "bg-yellow-100",
    emoji: "⚡",
  },
  "demo-online": {
    name: "demo-online",
    label: "Demo (Online)",
    color: "text-green-700",
    bgColor: "bg-green-100",
    emoji: "🌐",
  },
  "demo-deployable": {
    name: "demo-deployable",
    label: "Demo (Deployable)",
    color: "text-teal-700",
    bgColor: "bg-teal-100",
    emoji: "🚀",
  },
  "other": {
    name: "other",
    label: "Other",
    color: "text-gray-700",
    bgColor: "bg-gray-100",
    emoji: "📦",
  },
};

// Topics that map to asset categories
const CATEGORY_TOPICS: Record<AssetCategory, string[]> = {
  "github-copilot": ["github-copilot", "copilot", "ai-pair-programming", "code-completion"],
  "ghas": ["ghas", "security", "code-scanning", "secret-scanning", "dependabot", "dependency-review", "security-scanning"],
  "github-platform": ["github-platform", "github-actions", "codespaces", "github-packages", "github-pages", "actions", "devcontainer"],
  "other": [],
};

// Topics that map to asset types
const TYPE_TOPICS: Record<AssetType, string[]> = {
  "code": ["code", "library", "sdk", "tool", "cli", "package"],
  "design-guidance": ["design-guidance", "architecture", "best-practices", "patterns", "guidance"],
  "migration-guidance": ["migration-guidance", "migration", "modernization", "upgrade"],
  "blog": ["blog", "article"],
  "level-up": ["level-up", "workshop", "training", "lab", "hands-on", "tutorial"],
  "demo-online": ["demo-online", "demo", "showcase"],
  "demo-deployable": ["demo-deployable", "deployable", "template", "starter-kit"],
  "other": [],
};

// Legacy type alias for backward compatibility
export type RepoCategory = AssetCategory;
export type CategoryInfo = AssetCategoryInfo;
export const CATEGORIES = ASSET_CATEGORIES;

export interface Repository {
  name: string;
  description: string | null;
  url: string;
  owner: { id: string; login: string };
  isArchived: boolean;
  isFork: boolean;
  repositoryTopics: { name: string }[] | null;
  // Fallback topics from REST API: array of strings
  topics?: string[];
  languages: { size: number; node: { name: string } }[];
  primaryLanguage: { name: string } | null;
  createdAt: string;
  updatedAt: string;
  stargazerCount: number;
  topContributor: { login: string; avatarUrl: string } | null;
  // Catalog metadata (from .gbbcatalog.yml)
  catalogMetadata?: CatalogMetadata;
}

export interface CategorizedRepository extends Repository {
  category: AssetCategory;
  categoryInfo: AssetCategoryInfo;
  assetType: AssetType;
  assetTypeInfo: AssetTypeInfo;
}

/**
 * Detects asset category based on repo topics
 */
export function detectAssetCategory(repo: Repository): AssetCategory {
  const topics =
    (repo.repositoryTopics?.map((t) => t.name.toLowerCase())) ??
    (repo.topics?.map((t) => t.toLowerCase())) ??
    [];

  // Check topics against category mappings
  for (const [category, categoryTopics] of Object.entries(CATEGORY_TOPICS) as [AssetCategory, string[]][]) {
    if (category === "other") continue;
    if (categoryTopics.some((topic) => topics.includes(topic))) {
      return category;
    }
  }

  return "other";
}

/**
 * Detects asset type based on repo topics
 */
export function detectAssetType(repo: Repository): AssetType {
  const topics =
    (repo.repositoryTopics?.map((t) => t.name.toLowerCase())) ??
    (repo.topics?.map((t) => t.toLowerCase())) ??
    [];

  // Check topics against type mappings
  for (const [assetType, typeTopics] of Object.entries(TYPE_TOPICS) as [AssetType, string[]][]) {
    if (assetType === "other") continue;
    if (typeTopics.some((topic) => topics.includes(topic))) {
      return assetType;
    }
  }

  return "code"; // Default to code if no specific type topic found
}

/**
 * Legacy function for backward compatibility
 */
export function categorizeRepo(repo: Repository): AssetCategory {
  return detectAssetCategory(repo);
}

/**
 * Categorizes all repositories and returns them with category info
 */
export function categorizeRepositories(
  repos: Repository[],
): CategorizedRepository[] {
  return repos.map((repo) => {
    const category = detectAssetCategory(repo);
    const assetType = detectAssetType(repo);
    return {
      ...repo,
      category,
      categoryInfo: ASSET_CATEGORIES[category],
      assetType,
      assetTypeInfo: ASSET_TYPES[assetType],
    };
  });
}

/**
 * Groups repositories by asset category
 */
export function groupByCategory(
  repos: CategorizedRepository[],
): Record<AssetCategory, CategorizedRepository[]> {
  const grouped = {} as Record<AssetCategory, CategorizedRepository[]>;

  for (const category of Object.keys(ASSET_CATEGORIES) as AssetCategory[]) {
    grouped[category] = [];
  }

  for (const repo of repos) {
    grouped[repo.category].push(repo);
  }

  return grouped;
}

/**
 * Groups repositories by asset type
 */
export function groupByAssetType(
  repos: CategorizedRepository[],
): Record<AssetType, CategorizedRepository[]> {
  const grouped = {} as Record<AssetType, CategorizedRepository[]>;

  for (const assetType of Object.keys(ASSET_TYPES) as AssetType[]) {
    grouped[assetType] = [];
  }

  for (const repo of repos) {
    grouped[repo.assetType].push(repo);
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
