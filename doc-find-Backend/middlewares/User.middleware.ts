import * as HttpStatusCodes from "stoker/http-status-codes";
import { userService } from "../services/user/user.service.ts";
import type { Context } from "@hono/hono";
import { createMiddleware } from '@hono/hono/factory';

export const attachUser = createMiddleware(async (c: Context, next: () => Promise<void>) => {
  const tokenPayload = c.get("tokenPayload");
  if (!tokenPayload || !tokenPayload.sub) {
    return c.json({ message: "No token payload" }, HttpStatusCodes.UNAUTHORIZED);
  }
  const user = await userService.getUser(tokenPayload.sub);
  if (!user) {
    return c.json({ message: "User not found" }, HttpStatusCodes.NOT_FOUND);
  }
  c.set("user", user);
  await next();
});