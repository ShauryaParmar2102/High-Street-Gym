import express from "express";
import { BookingModel } from "../models/BookingModel.mjs";
import { AuthenticationController } from "./AuthenticationController.mjs";
import { SessionActivityModel } from "../models/SessionActivityModel.mjs"
import { LocationModel } from "../models/LocationModel.mjs";
import { ActivityModel } from "../models/ActivityModel.mjs";
import { UserModel } from "../models/UserModel.mjs";
import session from "express-session";

/**
 * Handles member and administrator booking management
 * in the High Street Gym web application.
 *
 * Provides routes for viewing, creating, updating
 * and deleting gym session bookings.
 *
 * Allows members to view their bookings, confirm
 * sessions and export booking information as XML.
 *
 * Allows administrators to manage bookings
 * using the booking management EJS interface.
 *
 * Uses BookingModel and related models to retrieve
 * booking, session, activity, location and user data.
 *
 * Applies role-based authorisation to protect routes.
 */
export class BookingController {
    static routes = express.Router();  // Create an Express router for all booking-related routes


    static {


    // ============================================================
    // MEMBER ROUTES
    // ============================================================

                // Display the logged-in member's bookings
        // Only users with the "member" role can access this route
        this.routes.get(
            "/member",
            AuthenticationController.restrict(["member"]), // Allow access only to members
            this.viewMemberBooking,
        );

        // Export the logged-in member's previous bookings as XML
        this.routes.get(
            "/member/export/xml",
            AuthenticationController.restrict(["member"]), // Allow access only to members
            this.exportMemberBookingsXml,
        );
        // Display the confirmation page before a member books a session
        // The session ID is provided through the URL
        this.routes.get(
            "/member/confirm/:id",
            AuthenticationController.restrict(["member"]), // Allow access only to members
            this.viewMemberBookingConfirm,
        );
            // Handle member booking form submissions
        // Used for member booking CRUD operations
        this.routes.post(
            "/member",
            AuthenticationController.restrict(["member"]), // Allow access only to members
            this.handleMemberBooking,
        );

        // ============================================================
        // ADMIN ROUTES
        // ============================================================

        // Display the admin booking management page
        // Only administrators can access this route
        this.routes.get(
            "/",
            AuthenticationController.restrict(["administrator"]), // Allow access only to administrators
            this.viewAdminBooking,
        );
   // Handle admin booking create, update and delete requests
        this.routes.post(
            "/",
            AuthenticationController.restrict(["administrator"]), // Allow access only to administrators
            this.handleBookingManagement,
        );
    }

    // ============================================================
    // MEMBER BOOKING VIEWS
    // ============================================================

    /**
     * Retrieves and displays bookings for the logged-in member.
     *
     * Uses BookingModel to retrieve the member's bookings
     * and SessionActivityModel to load session details.
     *
     * Combines each booking with its related session
     * information for display in the EJS template.
     *
     * Optionally retrieves a selected booking for editing.
     *
     * Renders the member bookings page on success
     * or HTTP 500 if the bookings cannot be loaded.
     *
     * @static
     * @async
     * @param {Object} req - The Express request object containing the authenticated member and optional edit ID.
     * @param {Object} res - The Express response object used to render the bookings page.
     * @returns {Promise<Object>} A promise resolving to the rendered page or error response.
     */
    static async viewMemberBooking(req, res) {
        try {
            const user = req.user; // Get the currently logged-in member

            // Get all active bookings belonging to this member
            const bookings = await BookingModel.getByMemberId(user.id); 

                // Get all sessions with activity, location and trainer details
            const sessions = await SessionActivityModel.getAll(); 

            // Add the full session details to each booking
            const enriched = bookings.map((b) => {

                 // Find the session that belongs to this booking
                const session = sessions.find((s) => s.session.id === b.sessionId);

                return {
                    ...b,
                    session: session || null,
                };
            });

            const editId = req.query.edit;
            let selectedBooking = null;

            if(editId) {
                selectedBooking = await BookingModel.getById(editId);
            }
                // Render the My Bookings page and send the booking data to the view
            return res.render("bookings.ejs", {
                bookings: enriched,
                sessions,
                selectedBooking,
                user,
            });
        } catch (error) {
            console.error(error);
            return res.status(500).render("status.ejs", {
                status: "Error",
                message: "Failed to load bookings",
            });
        }
    }

/**
 * Exports the authenticated member's booking history as XML.
 *
 * Retrieves bookings belonging to the logged-in member
 * and loads their related gym session information.
 *
 * Combines booking and session details before rendering
 * the member bookings XML EJS template.
 *
 * Sets the response content type to XML
 * and provides a downloadable XML filename.
 *
 * Returns the generated XML document on success
 * or HTTP 500 if the export fails.
 *
 * @static
 * @async
 * @param {Object} req - The Express request object containing the authenticated member.
 * @param {Object} res - The Express response object used to return the XML document.
 * @returns {Promise<Object>} A promise resolving to the XML response or error page.
 */
static async exportMemberBookingsXml(req, res) {
    try {

        // Get the currently logged-in member
        const member = req.user;

        // Get all bookings belonging to this member
        const bookings = await BookingModel.getByMemberId(member.id);

        // Get all sessions with activity, location and trainer details
        const sessions = await SessionActivityModel.getAll();

        // Add full session information to each booking
        let enriched = bookings.map((booking) => {

            const session = sessions.find(
                (s) => Number(s.session.id) === Number(booking.sessionId)
            );

            return {
                ...booking,
                session: session || null,
            };
        });

        
        // Tell the browser that the response contains XML
        res.type("application/xml");

        // Download the XML file
        res.setHeader(
            "Content-Disposition",
            'attachment; filename="member-bookings.xml"'
        );

        // Generate the XML using the member's previous booking data
        return res.render("xml/member_bookings.xml.ejs", {
            member,
            bookings: enriched,
            date: new Date().toISOString().split("T")[0],
        });

    } catch (error) {

        console.error(error);

        return res.status(500).render("status.ejs", {
            status: "XML Export Error",
            message: "Failed to export previous bookings",
        });
    }
}
 
