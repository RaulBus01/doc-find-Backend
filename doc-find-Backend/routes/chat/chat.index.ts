import { createRouter } from "../../config/create-app.ts";
import * as routes from "./chat.route.ts";
import * as chatController from "../../controllers/chat/chat.controller.ts";

const router = createRouter()
  .openapi(routes.create, chatController.createChat)


export default router;
