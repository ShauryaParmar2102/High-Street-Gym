import express from "express";
import { LocationModel } from "../models/LocationModel.mjs";
import { AuthenticationController } from "./AuthenticationController.mjs";

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

    static async handleLocations(req, res) {
            // Reject input containing HTML tags to reduce the risk of XSS attacks.
        function containsHTML(input = "") {
            return /<[^>]*>/.test(input);
        }
        const { action } = req.body;
        const id = req.params.id || req.body.id;
        const name = req.body.name?.trim();
        const address = req.body.address?.trim();

        let error = null;

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