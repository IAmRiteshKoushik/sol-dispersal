import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from ".";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"] ?? "";

  // Our middleware basically, shoves the userid inside the request object 
  // and then it becomes easy to call it everytime we need to
  try {
    const decoded = jwt.verify(authHeader, JWT_SECRET);
    // @ts-ignore
    if (decoded.userId) {
      // @ts-ignore
      req.userId = decoded.userId;
      return next();
    }
  } catch (e) {
    return res.status(403).json({
      message: "You are not logged in",
    });
  }
}
