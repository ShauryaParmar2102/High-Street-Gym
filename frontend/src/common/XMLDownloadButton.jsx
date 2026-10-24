import { useCallback } from "react";
import {API_BASE_URL} from "../api.mjs"

// Button component used to download XML files
function XMLDownloadButton({
    children,
    className,
    route,
    authenticationKey = "",
    filename = "export.xml",
}) {

     // Function to download the XML file
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

                // Convert the response into a downloadable file
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