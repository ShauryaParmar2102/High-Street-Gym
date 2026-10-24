// Base URL used to communicate with the Express backend API
export const API_BASE_URL = "http://localhost:8080/api";

// Function to send HTTP requests to the backend
export async function fetchAPI(method, route, body, authKey) {

    // Set the request headers to send JSON data
    const headers = {
        "Content-Type": "application/json",
    };

    // Include the authentication key when the user is logged in
        if (authKey) {
            headers["Authentication-Key"] = authKey;
        }

    try {
        // Send the HTTP request to the specified API endpoint
        const response = await fetch(API_BASE_URL + route, {
            method,
            headers,
             // Convert the request body into JSON if data is provided
            body: body ? JSON.stringify(body) : null,
        });
        const status = response.status;   // Get the HTTP status code from the response
        const responseBody = await response.json(); // Convert the response JSON into a JavaScript object

         // Return the status code and response data to the React component
        return {
            status,
            body: responseBody,
        };
    } catch (error) {
        // Throw an error if the request or response processing fails
        throw String (error); 
    }
} 