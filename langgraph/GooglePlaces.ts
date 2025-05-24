import { tool } from "@langchain/core/tools";
import { GooglePlaceResponse, GooglePlaceResult, FormattedPlaceResult } from "../types/GoogleType.ts";

const googlePlaceTool = tool(
  async (input): Promise<string> => {
    try {
      const { query, location, radius = 5 } = JSON.parse(input);
      console.log("Google Places API input:", { query, location, radius });
      
      // Check if location is provided
      if (!location) {
        return JSON.stringify({
          error: "LOCATION_MISSING",
          message: "No location data provided. Please ask the user for their location."
        });
      }
      
      console.log(query, location, radius);
      const params = {
          "query": `${query} near ${location}`,
          "radius": Math.round(parseFloat(radius) * 1000).toString(), // API uses meters
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
        photos: place.photos?.slice(0, 1), // Just include first photo if available
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
    description: "Search for nearby places using Google Places API. Input should be a JSON string with 'query', 'location' (lat,lng), and optional 'radius' in km.",
   responseFormat: "json",
   verbose: true,
   

  }
);

export { googlePlaceTool };