    /**
     * Displays the booking confirmation page for a selected session.
     *
     * Retrieves the session ID from the request parameters
     * and loads available gym sessions from the database.
     *
     * Finds the selected session and displays
     * its details alongside the authenticated member.
     *
     * Renders the booking confirmation EJS template.
     *
     * Returns HTTP 404 if the session cannot be found
     * or HTTP 500 if an unexpected error occurs.
     *
     * @static
     * @async
     * @param {Object} req - The Express request object containing the selected session ID and authenticated member.
     * @param {Object} res - The Express response object used to render the confirmation page.
     * @returns {Promise<Object>} A promise resolving to the confirmation page or error response.
     */
    static async viewMemberBookingConfirm(req, res) {
        try {
            const user = req.user; // Get the currently logged-in member

            // Get the selected session ID from the URL and convert it to a number
            const sessionId = Number(req.params.id); 

             // Get all sessions with their activity, location and trainer details
            const sessions = await SessionActivityModel.getAll();

            // Find the session that matches the ID selected by the member
            const session = sessions.find((s) => Number(s.session.id) === sessionId);

            //Display an error if session does not exist
            if(!session) {
                return res.status(404).render("status.ejs", {
                    status: "Error",
                    message: "Session not found",
                });
            }
                // Render the booking confirmation page with the logged-in user and selected session
            return res.render("member_book_confirmation.ejs", { 
                user,
                session,
            });

        } catch (error) {
            // Log the error and display an error page
            console.error(error); 
            return res.status(500).render("status.ejs", {
                status: "Error",
                message: "Failed to load booking confirmation page",
                returnUrl: "/booking/member/confirm",
            });
        }
    }
    
    /**
     * Processes confirmation of a member's gym session booking.
     *
     * Retrieves the authenticated member and selected session ID.
     *
     * Checks whether the member has already booked
     * the session using BookingModel.
     *
     * Creates a booking if no matching booking exists
     * to prevent duplicate bookings.
     *
     * Redirects the member to the sessions page on success
     * or displays HTTP 500 if booking confirmation fails.
     *
     * @static
     * @async
     * @param {Object} req - The Express request object containing the member and session ID.
     * @param {Object} res - The Express response object used for redirects and error pages.
     * @returns {Promise<Object>} A promise resolving to the booking confirmation response.
     */
    static async handleConfirmBooking(req, res) {
        try {
            const user = req.user; // Get the currently logged-in member
            const sessionId = Number(req.params.id); // Get the session ID from the URL and convert it to a number

            //Prevent Duplicate booking
            const existing = await BookingModel.find(user.id, sessionId); // Check if the member has already booked this session

            // Only create the booking if it does not already exist
            if(!existing) {

                // Create a new booking for the member and selected session
                await BookingModel.create({
                    userId: user.id,
                    sessionId,
                    created: new Date(),
                });
            }
                // Redirect the member back to the sessions page
            return res.redirect("/session/member"); 
        } catch (error) {
            console.error(error); // Display the error in the server terminal

            // Show an error page if the booking could not be confirmed
            return res.status(500).render("status.ejs", {
                status: "Error",
                message: "Confirm booking failed",
                returnUrl: "/session/member",
            });
        }
    }
    
