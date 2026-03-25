import { Request, Response } from "express";
import ogs from "open-graph-scraper";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { prisma } from "../lib/prisma";
import path from "path";
import fs from "fs/promises";
import sharp from "sharp";
import { AppError } from "../middleware/error.middleware";

type CreateItemBody = {
  title?: string;
  description?: string;
  categoryId?: string;
  listId?: string;
  url?: string;
  imageUrl?: string;
  price?: string;
};

type UpdateItemBody = {
  title?: string;
  description?: string;
  categoryId?: string | null;
  listId?: string | null;
  url?: string | null;
  imageUrl?: string | null;
  price?: string | null;
};

type ItemParams = {
  id?: string;
};

type ItemQuery = {
  categoryId?: string;
};

const getOgImageUrl = (ogImage: unknown): string | null => {
  if (!ogImage) {
    return null;
  }

  if (Array.isArray(ogImage)) {
    const first = ogImage[0] as { url?: string } | undefined;
    return first?.url ?? null;
  }

  const single = ogImage as { url?: string };
  return single.url ?? null;
};

const withAppError = async <T>(
  operation: () => Promise<T>,
  message: string,
): Promise<T> => {
  return operation().catch((error: unknown) => {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(message, 500);
  });
};

export const createItemManual = async (
  req: AuthenticatedRequest & { body: CreateItemBody },
  res: Response,
) => {
  return withAppError(async () => {
    if (!req.user?.id) {
      throw new AppError("Unauthorized", 401);
    }

    const trimmedTitle = req.body.title?.trim();
    if (!trimmedTitle) {
      throw new AppError("Item title is required", 400);
    }

    if (req.body.categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: req.body.categoryId,
          ownerId: req.user.id,
        },
        select: { id: true },
      });

      if (!category) {
        throw new AppError("Category not found", 404);
      }
    }

    if (req.body.listId) {
      const list = await prisma.list.findFirst({
        where: {
          id: req.body.listId,
          ownerId: req.user.id,
        },
        select: { id: true },
      });

      if (!list) {
        throw new AppError("List not found", 404);
      }
    }

    const item = await prisma.item.create({
      data: {
        title: trimmedTitle,
        description: req.body.description?.trim() || undefined,
        url: req.body.url?.trim() || undefined,
        imageUrl: req.body.imageUrl?.trim() || undefined,
        price: req.body.price?.trim() || undefined,
        categoryId: req.body.categoryId,
        listId: req.body.listId,
        ownerId: req.user.id,
      },
      select: {
        id: true,
        title: true,
        description: true,
        url: true,
        imageUrl: true,
        price: true,
        categoryId: true,
        listId: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      message: "Item created successfully",
      item,
    });
  }, "Failed to create item");
};

export const createItemFromUrl = async (
  req: AuthenticatedRequest & { body: CreateItemBody },
  res: Response,
) => {
  return withAppError(async () => {
    if (!req.user?.id) {
      throw new AppError("Unauthorized", 401);
    }

    const normalizedUrl = req.body.url?.trim();
    if (!normalizedUrl) {
      throw new AppError("URL is required", 400);
    }

    if (!URL.canParse(normalizedUrl)) {
      throw new AppError("Invalid URL", 400);
    }
    const parsedUrl = new URL(normalizedUrl);

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new AppError("URL must start with http or https", 400);
    }

    if (req.body.categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: req.body.categoryId,
          ownerId: req.user.id,
        },
        select: { id: true },
      });

      if (!category) {
        throw new AppError("Category not found", 404);
      }
    }

    if (req.body.listId) {
      const list = await prisma.list.findFirst({
        where: {
          id: req.body.listId,
          ownerId: req.user.id,
        },
        select: { id: true },
      });

      if (!list) {
        throw new AppError("List not found", 404);
      }
    }

    const { error, result } = await ogs({
      url: parsedUrl.toString(),
    });

    if (error) {
      throw new AppError("Failed to fetch Open Graph data", 400);
    }

    const ogTitle = result.ogTitle?.trim();
    const ogDescription = result.ogDescription?.trim();
    const scrapedImageUrl = getOgImageUrl(result.ogImage);

    const fallbackTitle = parsedUrl.hostname;
    const title = ogTitle || fallbackTitle;

    const scrapedPriceValue = result.ogPriceAmount;

    const createData: {
      title: string;
      ownerId: string;
      url: string;
      description?: string | null;
      imageUrl?: string | null;
      price?: string | null;
      categoryId?: string;
      listId?: string;
    } = {
      title,
      ownerId: req.user.id,
      url: parsedUrl.toString(),
    };

    if (ogDescription) {
      createData.description = ogDescription;
    }

    if (scrapedImageUrl) {
      createData.imageUrl = scrapedImageUrl;
    }

    if (scrapedPriceValue) {
      createData.price = String(scrapedPriceValue);
    }

    if (req.body.categoryId) {
      createData.categoryId = req.body.categoryId;
    }

    if (req.body.listId) {
      createData.listId = req.body.listId;
    }

    const item = await prisma.item.create({
      data: createData,
      select: {
        id: true,
        title: true,
        description: true,
        url: true,
        imageUrl: true,
        price: true,
        categoryId: true,
        listId: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      message: "Item created from URL successfully",
      item,
    });
  }, "Failed to create item from URL");
};

