import express from "express";
import { BookingModel } from "../models/BookingModel.mjs";
import { AuthenticationController } from "./AuthenticationController.mjs";
import { SessionActivityModel } from "../models/SessionActivityModel.mjs"
import { LocationModel } from "../models/LocationModel.mjs";
import { ActivityModel } from "../models/ActivityModel.mjs";
import { UserModel } from "../models/UserModel.mjs";
import session from "express-session";

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

        // Display all bookings belonging to the currently logged-in member
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

    // Export the logged-in member's previous bookings as XML
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

    
        // Display the booking confirmation page
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
        // Handles confirming a session booking
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

    // ============================================================
    // ADMIN BOOKING MANAGEMENT VIEWS
    // ============================================================

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

    //Admin booking CRUD handler
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

