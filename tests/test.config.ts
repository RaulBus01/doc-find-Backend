import "jsr:@std/dotenv/load";


// Test database setup
export const testDbConfig = {
  host: Deno.env.get("TEST_DB_HOST") || Deno.env.get("DB_HOST"),
  port: 5432,
  user: Deno.env.get("TEST_DB_USER") || Deno.env.get("DB_USER"),
  password: Deno.env.get("TEST_DB_PASSWORD") || Deno.env.get("DB_PASSWORD"),
  database: Deno.env.get("TEST_DB_NAME") || "test_dev",
  ssl: true
};

// Mock user for testing
export const mockUser = {
  userId: "test_user_123",
  sub: "test_user_123"
};

// Helper to create mock JWT payload
export const createMockJWTPayload = (userId: string = mockUser.userId) => ({
  sub: userId,
  iss: `https://${Deno.env.get("AUTH0_DOMAIN")}/`,
  aud: Deno.env.get("AUTH0_AUDIENCE"),
  exp: Math.floor(Date.now() / 1000) + 3600,
  iat: Math.floor(Date.now() / 1000)
});

console.log("Test configuration loaded");
