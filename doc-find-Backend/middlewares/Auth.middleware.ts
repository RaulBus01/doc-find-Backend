import { Context} from "@hono/hono";
import { createMiddleware } from '@hono/hono/factory';
import { jwtVerify, importJWK } from "https://deno.land/x/jose@v5.9.6/index.ts";
import * as HttpStatusCodes from "stoker/http-status-codes";

export const verifyUserPermissions = createMiddleware(async (c: Context, next: () => Promise<void>) => {
  // Get the Authorization header
  const authHeader = c.req.header("Authorization");
  if (!authHeader) {
    return c.json({ error: "Missing Authorization header" }, HttpStatusCodes.UNAUTHORIZED);
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return c.json({ error: "No token provided" }, HttpStatusCodes.UNAUTHORIZED);
  }

  // Define issuer & audience based on your Auth0 configuration
  const issuer = `https://${Deno.env.get("AUTH0_DOMAIN")}/`;
  const audience = Deno.env.get("AUTH0_AUDIENCE");

  // Fetch the JWKS from Auth0
  const jwksURL = `https://${Deno.env.get("AUTH0_DOMAIN")}/.well-known/jwks.json`;
  const jwksRes = await fetch(jwksURL);
  if (!jwksRes.ok) {
    return c.json({ error: "Failed to fetch JWKS" }, HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }
  const jwks = await jwksRes.json();
  if (!jwks?.keys || jwks.keys.length === 0) {
    return c.json({ error: "No JWKS keys found" }, HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }
  // In production, you may want to select the correct key based on token header 'kid'.
  // For simplicity, we take the first key.
  const key = jwks.keys[0];
  const parsedKey = await importJWK(key, "RS256");

  try {
    const { payload } = await jwtVerify(token, parsedKey, { issuer, audience });
    
    // Check that the token has a subject (the user is logged in)
    if (!payload.sub) {
      return c.json({ error: "User not logged in" }, HttpStatusCodes.UNAUTHORIZED);
    }
  
    c.set("tokenPayload", payload);
    return next();
    
  } catch (err) {
    return c.json({ error: "Invalid token", details: err }, HttpStatusCodes.UNAUTHORIZED);
  }
});
