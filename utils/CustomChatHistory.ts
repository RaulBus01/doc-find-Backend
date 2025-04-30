// import { BaseListChatMessageHistory } from "@langchain/core/chat_history";
// import {
//     BaseMessage,
//     StoredMessage,
//     mapChatMessagesToStoredMessages,
//     mapStoredMessagesToChatMessages,
//   } from "@langchain/core/messages";

// import { db } from "../database/database.ts";

// export interface CustomChatMessageHistoryInput {
//     userId: string;
//     createdAt: string;
//     chatId: string;
// }

// export class CustomChatMessageHistory extends BaseListChatMessageHistory{

//     lc_namespace = ["docfind", "stores", "message"];

//     userId:string;
//     createdAt:string;
//     chatId:string;
//     constructor(fields: CustomChatMessageHistoryInput) {
//         super(fields);
//         this.userId = fields.userId;
//         this.createdAt = fields.createdAt;
//         this.chatId = fields.chatId;
//     }
// }