    /**
     * Handles member booking creation, updates and deletion.
     *
     * Retrieves the booking action and session details
     * from the submitted form.
     *
     * Deletes a booking when the delete action is selected
     * or updates an existing booking when requested.
     *
     * Checks for previous bookings to prevent duplicates
     * and reactivates bookings that were previously cancelled.
     *
     * Creates a new booking when no existing record is found.
     *
     * Redirects to the member bookings page on success
     * or returns HTTP 500 if an error occurs.
     *
     * @static
     * @async
     * @param {Object} req - The Express request object containing the authenticated member and booking form data.
     * @param {Object} res - The Express response object used for redirects and error pages.
     * @returns {Promise<Object>} A promise resolving to the booking management response.
     */
    static async handleMemberBooking(req, res) {
        try {
            const user = req.user; // Get the currently logged-in member

            let { id, userId, sessionId, created, action } = req.body;  // Get the booking information submitted from the form

            // Convert the booking ID and session ID into numbers
            id = id? Number(id) : null;
            sessionId = Number(sessionId);

             // Cancel the booking if the member selected delete
            if (action === "delete") {
                await BookingModel.delete(id);
                return res.redirect("/booking/member"); // Return the member to the My Bookings page
            }
                // Update an existing booking
            if (action === "update") {
                await BookingModel.update({
                    id,
                    sessionId,
                    created: new date(),
                    userId: user.id,
                });

                // Return the member to the My Bookings page
                return res.redirect("/booking/member");
            }

           // Check if this member has ever booked this session before
            const existing = await BookingModel.findAny(user.id, sessionId);

            // If a previous booking exists
            if (existing) {

             // Reactivate the booking if it was previously cancelled
            if (existing.bookingStatus === "cancelled") {
            await BookingModel.reactivate(existing.id);
            }

            return res.redirect("/booking/member");  // Return to the My Bookings page
            }

        // ==================== CREATE BOOKING ====================

             // Create a new booking if the member has never booked this session
            await BookingModel.create({
           memberId: user.id,
           sessionId,
        });
            // Go to My Bookings after creating the booking
        return res.redirect("/booking/member");

        } catch (error) {
            console.error(error); 

            // Display an error page if the booking action fails
            return res.status(500).render("status.ejs", {
                status: "Error",
                message: "Failed to manage booking",
                returnUrl: "/booking/member",
            });
        }
    }

    
    // ADMIN BOOKING MANAGEMENT VIEWS