export const uploadItemImage = async (
  req: AuthenticatedRequest & Request<ItemParams>,
  res: Response,
) => {
  return withAppError(async () => {
    if (!req.user?.id) {
      throw new AppError("Unauthorized", 401);
    }

    const itemId = req.params.id;
    if (!itemId) {
      throw new AppError("Item id is required", 400);
    }

    if (!req.file) {
      throw new AppError("Image file is required", 400);
    }

    const item = await prisma.item.findFirst({
      where: { id: itemId, ownerId: req.user.id },
      select: { id: true },
    });

    if (!item) {
      throw new AppError("Item not found", 404);
    }

    const uploadsDir = path.join(process.cwd(), "uploads", "items");
    await fs.mkdir(uploadsDir, { recursive: true });

    const fileName = `${itemId}-${Date.now()}.webp`;
    const absolutePath = path.join(uploadsDir, fileName);

    await sharp(req.file.buffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(absolutePath);

    const imageUrl = `/uploads/items/${fileName}`;

    const updatedItem = await prisma.item.update({
      where: { id: itemId },
      data: { imageUrl },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      message: "Item image uploaded successfully",
      item: updatedItem,
    });
  }, "Failed to upload item image");
};

export const getItems = async (
  req: AuthenticatedRequest &
    Request<Record<string, never>, unknown, unknown, ItemQuery>,
  res: Response,
) => {
  return withAppError(async () => {
    if (!req.user?.id) {
      throw new AppError("Unauthorized", 401);
    }

    const items = await prisma.item.findMany({
      where: {
        ownerId: req.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        description: true,
        url: true,
        imageUrl: true,
        price: true,
        categoryId: true,
        listId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      message: "Items returned successfully",
      items,
    });
  }, "Failed to fetch items");
};

export const getItemsByCategory = async (
  req: AuthenticatedRequest &
    Request<Record<string, never>, unknown, unknown, ItemQuery>,
  res: Response,
) => {
  return withAppError(async () => {
    if (!req.user?.id) {
      throw new AppError("Unauthorized", 401);
    }

    const categoryId = req.query.categoryId?.trim();
    if (!categoryId) {
      throw new AppError("categoryId query is required", 400);
    }

    const items = await prisma.item.findMany({
      where: {
        ownerId: req.user.id,
        categoryId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        description: true,
        url: true,
        imageUrl: true,
        price: true,
        categoryId: true,
        listId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      message: "Items returned successfully",
      items,
    });
  }, "Failed to fetch items by category");
};

export const updateItem = async (
  req: AuthenticatedRequest & Request<ItemParams, unknown, UpdateItemBody>,
  res: Response,
) => {
  return withAppError(async () => {
    if (!req.user?.id) {
      throw new AppError("Unauthorized", 401);
    }

    const itemId = req.params.id;
    if (!itemId) {
      throw new AppError("Item id is required", 400);
    }

    const existingItem = await prisma.item.findFirst({
      where: {
        id: itemId,
        ownerId: req.user.id,
      },
      select: { id: true },
    });

    if (!existingItem) {
      throw new AppError("Item not found", 404);
    }

    const data: {
      title?: string;
      description?: string | null;
      categoryId?: string | null;
      listId?: string | null;
      url?: string | null;
      imageUrl?: string | null;
      price?: string | null;
    } = {};

    if (req.body.title !== undefined) {
      const trimmedTitle = req.body.title.trim();
      if (!trimmedTitle) {
        throw new AppError("Item title cannot be empty", 400);
      }
      data.title = trimmedTitle;
    }

    if (req.body.description !== undefined) {
      const trimmedDescription = req.body.description.trim();
      data.description = trimmedDescription || null;
    }

    if (req.body.url !== undefined) {
      if (req.body.url === null) {
        data.url = null;
      } else {
        const trimmedUrl = req.body.url.trim();
        data.url = trimmedUrl || null;
      }
    }

    if (req.body.imageUrl !== undefined) {
      if (req.body.imageUrl === null) {
        data.imageUrl = null;
      } else {
        const trimmedImageUrl = req.body.imageUrl.trim();
        data.imageUrl = trimmedImageUrl || null;
      }
    }

    if (req.body.price !== undefined) {
      if (req.body.price === null) {
        data.price = null;
      } else {
        const trimmedPrice = req.body.price.trim();
        data.price = trimmedPrice || null;
      }
    }

    if (req.body.categoryId !== undefined) {
      if (req.body.categoryId === null) {
        data.categoryId = null;
      } else {
        const category = await prisma.category.findFirst({
          where: {
            id: req.body.categoryId,
            ownerId: req.user.id,
          },
          select: { id: true },
        });

        if (!category) {
          throw new AppError("Category not found", 404);
        }

        data.categoryId = req.body.categoryId;
      }
    }

    if (req.body.listId !== undefined) {
      if (req.body.listId === null) {
        data.listId = null;
      } else {
        const list = await prisma.list.findFirst({
          where: {
            id: req.body.listId,
            ownerId: req.user.id,
          },
          select: { id: true },
        });

        if (!list) {
          throw new AppError("List not found", 404);
        }

        data.listId = req.body.listId;
      }
    }

    if (Object.keys(data).length === 0) {
      throw new AppError("No fields provided for update", 400);
    }

    const item = await prisma.item.update({
      where: { id: itemId },
      data,
      select: {
        id: true,
        title: true,
        description: true,
        url: true,
        imageUrl: true,
        price: true,
        categoryId: true,
        listId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      message: "Item updated successfully",
      item,
    });
  }, "Failed to update item");
};

export const deleteItem = async (
  req: AuthenticatedRequest & Request<ItemParams>,
  res: Response,
) => {
  return withAppError(async () => {
    if (!req.user?.id) {
      throw new AppError("Unauthorized", 401);
    }

    const itemId = req.params.id;
    if (!itemId) {
      throw new AppError("Item id is required", 400);
    }

    const result = await prisma.item.deleteMany({
      where: {
        id: itemId,
        ownerId: req.user.id,
      },
    });

    if (result.count === 0) {
      throw new AppError("Item not found", 404);
    }

    return res.status(200).json({ message: "Item deleted successfully" });
  }, "Failed to delete item");
};
