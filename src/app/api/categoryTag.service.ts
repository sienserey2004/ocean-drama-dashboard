import { Category, Tag } from "@/app/types";
import api from "./client";

// In-memory cache to prevent redundant calls (429 errors)
let categoriesCache: Category[] | null = null;
let tagsCache: Tag[] | null = null;
let categoriesPromise: Promise<{ data: Category[] }> | null = null;
let tagsPromise: Promise<{ data: Tag[] }> | null = null;

export const categoryApi = {
  list: async () => {
    if (categoriesCache) return { data: categoriesCache };
    if (categoriesPromise) return categoriesPromise;
    
    categoriesPromise = api.get<{ data: Category[] }>('/categories').then(r => {
      categoriesCache = r.data.data;
      categoriesPromise = null;
      return r.data;
    }).catch(err => {
      categoriesPromise = null;
      throw err;
    });
    
    return categoriesPromise;
  },

  create: (data: { name: string; description?: string }) => {
    categoriesCache = null; // Invalidate cache
    return api.post<Category>('/admin/categories', data).then(r => r.data);
  },

  update: (id: number, data: { name: string; description?: string }) => {
    categoriesCache = null; // Invalidate cache
    return api.put(`/admin/categories/${id}`, data).then(r => r.data);
  },

  delete: (id: number) => {
    categoriesCache = null; // Invalidate cache
    return api.delete(`/admin/categories/${id}`).then(r => r.data);
  },
}

export const tagApi = {
  list: async () => {
    if (tagsCache) return { data: tagsCache };
    if (tagsPromise) return tagsPromise;

    tagsPromise = api.get<{ data: Tag[] }>('/tags').then(r => {
      tagsCache = r.data.data;
      tagsPromise = null;
      return r.data;
    }).catch(err => {
      tagsPromise = null;
      throw err;
    });

    return tagsPromise;
  },

  create: (name: string) => {
    tagsCache = null; // Invalidate cache
    return api.post<Tag>('/admin/tags', { name }).then(r => r.data);
  },

  delete: (id: number) => {
    tagsCache = null; // Invalidate cache
    return api.delete(`/admin/tags/${id}`).then(r => r.data);
  },
}