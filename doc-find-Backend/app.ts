import createApp from "./config/create-app.ts";
import configureOpenAPI from "./config/open-api.config.ts";
import chats from "./routes/chat/chat.index.ts";


const app = createApp();

configureOpenAPI(app);


const routes = [
  chats,
  // users,
  // messages,
] as const;


routes.forEach((route) => {
  app.route("/", route);
});


export type AppType = typeof routes[number];

export default app;

    

