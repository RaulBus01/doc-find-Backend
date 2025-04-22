import "jsr:@std/dotenv/load";

interface Config {
    database: {
      host: string;
      port: number;
      user: string;
      password: string;
      database: string;
      ssl: boolean;
    };
    ai: {
      mistral: {
        apiKey: string;
        models: {
          chat: string;
          stream: string;
        };
        temperature: number;
      };
      google: {
        apiKey: string;
        model: string;
      };
    };
  }
  
  function validateEnv(key: string): string {
    const value = Deno.env.get(key);
    if (!value) {
      throw new Error(`Missing ${key} in environment variables.`);
    }
    return value;
  }
  
  export const config: Config = {
    database: {
      host: validateEnv("DB_HOST"),
      port: 5432,
      user: validateEnv("DB_USER"),
      password: validateEnv("DB_PASSWORD"),
      database: validateEnv("DB_NAME"),
      ssl: true,
    },
    ai: {
      mistral: {
        apiKey: validateEnv("MISTRAL_API_KEY"),
        models: {
          chat: "mistral-small-latest",
          stream: "mistral-large-latest",
        },
        temperature: 0.7,
      },
      google: {
        apiKey: validateEnv("GOOGLE_API_KEY"),
        model: "gemini-2.0-flash-lite",
      },
    },
  };