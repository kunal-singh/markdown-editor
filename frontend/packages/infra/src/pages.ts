import {
  createPageRequestSchema,
  pageReadSchema,
  pageTreeResponseSchema,
  type CreatePageRequest,
  type PageRead,
  type PageUpdate,
  type PageTreeNode,
} from "@markdown-editor/domain";
import { handleResponse } from "./utils";

export async function createPageApi(body: CreatePageRequest, token: string): Promise<PageRead> {
  const res = await fetch("/api/pages/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(createPageRequestSchema.parse(body)),
  });
  return pageReadSchema.parse(await handleResponse(res));
}

export async function getPageApi(pageId: string, token: string): Promise<PageRead> {
  const res = await fetch(`/api/pages/${pageId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return pageReadSchema.parse(await handleResponse(res));
}

export async function updatePageApi(
  pageId: string,
  body: PageUpdate,
  token: string,
): Promise<PageRead> {
  const res = await fetch(`/api/pages/${pageId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  return pageReadSchema.parse(await handleResponse(res));
}

export async function getPageTreeApi(token: string): Promise<PageTreeNode[]> {
  const res = await fetch("/api/pages/tree", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return pageTreeResponseSchema.parse(await handleResponse(res));
}
