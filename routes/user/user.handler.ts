import { Context } from "npm:hono";
import { userService } from "../../services/user/user.service.ts";

interface UserInfoAuth0 {
    email: string;
    email_verified: boolean;
    family_name: string;
    given_name: string;
    name: string;
    nickname: string;
    picture: string;
    sub: string;
  }
  
const URL = `https://${Deno.env.get("AUTH0_DOMAIN")}/userinfo`;

export const createUser = async (c:Context) => {
    try{
        const userInfo: UserInfoAuth0 = await fetchUserInfo(c);

        const userData = {
            oauthId: userInfo.sub,
            username: userInfo.nickname,
            email: userInfo.email,
            emailVerified: userInfo.email_verified,
            givenName: userInfo.given_name,
            familyName: userInfo.family_name,
            picture: userInfo.picture,
            oauthProvider: "auth0",
        };
        const newUser = await userService.createUser(userData);
        return c.json(newUser, 200);
    }
    catch (error) {
        
        return c.json(
          { error: error instanceof Error ? error.message : error },
            500
        );
      }
}
const fetchUserInfo = async (c: Context): Promise<UserInfoAuth0> => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader) {
    throw new Error("Missing Authorization header");
  }

  const res = await fetch(URL, {
    method: "GET",
    headers: { Authorization: authHeader },
    redirect: "follow",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch user info");
  }

  const userInfoJson = await res.json();
  return userInfoJson;
};