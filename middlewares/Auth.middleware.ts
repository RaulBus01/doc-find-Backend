import { Context} from "npm:hono";
import { createMiddleware } from 'npm:hono/factory';
import { jwtVerify, importJWK } from "https://deno.land/x/jose@v5.9.6/index.ts";
import { HttpStatusCode} from '../utils/HttpStatusCode.ts';

export const verifyUserPermissions = createMiddleware(async (c: Context, next: () => Promise<void>) => {
  // Get the Authorization header
  const authHeader = c.req.header("Authorization");
  if (!authHeader) {
    return c.json({ error: "Missing Authorization header" }, HttpStatusCode.UNAUTHORIZED);
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return c.json({ error: "No token provided" }, HttpStatusCode.UNAUTHORIZED);
  }

  // Define issuer & audience based on your Auth0 configuration
  const issuer = `https://${Deno.env.get("AUTH0_DOMAIN")}/`;
  const audience = Deno.env.get("AUTH0_AUDIENCE");

  // Fetch the JWKS from Auth0
  const jwksURL = `https://${Deno.env.get("AUTH0_DOMAIN")}/.well-known/jwks.json`;
  const jwksRes = await fetch(jwksURL);
  if (!jwksRes.ok) {
    return c.json({ error: "Failed to fetch JWKS" }, HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
  const jwks = await jwksRes.json();
  if (!jwks?.keys || jwks.keys.length === 0) {
    return c.json({ error: "No JWKS keys found" }, HttpStatusCode.INTERNAL_SERVER_ERROR);
  }

  const key = jwks.keys[0];
  const parsedKey = await importJWK(key, "RS256");

  try {
    const { payload } = await jwtVerify(token, parsedKey, { issuer, audience });
    console.log("JWT payload:", payload);
    // Check that the token has a subject (the user is logged in)
    if (!payload.sub) {
      return c.json({ error: "User not logged in" }, HttpStatusCode.UNAUTHORIZED);
    }
  
    c.set("userId", payload.sub);
    return next();
    
  } catch (err) {
    return c.json({ error: "Invalid token", details: err }, HttpStatusCode.UNAUTHORIZED);
  }
});
