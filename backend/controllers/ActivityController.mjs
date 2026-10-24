import express from "express";
import { ActivityModel } from "../models/ActivityModel.mjs";
import { AuthenticationController } from "./AuthenticationController.mjs";

export class ActivityController {
    static routes = express.Router(); // Creates an Express router specifically for activity routes

    // Static block runs when the controller class is loaded
    // It sets up all routes handled by this controller
    static {

        // GET /activity
        // Displays all activities and optionally allows searching
        this.routes.get(
            "/",
            AuthenticationController.restrict(["administrator", "trainer"]), // Allow access only to administrators and trainers
            this.viewActivities,
        );

        // GET /activity/:id
        // Displays the activity management page with a specific activity selected
        this.routes.get(
            "/:id",
            AuthenticationController.restrict(["administrator", "trainer"]), // Allow access only to administrators and trainers
            this.viewActivities,
        );

        // POST /activity
        // Handles creation of a new activity
        this.routes.post(
            "/",
            AuthenticationController.restrict(["administrator", "trainer"]), // Allow access only to administrators and trainers
            this.handleActivities,
        );

        // POST /activity/:id
        // Handles updating or deleting an existing activity
        this.routes.post(
            "/:id",
            AuthenticationController.restrict(["administrator", "trainer"]), // Allow access only to administrators and trainers
            this.handleActivities,
        );
    }

    // Loads activities and displays the activity management page
    static async viewActivities(req, res) {
        try {

            // Gets the search query from the URL.
            // If no search was entered, use an empty string.
            const search = req.query.search || "";

            // Fetches all activities from the MySQL database using ActivityModel
            let activities = await ActivityModel.getAll();

            // Only filter the activities if the user entered a search term
            if (search.trim() !== "") {

                // Filter by activity name or description
                // toLowerCase() makes the search case-insensitive
                activities = activities.filter(
                    (a) =>
                        a.name.toLowerCase().includes(search.toLowerCase()) ||
                        (a.description || "").toLowerCase().includes(search.toLowerCase()),
                );
            }

            // Gets the activity ID from the URL, for example /activity/3
            const selectedId = req.params.id;

            // Finds the selected activity from the activities array.
            // If no matching activity exists, create an empty ActivityModel
            // so the form can be used for creating a new activity.
            const selectedActivity =
                activities.find((a) => a.id == selectedId) ||
                new ActivityModel(null, "", "");

            // Sends the activity data to the EJS view
            return res.render("activity_management.ejs", {
                authenticatedUser: req.user,
                activities,
                selectedActivity,
                search,
                error: null,
            });

        } catch (err) {
            console.error(err);

            return res.status(500).render("status.ejs", {
                status: "Internal Server Error",
                message: "Failed to load activities",
            });
        }
    }

    // Handle CRUD operations for activities - Supported actions: Create, Update, Delete
    static async handleActivities(req, res) {

        // Checks whether user input contains HTML tags.
        // This is used to reject HTML input such as <script> tags
        function containsHTML(input = "") {
            return /<[^>]*>/g.test(input);
        }

        // Gets the CRUD action sent by the form
        // Expected values include create, update or delete
        const { action } = req.body;

        // Get the activity ID either from the URL
        // or from a hidden form field
        const id = req.params.id || req.body.id;

        // Delete only needs the activity ID,
        // so handle deletion before validating name/description
       if (action === "delete") {
    try {

        // First delete bookings linked to sessions using this activity
        await ActivityModel.deleteRelatedBookings(id);

        // Then delete sessions that use this activity
        await ActivityModel.deleteRelatedSessions(id);

        // Finally delete the activity itself
        await ActivityModel.delete(id);

        // Return to Activity Management
        return res.redirect("/activity");

    } catch (err) {
        console.error(err);

        return res.status(500).render("status.ejs", {
            status: "Internal server error",
            message: "Failed to delete activity",
        });
    }
}

        // Get and clean the name and description submitted by the form
        // trim() removes spaces from the beginning and end
        const name = req.body.name?.trim();
        const description = req.body.description?.trim();

        // Stores any validation error that occurs
        let error = null;

        // Prevent HTML tags from being submitted

        if (containsHTML(name)) {
            error = "Activity name must not contain HTML tag";

        } else if (containsHTML(description)) {
            error = "Activity description must not contain HTML tags";

        } else if (!name || name.length === 0) {
            error = "Activity name is required";

            // Prevent activities from being created or updated without a description
        } else if (!description || description.length === 0) {
            error = "Activity description is required";

        } else if (/\d/.test(name)) {
            error = "Activity name must not contain numbers";

        } else if (!/^[A-Z]/.test(name)) {
            error = "Activity name must start with an uppercase letter";

        } else if (name.length < 2) {
            error = "Activity name is too short";

        } else if (name.length > 50) {
            error = "Activity name is too long";
        }

        // Description is required and cannot be longer than 255 characters
        if (description && description.length > 255) {
            error = "Description for activity must be less than 255 characters";
        }

        if (error) {

            // Reload all activities for the management table
            const activities = await ActivityModel.getAll();

            // Keep the user's entered values in the form
            // instead of clearing them after an error
            const selectedActivity = new ActivityModel(
                id,
                name,
                description,
            );

            // Redisplay the page with the validation error
            return res.render("activity_management.ejs", {
                authenticatedUser: req.user,
                activities,
                selectedActivity,
                search: "",
                error,
            });
        }

        // Convert the validated form data into an ActivityModel object
        const activity = new ActivityModel(
            id,
            name,
            description,
        );

        try {

            // CREATE
            // Add a new activity to the database
            if (action === "create") {
                await ActivityModel.create(activity);
            }

            // UPDATE
            // Update the selected activity in the database
            if (action === "update") {
                await ActivityModel.update(activity);
            }

            // Redirect back to the activity page after a successful operation
            return res.redirect("/activity");

        } catch (err) {
            console.error(err); // Catch database errors from create/update

            return res.status(500).render("status.ejs", {
                status: "Internal server error",
                message: "Database error",
            });
        }
    }
}