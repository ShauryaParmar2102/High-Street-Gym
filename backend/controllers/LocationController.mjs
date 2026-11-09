import express from "express";
import { LocationModel } from "../models/LocationModel.mjs";
import { AuthenticationController } from "./AuthenticationController.mjs";

/**
 * Handles gym location management in the High Street Gym system.
 *
 * Provides routes for viewing, searching, creating,
 * updating and deleting gym locations.
 *
 * Uses LocationModel to interact with the MySQL database
 * and EJS templates to display location information.
 *
 * Applies role-based authorisation to restrict
 * location management to administrators and trainers.
 */
export class LocationController {
    static routes = express.Router(); // Creates a router specifically for location-related routes

    static {
          // GET /location
        // Shows the location management page with all locations (no location selected)
        this.routes.get(
            "/",
            AuthenticationController.restrict(["administrator", "trainer"]), // Allow access only to administrators and trainerss
            this.viewLocations,
        );

         // GET /location/:id - Shows the location management page with a specific location selected -Edit mode
        this.routes.get(
            "/:id",
            AuthenticationController.restrict(["administrator", "trainer"]), // Allow access only to administrators and trainers
            this.viewLocations,
        );

        //POST Location - Handles form submissions, mainly creating a new location
        this.routes.post(
            "/",
            AuthenticationController.restrict(["administrator", "trainer"]), // Allow access only to administrators and trainers
            this.handleLocations,
        );
            // POST /location/:id
            // Handles form submissions for an existing location
            // such as updating or deleting i
        this.routes.post(
            "/:id",
            AuthenticationController.restrict(["administrator", "trainer"]), // Allow access only to administrators and trainers
            this.handleLocations,
        );
    }

    /**
     * Retrieves and displays gym locations from the database.
     *
     * Uses LocationModel to retrieve all locations
     * and supports optional searching by name or address.
     *
     * Finds the selected location using its ID
     * or creates an empty LocationModel for the form.
     *
     * Renders the location management EJS page
     * with the available locations and selected location.
     *
     * Returns the rendered page on success
     * or HTTP 500 if the locations cannot be loaded.
     *
     * @static
     * @async
     * @param {Object} req - The Express request object containing the optional search query and location ID.
     * @param {Object} res - The Express response object used to render the location management page.
     * @returns {Promise<Object>} A promise resolving to the rendered page or error response.
     */
    static async viewLocations(req, res) {
        try {
            const search = req.query.search || ""; // Get search input

            let locations = await LocationModel.getAll();  // Get all locations from the database

            // Filter locations by name or address
            if (search.trim() !== "") {
                locations = locations.filter(
                    (l) =>
                    l.name.toLowerCase().includes(search.toLowerCase()) ||
                    (l.address || "").toLowerCase().includes(search.toLowerCase()),
                );
            }

            const selectedId = req.params.id; // Get selected location ID

            // Find selected location or create an empty one
            const selectedLocation = 
                locations.find((l) => l.id == selectedId) ||
                new LocationModel(null, "", "");

                // Render location management page
            return res.render("location_management.ejs", {
                authenticatedUser: req.user,
                locations,
                selectedLocation,
                search,
                error: null,
            });
        } catch (err) {
            // Handle errors
            console.error(err);
            return res.status(500).render("status.ejs", {
                status: "Internal Server Error",
                message: "Failed to load locations",
            });
        }
    }

    /**
     * Handles creating, updating and deleting gym locations.
     *
     * Retrieves the requested action, location ID,
     * name and address from the submitted form.
     *
     * Validates location names and addresses, including
     * required fields, length restrictions, uppercase
     * naming requirements and prevention of HTML input.
     *
     * Uses LocationModel to create, update or delete
     * location records in the MySQL database.
     *
     * Redisplays the location management page when
     * validation errors occur.
     *
     * Handles database errors that may occur
     * during location management operations.
     *
     * Redirects to the location management page on success
     * or displays an error page if a database operation fails.
     *
     * @static
     * @async
     * @param {Object} req - The Express request object containing the location ID, CRUD action and form details.
     * @param {Object} res - The Express response object used for redirects and rendered pages.
     * @returns {Promise<Object>} A promise resolving to a redirect, rendered page or error response.
     */
    
    static async handleLocations(req, res) {
        /**
         * Checks whether the provided input contains HTML-like tags.
         *
         * Uses a regular expression to detect HTML-like tags
         * in submitted location names and addresses.
         *
         * @param {string} [input=""] - The text to check for HTML-like tags.
         * @returns {boolean} True if HTML-like tags are detected,
         * otherwise false.
         */
        function containsHTML(input = "") {
            return /<[^>]*>/.test(input);
        }
        const { action } = req.body;  // Get the CRUD action submitted by the location management form
        const id = req.params.id || req.body.id; // Get the location ID from the URL or the submitted form
        const name = req.body.name?.trim(); // Get the location name and remove leading and trailing spaces
        const address = req.body.address?.trim();  // Get the location address and remove leading and trailing spaces

        let error = null; // Initialise a variable to store any validation error messages

        //Validation - For Location
        if (!name || name.length < 2) {
        error = "Location name must be at least 2 characters";
        } else if (containsHTML(name)) {
        error = "Location name must not contain HTML tags";
        } else if (containsHTML(address)) {
        error = "Location address must not contain HTML tags";
        } else if (/\d/.test(name)) {
        error = "Location name must not contain numbers";
        } else if (!/^[A-Z]/.test(name)) {
        error = "Location name must start with an uppercase letter";
        } else if (name.length > 50) {
        error = "Location name is too long";
        }

    //Address Validation
    if (address && address.length > 200) {
        error = "Address exceeds limit (Max 200 Characters)"
    }

    if(error) {
        const locations = await LocationModel.getAll();  // Retrieve the locations again for the management page
        const selectedLocation = new LocationModel(id, name, address); // Keep the user's entered values in the form

        // Render the page with the validation error
        return res.render("location_management.ejs", {
            authenticatedUser: req.user,
            locations,
            selectedLocation,
            search: "",
            error,
        });
    }
// Create, update, or delete a location, then redirect back to the location page; show an error if the database operation fails.
    const location = new LocationModel(id, name, address);

    try {
        if(action === "create") {
            await LocationModel.create(location);
        }

        if (action === "update") {
            await LocationModel.update(location);
        }

        if (action === "delete") {
            await LocationModel.delete(id);
        }

        return res.redirect("/location");
    } catch (err) {
        console.log(err);
            // Prevent deleting a location while sessions still reference it through a foreign key
            if (
                err.code === "ER_ROW_IS_REFERENCED" ||
                err.code === "ER_ROW_IS_REFERENCED_2"
            ) {
                return res.status(400).render("status.ejs", {
                    status: "Cannot Delete Location",
                    message: "This location cannot be deleted because one or more sessions still reference it.",
                });
            }
                //Handle any other Database error
            return res.status(500).render("status.ejs", {
                status: "Internal Server Error",
                message: "Database error",
            });
        }        
    }
}