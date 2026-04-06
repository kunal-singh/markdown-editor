import type {
  CreatePageRequest,
  PageRead,
  PageUpdate,
  PageTreeNode,
} from "@markdown-editor/domain";

export interface PageDependencies {
  createPage: (body: CreatePageRequest, token: string) => Promise<PageRead>;
  getPage: (pageId: string, token: string) => Promise<PageRead>;
  updatePage: (pageId: string, body: PageUpdate, token: string) => Promise<PageRead>;
  getPageTree: (token: string) => Promise<PageTreeNode[]>;
  token: string;
  setCurrentPage: (page: PageRead | null) => void;
  setPageTree: (tree: PageTreeNode[]) => void;
  navigate: (path: string) => void;
}

export async function loadPageTreeUseCase(deps: PageDependencies): Promise<void> {
  const tree = await deps.getPageTree(deps.token);
  deps.setPageTree(tree);
}

export async function loadPageUseCase(deps: PageDependencies, pageId: string): Promise<void> {
  const page = await deps.getPage(pageId, deps.token);
  deps.setCurrentPage(page);
}

export async function createPageUseCase(
  deps: PageDependencies,
  title: string,
  slug: string,
  parentId?: string,
): Promise<void> {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!slugRegex.test(slug)) throw new Error("Slug must be lowercase kebab-case (e.g. my-page)");
  if (slug.length > 200) throw new Error("Slug must be 200 characters or fewer");

  const page = await deps.createPage({ title, slug, parent_id: parentId }, deps.token);
  deps.setCurrentPage(page);
  await loadPageTreeUseCase(deps);
  deps.navigate(`/dashboard/pages/${page.id}`);
}

export async function savePageMetaUseCase(
  deps: PageDependencies,
  pageId: string,
  title: string,
): Promise<void> {
  if (!title.trim()) throw new Error("Page title cannot be empty");
  const updated = await deps.updatePage(pageId, { title }, deps.token);
  deps.setCurrentPage(updated);
}
