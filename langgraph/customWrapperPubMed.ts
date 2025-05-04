import { z } from "npm:zod";
import { tool } from "@langchain/core/tools";
import axios from "npm:axios";
import { parseStringPromise } from "npm:xml2js";

// Define the schema for the PubMed tool
const pubMedSchema = z.object({
  query: z.string().describe("The search query for PubMed"),
  maxResults: z.number().default(5).describe("Maximum number of results to return")
});

// PubMed API Wrapper class
class PubMedAPIWrapper {
  private baseUrlEsearch: string = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?";
  private baseUrlEfetch: string = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?";
  private maxRetry: number = 5;
  private sleepTime: number = 200; // milliseconds
  
  private topKResults: number;
  private maxQueryLength: number = 300;
  private docContentCharsMax: number = 2000;
  private email: string;

  constructor(options: {
    topKResults?: number;
    maxQueryLength?: number;
    docContentCharsMax?: number;
    email?: string;
  } = {}) {
    this.topKResults = options.topKResults || 5;
    this.maxQueryLength = options.maxQueryLength || 300;
    this.docContentCharsMax = options.docContentCharsMax || 2000;
    this.email = options.email || "your_email@example.com";
  }

  async run(query: string): Promise<string> {
    try {
      // Retrieve the top-k results for the query
      const results = await this.load(query.substring(0, this.maxQueryLength));
      
      const docs = results.map(result => 
        `Published: ${result.Published}\n` +
        `Title: ${result.Title}\n` +
        `Copyright Information: ${result.CopyrightInformation || 'N/A'}\n` +
        `Summary:\n${result.Summary}`
      );

      // Join the results and limit the character count
      return docs.length > 0 
        ? docs.join("\n\n").substring(0, this.docContentCharsMax) 
        : "No good PubMed Result was found";
    } catch (ex) {
      return `PubMed exception: ${ex.message}`;
    }
  }

  async load(query: string): Promise<any[]> {
    const results: any[] = [];
    
    // Build the search URL
    const url = `${this.baseUrlEsearch}db=pubmed&term=${encodeURIComponent(query)}&retmode=json&retmax=${this.topKResults}&usehistory=y&tool=langchain&email=${this.email}`;
    
    try {
      // Fetch search results
      const response = await axios.get(url);
      const data = response.data;
      
      if (!data.esearchresult || !data.esearchresult.idlist) {
        return results;
      }
      
      const webenv = data.esearchresult.webenv;
      const uids = data.esearchresult.idlist;
      
      // Fetch each article
      for (const uid of uids) {
        const article = await this.retrieveArticle(uid, webenv);
        if (article) {
          results.push(article);
        }
      }
      
      return results;
    } catch (error) {
      console.error("Error in PubMed load:", error);
      throw error;
    }
  }

  async retrieveArticle(uid: string, webenv: string): Promise<any> {
    const url = `${this.baseUrlEfetch}db=pubmed&retmode=xml&id=${uid}&webenv=${webenv}&tool=langchain&email=${this.email}`;
    
    let retry = 0;
    let delay = this.sleepTime;
    
    while (true) {
      try {
        const response = await axios.get(url);
        const xmlText = response.data;
        
        // Parse XML to JSON
        const textDict = await parseStringPromise(xmlText, { explicitArray: false });
        return this.parseArticle(uid, textDict);
      } catch (error) {
        if (error.response && error.response.status === 429 && retry < this.maxRetry) {
          // Too Many Requests error - implement exponential backoff
          console.log(`Too Many Requests, waiting for ${delay/1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
          retry += 1;
        } else {
          throw error;
        }
      }
    }
  }

  parseArticle(uid: string, textDict: any): any {
    try {
      let ar;
      
      if (textDict.PubmedArticleSet.PubmedArticle) {
        ar = textDict.PubmedArticleSet.PubmedArticle.MedlineCitation.Article;
      } else if (textDict.PubmedArticleSet.PubmedBookArticle) {
        ar = textDict.PubmedArticleSet.PubmedBookArticle.BookDocument;
      } else {
        throw new Error("Unexpected article format");
      }
      
      // Extract abstract text
      let summary = "No abstract available";
      let abstractText = ar.Abstract?.AbstractText;
      console.log("Abstract Text:", abstractText);
      
      if (abstractText) {
        if (Array.isArray(abstractText)) {
          const summaries = abstractText
            .filter(txt => txt._ && txt.$ && txt.$.Label)
            .map(txt => `${txt.$.Label}: ${txt._}`);
          
          summary = summaries.length > 0 ? summaries.join("\n") : "No abstract available";
        } else if (typeof abstractText === 'string') {
          summary = abstractText;
        } else if (abstractText._ && abstractText.$) {
          summary = `${abstractText.$.Label || ''}: ${abstractText._}`;
        }
      }
      
      // Get publication date
      let pubDate = '';
      if (ar.ArticleDate) {
        const year = ar.ArticleDate.Year || '';
        const month = ar.ArticleDate.Month || '';
        const day = ar.ArticleDate.Day || '';
        pubDate = [year, month, day].filter(Boolean).join('-');
      } else if (ar.Journal && ar.Journal.JournalIssue && ar.Journal.JournalIssue.PubDate) {
        const pubDateObj = ar.Journal.JournalIssue.PubDate;
        const year = pubDateObj.Year || '';
        const month = pubDateObj.Month || '';
        const day = pubDateObj.Day || '';
        pubDate = [year, month, day].filter(Boolean).join('-');
      }
      
      return {
        uid: uid,
        Title: ar.ArticleTitle || '',
        Published: pubDate,
        CopyrightInformation: ar.Abstract?.CopyrightInformation || '',
        Summary: summary
      };
    } catch (error) {
      console.error("Error parsing article:", error);
      return {
        uid: uid,
        Title: "Error parsing article",
        Published: "",
        CopyrightInformation: "",
        Summary: "Failed to parse article information"
      };
    }
  }
}

// Create the PubMed tool for LangChain
export const createPubMedTool = () => {
  const pubMedWrapper = new PubMedAPIWrapper();
  
  return tool(
   
    async ({ query, maxResults }) => {
            // Override the default topKResults with user-provided maxResults
            // pubMedWrapper.topKResults = maxResults;
            console.log("PubMed query:", query);
            return await pubMedWrapper.run(query);
      },
      {
        name: "PubMed",
        description: 
        "Useful for when you need to answer questions about medicine, health, "+
        "and biomedical topics "+
        "from biomedical literature, MEDLINE, life science journals, and online books. "+
        "Input should be a search query.",
        schema: pubMedSchema,
      }
    );

};