    /**
     * Retrieves and displays bookings for administrators.
     *
     * Loads booking, session, user, location
     * and activity information from the database.
     *
     * Combines bookings with their related members
     * and sessions, then sorts them by session date.
     *
     * Supports searching by member, trainer, activity,
     * location and session start time.
     *
     * Optionally retrieves a selected booking for editing.
     *
     * Renders the administrator booking management EJS page
     * or HTTP 500 if the information cannot be loaded.
     *
     * @static
     * @async
     * @param {Object} req - The Express request object containing search and edit query parameters.
     * @param {Object} res - The Express response object used to render the management page.
     * @returns {Promise<Object>} A promise resolving to the rendered page or error response.
     */
    static async viewAdminBooking(req, res) {
        try {
        // Get all bookings from the database
            const bookings = await BookingModel.getAll(); 

        // Get all sessions and their activity information
            const sessions = await SessionActivityModel.getAll();

        // Get all users so each booking can be matched to a member
            const users = await UserModel.getAll();

        // Get all gym locations
            const locations = await LocationModel.getAll();

        //Get all gym activities
            const activities = ActivityModel.getAll();

        // Get the search value from the URL query
        // Use an empty string if no search was entered
        // Convert it to lowercase to make searching case-insensitive
            const search = (req.query.search || "").toLowerCase();

    // Add related session and member information to each booking
    let enriched = bookings.map((b) => {

    // Find the session that matches the booking's session ID
    const session = sessions.find((s) => s.session.id === b.sessionId);

    // Find the member that matches the booking's member ID
    const member = users.find((u) => u.id === b.memberId);

    // Return the original booking with its related session and member
                return {
                    ...b,
                    session: session || null,
                    user: member || null,
                };
            });

            // Sort bookings by session date
            enriched.sort((a, b) => {
                return (
                    new Date(a.session?.session?.sessionDate).getTime() -
                    new Date(b.session?.session?.sessionDate).getTime()
                );
            });
                        

           // Search
        if (search) {
        enriched = enriched.filter((b) => {

        // Get the member's full name
        const memberName =
            `${b.user?.firstName || ""} ${b.user?.lastName || ""}`.toLowerCase();

        // Get the trainer's full name
        const trainerName =
            `${b.session?.user?.firstName || ""} ${b.session?.user?.lastName || ""}`.toLowerCase();

        // Get the activity name
        const activityName =
            (b.session?.activity?.name || "").toLowerCase();

        // Get the location name
        const locationName =
            (b.session?.location?.name || "").toLowerCase();

        // Get the session start time
        const sessionTime =
            String(b.session?.session?.startTime || "").toLowerCase();

        // Check if any booking information matches the search
        return (
            memberName.includes(search) ||
            trainerName.includes(search) ||
            activityName.includes(search) ||
            locationName.includes(search) ||
            sessionTime.includes(search)
        );
    });
}

            const editId = req.query.edit; //Gets booking ID from the URL query parameter.

            let selectedBooking = null; //Gets booking ID that admin wants to edit from the URL

            // If an editId exists in the URL/query,
            // get that booking from the database
            if(editId){
                selectedBooking = await BookingModel.getById(editId);
            }

            // Filters the users so only members and trainers are included
            const members = users.filter(
                (user) => user.role === "member" || user.role === "trainer",
            );

            // Renders the admin booking management page and sends all the required data to the EJS view
            // and sends all the required data to the EJS view
            return res.render("booking_management.ejs", {
                bookings: enriched, // List of bookings with extra details
                sessions, // Available gym sessions
                users: members,  // Only member and trainer users
                locations, // Gym locations
                activities, // Gym activities
                selectedBooking, // Booking currently being edited, if any
                user: req.user,   // Currently logged-in admin
                search: req.query.search || "", // Search text from URL, or empty string
            });
        } catch(error) {
            console.log(error);
            // Shows an error page if the bookings could not be loaded
            return res.status(500).render("status.ejs", {
                status: "Error",
                message: "Admin bookings failed to load",
                returnUrl: "/booking",
            });
        }
    }

    /**
     * Handles administrator booking management operations.
     *
     * Retrieves the booking ID, session ID, member ID
     * and requested action from the submitted form.
     *
     * Allows administrators to create, update
     * and delete bookings using BookingModel.
     *
     * Validates required member and session information
     * before creating or updating a booking.
     *
     * Checks whether a booking already exists
     * to prevent duplicate booking records.
     *
     * Redirects to the booking management page on success.
     * Returns HTTP 409 for duplicate bookings
     * or HTTP 500 if a database operation fails.
     *
     * @static
     * @async
     * @param {Object} req - The Express request object containing the administrator's booking form data.
     * @param {Object} res - The Express response object used for redirects and error pages.
     * @returns {Promise<Object>} A promise resolving to the booking management response.
     */
    static async handleBookingManagement(req,res) {
        try {
            let { id, sessionId, userId, action} = req.body;

            id = id ? Number(id) : null;
            sessionId = sessionId ? Number(sessionId) : null;
            userId = userId ? Number(userId) : null;

            //Delete
            if (action === "delete") {
                await BookingModel.delete(id);
                return res.redirect("/booking?deleted=1");
            }
            
            //Validation
            if(!userId || !sessionId) {
                return res.redirect("/booking?error=missing_fields");
            }

          // Update an existing booking
        if (action === "update") {
            console.log("BODY:", req.body);

            await BookingModel.update({
                id,
                memberId: userId,
                sessionId,
            });

    return res.redirect("/booking?updated=1");
}

// ==================== BOOKING MANAGEMENT ====================

// ==================== DUPLICATE BOOKING PREVENTION ====================

// Check if the selected member has already booked this session
const existing = await BookingModel.findAny(userId, sessionId);

// Prevent the member from booking the same session twice
if (existing) {
    return res.status(409).render("status.ejs", {
        status: "Booking Exists",
        message: "This member has already booked this session.",
        returnUrl: "/booking",
    });
}

// ==================== CREATE BOOKING ====================

// Create and save a new booking in the database
await BookingModel.create({
    memberId: userId,
    sessionId,
    created: new Date(),
});

// Redirect back to the admin booking management page
return res.redirect("/booking?success=1");
        
    } catch(error) {
        console.error(error);
        return res.status(500).render("status.ejs", {
            status: "Error",
            message: "Failed to manage booking",
            returnUrl: "/booking",
        });
     }
  } 

} 

