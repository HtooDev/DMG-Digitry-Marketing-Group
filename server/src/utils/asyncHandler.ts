import type {
  NextFunction,
  ParamsDictionary,
  Request,
  Response,
} from "express-serve-static-core";
import type { RequestHandler } from "express";

// Express handlers typed by `@types/express` give `req.params` as
// `string | string[]` (wildcard params). This app only uses scalar route
// params (zod coerces to `string`), so we narrow `P` to a flat dictionary to
// keep Prisma v7's strict input types happy.
type FlatParams = ParamsDictionary & { [key: string]: string };
type FlatRequest = Request<FlatParams>;
type FlatHandler = (
  req: FlatRequest,
  res: Response,
  next: NextFunction,
) => Promise<unknown> | unknown;

export const asyncHandler =
  (fn: FlatHandler): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req as FlatRequest, res, next)).catch(next);
  };
