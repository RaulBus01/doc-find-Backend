import { assertEquals, assertStringIncludes } from "jsr:@std/assert";
import { Logger } from "../utils/logger.ts";
import { LogLevel } from "../types/types.ts";

Deno.test("Logger - should create logger with context", () => {
  const logger = new Logger("TestContext");
  assertEquals(logger.constructor.name, "Logger");
});

Deno.test("Logger - should log debug message", () => {
  const logger = new Logger("TestContext");
  
  // Capture console output
  const originalLog = console.log;
  let logOutput = "";
  console.log = (message: string) => {
    logOutput = message;
  };
  
  logger.debug("Test debug message", { key: "value" });
  
  const logData = JSON.parse(logOutput);
  assertEquals(logData.level, LogLevel.DEBUG);
  assertEquals(logData.context, "TestContext");
  assertEquals(logData.message, "Test debug message");
  assertEquals(logData.metadata.key, "value");
  
  // Restore console.log
  console.log = originalLog;
});

Deno.test("Logger - should log error with stack trace", () => {
  const logger = new Logger("TestContext");
  
  const originalLog = console.log;
  let logOutput = "";
  console.log = (message: string) => {
    logOutput = message;
  };
  
  const testError = new Error("Test error");
  logger.error("Error occurred", testError, { additional: "data" });
  
  const logData = JSON.parse(logOutput);
  assertEquals(logData.level, LogLevel.ERROR);
  assertEquals(logData.message, "Error occurred");
  assertEquals(logData.metadata.error, "Test error");
  assertStringIncludes(logData.metadata.stack, "Error: Test error");
  
  console.log = originalLog;
});