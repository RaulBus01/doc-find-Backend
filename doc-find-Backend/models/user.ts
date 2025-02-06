export interface User {
    id: number;
    oauthProvider: string;
    oauthId: string;
    username: string;
    email: string;
    roles: string[];
}