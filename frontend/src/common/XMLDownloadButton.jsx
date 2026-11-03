import { useCallback } from "react";
import {API_BASE_URL} from "../api.mjs"

// ========== REUSABLE REACT COMPONENT ==========
// Reusable button for downloading XML files from different API endpoints.
// Accepts props for the route, authentication key, filename and styling.
function XMLDownloadButton({
    children,
    className,
    route,
    authenticationKey = "",
    filename = "export.xml",
}) {

    // ========== XML DOWNLOAD API REQUEST ==========
    // Uses useCallback to memoize the download function.
    // Sends an authenticated GET request to retrieve XML from the backend.
    const download = useCallback(() => {

        // Send a GET request to the backend
        fetch(API_BASE_URL + route, {
            method: "GET",
            headers: {
    // Send the user's authentication key
    "Authentication-Key": authenticationKey,
},
        })
        .then((response) => {

            // Check if the request was successful
            if (response.status == 200) {

                // ========== XML FILE DOWNLOAD ==========
                // Converts the API response into a Blob.
                // Creates a temporary download link to save the XML file.
                response.blob().then((data) => {
                    const a = document.createElement("a");  // Create a temporary download link
                    a.href = URL.createObjectURL(data); // Create a URL for the XML file
                    a.setAttribute("download", filename); // Set the name of the downloaded file
                    a.click();  // Start downloading the file
                });
            } else {

                // Display an error if the download fails
                response.json().then((body) => {
                    console.error(body.message);
                });
            }
        })
        .catch((error) => {

            // Display any errors in the console
            console.error("Failed to download - " + error);
        });
    }, [route, authenticationKey, filename]);

    // Display the download button
    return(
        <button onClick={() => download()} className={className}>
            {children}
        </button>
    );
}

export default XMLDownloadButton;