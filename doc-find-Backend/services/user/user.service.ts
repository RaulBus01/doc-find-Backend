import { eq } from "drizzle-orm";
import { db } from "../../database/database.ts";
import { z } from "@hono/zod-openapi";
import { users,insertUserSchema, selectUserSchema, usersSchema } from "../../drizzle/schema.ts";

export class UserService {
    async createUser(user: z.infer<typeof insertUserSchema>) {
        const userExists = await checkUserExists(user.oauthId);

        // If user exists, return the user
        if (userExists.length > 0) {
            return formatUser(userExists[0]);
        }
        // If user does not exist, create the user in the database
        const newUser = await db.insert(users).values(user).returning();

        if(newUser.length === 0){
            throw new Error("User not created");
        }
        console.log(newUser);

        return formatUser(newUser[0]);
    }

    async getUser(sub: string) {
        const user = await checkUserExists(sub);
        if(user.length === 0){
            throw new Error("User not found");
        }
        return formatUser(user[0]);
    }
}

//Helper function to check if user exists
const checkUserExists = (sub: string) => {
    return db.select().from(users).where(eq(users.oauthId, sub));
}

const formatUser = (user: z.infer<typeof usersSchema>) => {
    const formattedUser = selectUserSchema.parse(user);
    return formattedUser;

}


export const userService = new UserService();