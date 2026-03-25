import { z } from "zod";

const optionalString = z.string().trim().optional();
const optionalNullableString = z.string().trim().nullable().optional();

export const itemIdParamsSchema = z.object({
  id: z.string().trim().min(1, "Item id is required"),
});

export const createItemManualBodySchema = z.object({
  title: z.string().trim().min(1, "Item title is required"),
  description: optionalString,
  categoryId: optionalString,
  listId: optionalString,
  url: optionalString,
  imageUrl: optionalString,
  price: optionalString,
});

export const createItemFromUrlBodySchema = z.object({
  url: z.string().trim().url("Invalid URL"),
  categoryId: optionalString,
  listId: optionalString,
});

export const getItemsByCategoryQuerySchema = z.object({
  categoryId: z.string().trim().min(1, "categoryId query is required"),
});

export const updateItemBodySchema = z
  .object({
    title: z.string().trim().min(1, "Item title cannot be empty").optional(),
    description: optionalNullableString,
    categoryId: optionalNullableString,
    listId: optionalNullableString,
    url: optionalNullableString,
    imageUrl: optionalNullableString,
    price: optionalNullableString,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "No fields provided for update",
  });
