import { graph } from "./graph.ts";

const input = {
  messages: {
    role: "user",
    content: "What is the current stock price of $AAPL?",
  },
};

const config = {
  configurable: {
    thread_id: "1",
  },
  version: "v2" as const,
};

const stream = graph.streamEvents(input, config);

for await (const event of stream) {
  console.log(
    {
      event: event.event,
      data: event.data,
    },
    { depth: 3 }
  );
}