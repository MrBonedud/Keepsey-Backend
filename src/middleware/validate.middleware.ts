import { NextFunction, Request, Response } from "express";
import { ZodTypeAny } from "zod";
import { AppError } from "./error.middleware";

type ValidationSchemas = {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
};

export const validate = (schemas: ValidationSchemas) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        const message =
          result.error.issues[0]?.message ?? "Invalid request body";
        return next(new AppError(message, 400));
      }
      req.body = result.data;
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        const message =
          result.error.issues[0]?.message ?? "Invalid route parameters";
        return next(new AppError(message, 400));
      }
      req.params = result.data as Request["params"];
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        const message =
          result.error.issues[0]?.message ?? "Invalid query parameters";
        return next(new AppError(message, 400));
      }
      req.query = result.data as Request["query"];
    }

    return next();
  };
};
