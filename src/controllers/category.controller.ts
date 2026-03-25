import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { AppError } from "../middleware/error.middleware";

type CreateCategoryBody = { name?: string };
type UpdateCategoryBody = { name?: string };
type CategoryParams = { id?: string };

const mapCategoryWriteError = (error: unknown): never => {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    throw new AppError("You already have a category with this name", 409);
  }

  throw error;
};

export const createCategory = async (
  req: AuthenticatedRequest & { body: CreateCategoryBody },
  res: Response,
) => {
  if (!req.user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  const trimmedName = req.body.name?.trim();
  if (!trimmedName) {
    throw new AppError("Category name is required", 400);
  }

  const category = await prisma.category
    .create({
      data: {
        name: trimmedName,
        ownerId: req.user.id,
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
    })
    .catch(mapCategoryWriteError);

  return res.status(201).json({
    message: "Category created successfully",
    category,
  });
};

export const getCategories = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  if (!req.user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  const categories = await prisma.category.findMany({
    where: {
      ownerId: req.user.id,
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      createdAt: true,
    },
  });

  return res.status(200).json({
    message: "Categories returned successfully",
    categories,
  });
};

export const updateCategory = async (
  req: AuthenticatedRequest &
    Request<CategoryParams, unknown, UpdateCategoryBody>,
  res: Response,
) => {
  if (!req.user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  const categoryId = req.params.id;
  if (!categoryId) {
    throw new AppError("Category id is required", 400);
  }

  const trimmedName = req.body.name?.trim();
  if (!trimmedName) {
    throw new AppError("Category name is required", 400);
  }

  const existingCategory = await prisma.category.findFirst({
    where: {
      id: categoryId,
      ownerId: req.user.id,
    },
    select: { id: true },
  });

  if (!existingCategory) {
    throw new AppError("Category not found", 404);
  }

  const category = await prisma.category
    .update({
      where: { id: categoryId },
      data: { name: trimmedName },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    .catch(mapCategoryWriteError);

  return res.status(200).json({
    message: "Category updated successfully",
    category,
  });
};

export const deleteCategory = async (
  req: AuthenticatedRequest & Request<CategoryParams>,
  res: Response,
) => {
  if (!req.user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  const categoryId = req.params.id;
  if (!categoryId) {
    throw new AppError("Category id is required", 400);
  }

  const result = await prisma.category.deleteMany({
    where: {
      id: categoryId,
      ownerId: req.user.id,
    },
  });

  if (result.count === 0) {
    throw new AppError("Category not found", 404);
  }

  return res.status(200).json({
    message: "Category deleted successfully",
  });
};
