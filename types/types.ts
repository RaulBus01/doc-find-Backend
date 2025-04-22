import type { OpenAPIHono, RouteConfig, RouteHandler } from "@hono/zod-openapi";

export type AppOpenAPI = OpenAPIHono;

export type AppRouteHandler<R extends RouteConfig> = RouteHandler<R>;
export enum LogLevel {
    DEBUG = "DEBUG",
    INFO = "INFO",
    WARN = "WARN",
    ERROR = "ERROR",
  }

export enum AIModel {
  MISTRAL_SMALL = "mistral-small-latest",
  MISTRAL_LARGE = "mistral-large-latest",
  GEMINI_FLASH_LITE = "gemini-2.0-flash-lite",
}