import { createRouter } from "../../config/create-app.ts";
import * as routes from "./chat.route.ts";
import * as chatController from "../../controllers/chat/chat.controller.ts";

const router = createRouter()
  .openapi(routes.create, chatController.createChat)
  .openapi(routes.getChats, chatController.getChats)
  .openapi(routes.getChat, chatController.getChat)
  .openapi(routes.deleteChat, chatController.deleteChat);


export default router;
