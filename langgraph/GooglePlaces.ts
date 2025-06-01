import { tool } from "@langchain/core/tools";
import { GooglePlaceResponse, GooglePlaceResult, FormattedPlaceResult } from "../types/GoogleType.ts";
import { z } from "@hono/zod-openapi";

const googlePlaceTool = tool(
  async (input): Promise<string> => {
    try {
      console.log("Google Places API input received:", input);
      const { query, radius = "5", city } = input;
      console.log("Google Places API input:", { query, location, radius });
      
      // Check if location is provided
      
      
      console.log(query, location, radius);
      const formattedQuery = city ? `${query} in ${city}` : query;
      const params = {
          "query": formattedQuery,
          "radius": Math.round(parseFloat(radius) * 1000).toString(),
          
          "key": Deno.env.get("GOOGLE_PLACES_API_KEY") || ""
      }
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?${new URLSearchParams(params)}`;
      const response = await fetch(url, {
          method: "GET",
          headers: {
              "Content-Type": "application/json",
          },
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching data from Google Places API: ${response.statusText}`);
      }
      
      const data = await response.json() as GooglePlaceResponse;
      console.log("Google Places API response:", data);
      
      if (data.status !== "OK") {
        if (data.status === "ZERO_RESULTS") {
          return JSON.stringify({
            message: `No ${query} found near the specified location.`
          });
        }
        throw new Error(`Error from Google Places API: ${data.status}`);
      }
      
      const places: FormattedPlaceResult[] = data.results.map((place: GooglePlaceResult) => ({
        name: place.name,
        address: place.vicinity || place.formatted_address,
        rating: place.rating || "No rating",
        user_ratings_total: place.user_ratings_total || 0,
        business_status: place.business_status,
        types: place.types,
        opening_hours: place.opening_hours,
        photos: place.photos?.slice(0, 1), 
      }));
      
      return JSON.stringify(places);
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : "An unknown error occurred";
        
      return JSON.stringify({
        error: "ERROR",
        message: errorMessage
      });
    }
  },
  {
    name: "google_places",
    description: "Search for nearby places using Google Places API. Input should be a JSON string with 'query', 'location' (lat,lng), 'city' (optional), and optional 'radius' in km.",
   schema: z.object({
      query: z.string().describe("Type of place to search for (e.g., 'doctor', 'hospital', 'pharmacy')"),
      location: z.string().optional().describe("Location in 'lat,lng' format (e.g., '37.7749,-122.4194')"),
      city: z.string().optional().describe("City name if available from context"),
      radius: z.string().optional().default("5").describe("Search radius in kilometers (default is 5 km)"),
    }),

    
   verbose: true,
   

  }
);

export { googlePlaceTool };