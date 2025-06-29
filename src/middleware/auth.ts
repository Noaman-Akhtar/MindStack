import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_PASSWORD } from "../config";
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}
export const middleware = (req: Request, res: Response, next: NextFunction): void => {
    const token = req.headers.authorization;
    
    if (!token) {
        res.status(403).json({ message: "Unauthorized" });
        return;  // Just return without returning the response object
    }

    try {
        const decoded = jwt.verify(token, JWT_PASSWORD!) as { id: string };
        req.userId = decoded.id;
        next();  // Properly call next() without returning anything
    } catch {
        res.status(403).json({ message: "Invalid token" });
        // No return needed here either
    }
};