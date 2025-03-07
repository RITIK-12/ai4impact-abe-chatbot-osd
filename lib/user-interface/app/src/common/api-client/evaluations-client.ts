import { Utils } from "../utils";
import { AppConfig } from "../types";

export class EvaluationsClient {
  private readonly API;
  constructor(protected _appConfig: AppConfig) {
    this.API = _appConfig.httpEndpoint.slice(0, -1);
  }

  // Fetch evaluation summaries
  async getEvaluationSummaries(continuationToken?: any, limit: number = 10) {
    try {
      const auth = await Utils.authenticate();
      const body: any = {
        operation: "get_evaluation_summaries",
        limit,
      };
      if (continuationToken) {
        body.continuation_token = continuationToken;
      }

      console.log(`Fetching from ${this.API}/eval-results-handler`);
      try {
        const response = await fetch(`${this.API}/eval-results-handler`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": auth,
            "Accept": "application/json"
          },
          body: JSON.stringify(body),
          mode: "cors"
        });
        
        if (response.status === 404) {
          console.error("API endpoint not found: /eval-results-handler");
          // Return an empty result structure instead of throwing an error
          return { Items: [], NextPageToken: null };
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          // Check for specific DynamoDB errors
          if (errorText.includes("ResourceNotFoundException") || errorText.includes("ValidationException")) {
            console.error("DynamoDB error:", errorText);
            return { 
              Items: [], 
              NextPageToken: null,
              error: "Database error: The evaluation summaries could not be retrieved. This may be due to missing tables or incorrect configuration."
            };
          }
          throw new Error(`Failed to get evaluation summaries: ${response.status} ${response.statusText} - ${errorText}`);
        }

        // Get the response text first to log it in case of parsing errors
        const responseText = await response.text();
        console.log("Raw response:", responseText);
        
        try {
          // Then parse it as JSON
          const result = JSON.parse(responseText);
          
          // Check if result has Items property, if not create an empty structure
          if (!result.Items) {
            console.warn("Response missing Items property, creating empty structure");
            return { Items: [], NextPageToken: null };
          }
          
          return result;
        } catch (parseError) {
          console.error("Error parsing JSON response:", parseError);
          console.error("Raw response was:", responseText);
          throw new Error(`Invalid JSON response from server: ${parseError.message}`);
        }
      } catch (fetchError) {
        // Handle CORS errors specifically
        if (fetchError.message && (
            fetchError.message.includes("CORS") || 
            fetchError.message.includes("cross-origin") || 
            fetchError.message.includes("Cross-Origin"))
        ) {
          console.error("CORS error:", fetchError);
          throw new Error("Cross-Origin Request Blocked: The API doesn't allow requests from this origin. Please check CORS configuration on the API Gateway.");
        }
        throw fetchError;
      }
    } catch (error) {
      console.error("Error in getEvaluationSummaries:", error);
      // Rethrow the error for the component to handle
      throw error;
    }
  }

  // Fetch detailed evaluation results
  async getEvaluationResults(evaluationId: string, continuationToken?: any, limit: number = 10) {
    try {
      const auth = await Utils.authenticate();
      const body: any = {
        operation: "get_evaluation_results",
        evaluation_id: evaluationId,
        limit,
      };
      if (continuationToken) {
        body.continuation_token = continuationToken;
      }

      console.log(`Fetching from ${this.API}/eval-results-handler`);
      try {
        const response = await fetch(`${this.API}/eval-results-handler`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": auth,
            "Accept": "application/json"
          },
          body: JSON.stringify(body),
          mode: "cors"
        });
        
        if (response.status === 404) {
          console.error("API endpoint not found: /eval-results-handler");
          // Return an empty result structure instead of throwing an error
          return { Items: [], NextPageToken: null };
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          // Check for specific DynamoDB errors
          if (errorText.includes("ResourceNotFoundException") || errorText.includes("ValidationException")) {
            console.error("DynamoDB error:", errorText);
            return { 
              Items: [], 
              NextPageToken: null,
              error: "Database error: The evaluation data could not be retrieved. This may be due to missing tables or incorrect configuration."
            };
          }
          throw new Error(`Failed to get evaluation results: ${response.status} ${response.statusText} - ${errorText}`);
        }

        // Get the response text first to log it in case of parsing errors
        const responseText = await response.text();
        console.log("Raw response:", responseText);
        
        try {
          // Then parse it as JSON
          const result = JSON.parse(responseText);
          
          // Check if result has Items property, if not create an empty structure
          if (!result.Items) {
            console.warn("Response missing Items property, creating empty structure");
            return { Items: [], NextPageToken: null };
          }
          
          return result;
        } catch (parseError) {
          console.error("Error parsing JSON response:", parseError);
          console.error("Raw response was:", responseText);
          throw new Error(`Invalid JSON response from server: ${parseError.message}`);
        }
      } catch (fetchError) {
        // Handle CORS errors specifically
        if (fetchError.message && (
            fetchError.message.includes("CORS") || 
            fetchError.message.includes("cross-origin") || 
            fetchError.message.includes("Cross-Origin"))
        ) {
          console.error("CORS error:", fetchError);
          throw new Error("Cross-Origin Request Blocked: The API doesn't allow requests from this origin. Please check CORS configuration on the API Gateway.");
        }
        throw fetchError;
      }
    } catch (error) {
      console.error("Error in getEvaluationResults:", error);
      // Rethrow the error for the component to handle
      throw error;
    }
  }

  async startNewEvaluation(evaluationName: string, testCaseFile: string) {
    try {
      const auth = await Utils.authenticate();
      const body: any = {
        // operation: "start_new_evaluation",
        evaluation_name: evaluationName,
        testCasesKey: testCaseFile,
      };
      console.log("body in the api", body);
      console.log(`Posting to ${this.API}/eval-run-handler`);

      const response = await fetch(`${this.API}/eval-run-handler`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": auth,
          "Accept": "application/json"
        },
        body: JSON.stringify(body),
        mode: "cors"
      });
      
      if (response.status === 404) {
        console.error("API endpoint not found: /eval-run-handler");
        throw new Error("Evaluation service is not available. The API endpoint could not be found. Please ensure the backend is deployed correctly.");
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to start new evaluation: ${response.status} ${response.statusText} - ${errorText}`);
      }

      // Get the response text first to log it in case of parsing errors
      const responseText = await response.text();
      console.log("Raw response:", responseText);
      
      try {
        // Then parse it as JSON
        const result = JSON.parse(responseText);
        return result;
      } catch (parseError) {
        console.error("Error parsing JSON response:", parseError);
        console.error("Raw response was:", responseText);
        throw new Error(`Invalid JSON response from server: ${parseError.message}`);
      }
    } catch (error) {
      console.error("Error in startNewEvaluation:", error);
      
      // Handle CORS errors specifically
      if (error.message && (
        error.message.includes("CORS") || 
        error.message.includes("cross-origin") || 
        error.message.includes("Cross-Origin"))
      ) {
        console.error("CORS error:", error);
        throw new Error("Cross-Origin Request Blocked: The API doesn't allow requests from this origin. Please check CORS configuration on the API Gateway.");
      }
      
      // Rethrow the error for the component to handle
      throw error;
    }
  }

  // Returns a list of documents in the S3 bucket (hard-coded on the backend)
  async getDocuments(continuationToken?: string, pageIndex?: number) {
    try {
      const auth = await Utils.authenticate();
      
      console.log(`Fetching from ${this.API}/s3-test-cases-bucket-data`);
      
      try {
        const response = await fetch(this.API + '/s3-test-cases-bucket-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': auth,
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            continuationToken: continuationToken,
            pageIndex: pageIndex,
          }),
          mode: "cors"
        });
        
        if (response.status === 404) {
          console.error("API endpoint not found: /s3-test-cases-bucket-data");
          return { Contents: [], NextContinuationToken: null, error: "API endpoint not found" };
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to get files: ${response.status} ${response.statusText} - ${errorText}`);
        }
        
        const responseText = await response.text();
        console.log("Raw response:", responseText);
        
        try {
          const result = JSON.parse(responseText);
          
          if (!result.Contents) {
            console.warn("Response missing Contents property, creating empty structure");
            return { Contents: [], NextContinuationToken: null };
          }
          
          return result;
        } catch (parseError) {
          console.error("Error parsing JSON response:", parseError);
          console.error("Raw response was:", responseText);
          throw new Error(`Invalid JSON response from server: ${parseError.message}`);
        }
      } catch (fetchError) {
        // Handle CORS errors specifically
        if (fetchError.message && (
            fetchError.message.includes("CORS") || 
            fetchError.message.includes("cross-origin") || 
            fetchError.message.includes("Cross-Origin"))
        ) {
          console.error("CORS error:", fetchError);
          throw new Error("Cross-Origin Request Blocked: The API doesn't allow requests from this origin. Please check CORS configuration on the API Gateway.");
        }
        throw fetchError;
      }
    } catch (error) {
      console.error("Error in getDocuments:", error);
      // Rethrow the error
      throw error;
    }
  }

  // Returns a URL from the this.API that allows one file upload to S3 with that exact filename
  async getUploadURL(fileName: string, fileType : string): Promise<string> {    
    const auth = await Utils.authenticate();
    
    const body = {
        fileName: fileName,
        fileType: fileType
    };

    try {
      const response = await fetch(`${this.API}/testcases-upload-presigned-url`, { 
        method: 'POST', 
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': auth,
        },
        body: JSON.stringify(body)
      });
        
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      const data = await response.json();
      return data.uploadURL;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }
}