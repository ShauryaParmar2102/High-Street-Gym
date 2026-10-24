import express from "express";
import { SessionModel } from "../models/SessionModel.mjs";
import { BookingModel } from "../models/BookingModel.mjs";
import { LocationModel} from "../models/LocationModel.mjs";
import { PostModel } from "../models/PostModel.mjs";
import { ActivityModel } from "../models/ActivityModel.mjs";
import { AuthenticationController } from "./AuthenticationController.mjs";
import { SessionActivityModel } from "../models/SessionActivityModel.mjs";
import { BookingActivityModel } from "../models/BookingActivityModel.mjs";
import { UserModel } from "../models/UserModel.mjs";
import session from "express-session";

// SessionController handles public, member, trainer and administrator session features
// Foreign key relationship: A booking references a session, and a session references a location.
export class SessionController{
    static routes = express.Router();     // Express router used to define all /session routes

    static {
        //Public Timetable Page
        this.routes.get("/view", this.viewPublicTimetable);

            // Display sessions belonging to the logged-in trainer
        this.routes.get(
            "/trainer/view",
            AuthenticationController.restrict(["trainer"]), // Allow access only to trainers
            this.viewTrainerSession,
        );

        // Export the logged-in trainer's weekly sessions as XML
        this.routes.get(
            "/trainer/export/xml",
            AuthenticationController.restrict(["trainer"]), // Allow access only to trainers
            this.exportTrainerSessionsXml,
        );

           // Handle trainer session create/delete actions
        this.routes.post(
            "/trainer",
            AuthenticationController.restrict(["trainer"]), // Allow access only to trainers
            this.handleTrainerSessions,
        );

        // Display administrator session management page
        this.routes.get(
            "/",
            AuthenticationController.restrict(["administrator"]), // Allow access only to administrators
            this.viewSessionManagement,
        );
        
        // Handle administrator update/delete for a selected session
        this.routes.post(
            "/:id",
            AuthenticationController.restrict(["administrator"]), // Allow access only to administrators
            this.handleSessionManagement,
        );

        //Admin session CRUD (create)
        this.routes.post(
            "/",
            AuthenticationController.restrict(["administrator"]), // Allow access only to administrators
            this.handleSessionManagement,
        );

        //Member session view
        this.routes.get(
            "/member/view",
            AuthenticationController.restrict(["member"]), // Allow access only to members
            this.viewMemberSession,
        );
            // Alternative member session route
        this.routes.get(
            "/member",
            AuthenticationController.restrict(["member"]), // Allow access only to members
            this.viewMemberSession,
        );
        
        // Allow a member to book a session
        this.routes.post(
            "/book/:id",
            AuthenticationController.restrict(["member"]), // Allow access only to members
            this.handleMemberSession, 
        );

        // Allow a member to cancel a session
        this.routes.post(
            "/cancel/:id",
            AuthenticationController.restrict(["member"]), // Allow access only to members
            this.handleMemberSession,
        );
    }

    // ==================== PUBLIC TIMETABLE ====================
    
    //Public timetable view - Displays sessions grouped by weekday and blog posts by weekday
    static async viewPublicTimetable(req, res) {
        try {
            const user = req.user || null; // Get the logged-in user, or null if the visitor is a guest
            const sessions = await SessionActivityModel.getAll(); // Fetch all sessions with their related details from the database

            // Booked sessions for current user is logged in
        let bookedSessionIds = [];

        if (user?.id) {
            const bookings = await BookingModel.getByMemberId(user.id); // Get the member's bookings if a user is logged in
            bookedSessionIds = bookings.map((b) => Number(b.sessionId)); // Create a list containing the IDs of the sessions already booked
        }
        //Sessions grouped by weekday
        // Create an array for each day of the week
        const sessionByDay = {
        Monday: [],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: [],
        Saturday: [],
        Sunday: [],
        };

        const now = new Date(); // Get the current date and time

        sessions.forEach((item) => {
            const s = item.session;
            if (!s?.sessionDate) return;

            //Grouping of weekday
            const day = new Date(s.sessionDate).toLocaleDateString("en-AU", {
                weekday: "long",
                timeZone: "Australia/Brisbane",
            });

            if(!sessionByDay[day]) return;

            // Convert the session date into YYYY-MM-DD format
            const cleanDate =
            s.sessionDate instanceof Date
                ? s.sessionDate.toLocaleDateString("en-CA", {
                    timeZone: "Australia/Brisbane",
                })
                : s.sessionDate.split("T")[0];


            // Build the session end time to determine whether it has expired
            const dateStr = new Date(s.sessionDate).toISOString().split("T")[0];

            const [hh, mm] = (s.endTime || "00:00").slice(0, 5).split(":"); // Get the session's ending hour and minute

            const sessionEnd = new Date(dateStr); // Create a Date object using the session date

            sessionEnd.setHours(Number(hh), Number(mm), 0, 0); // Add the session's ending time to the date

            // Check whether the session has already ended
            const isExpired = sessionEnd.getTime() < now.getTime(); 
            
            // Add the session to the correct weekday group
            sessionByDay[day].push({
                session_id: s.id, // Store the session ID
                activity_name: item.activity.name, // Store the name of the activity
                location_name: item.location.name, // Store the name of the session location
                start_time: s.startTime, // Store the session start time
                end_time: s.endTime, //Store the session end time
                date: cleanDate, // Store the formatted session date
                trainer_name: item.user.firstName + " " + item.user.lastName,  // Combine the trainer's first and last name
                capacity: s.capacity, // Store the maximum number of members who can book the session
                isExpired, // Store whether the session has already ended

                // Check whether the logged-in member already booked this session
                isBooked: 
                    bookedSessionIds.includes(s.id),
            });
        });
        // Render the public timetable
        return res.render("timetable.ejs", {
            user,
            sessionByDay,
            bookedSessionIds,
        });
       } catch(error) {
        console.error(error);
        return res.status(500).render("status.ejs", {
            status: "Error",
            message: "Failed to load sessions",
        });
       }
    }

        // Display the administrator session management page
    static async viewSessionManagement(req,res){
        try{
                // Get the ID of the session selected for editing
            const editId = req.query.edit_id;

            // Convert empty query parameters to null
            const clean = (v) => (v && v.trim() !== "" ? v : null);

             // Read search/filter values from the URL
            const search = clean(req.query.search);
            const trainer = clean(req.query.trainer);
            const activity = clean(req.query.activity);
            const location = clean(req.query.location);
            const date = clean(req.query.date);
            const start_time = clean(req.query.start_time);
            const end_time = clean(req.query.end_time);
            const capacity = clean(req.query.capacity);

              // Get all sessions with joined display information
            let sessions = await SessionActivityModel.getAll();

            //Global Search
            if(search) {
                const q = search.toLowerCase();

                sessions = sessions.filter((s) => {

                        // Build the trainer's full name for searching
                    const trainerName = 
                    `${s.user?.firstName || ""} ${s.user?.lastName || ""}`.toLowerCase();

                     // Convert the session date into searchable text
                    const sessionDate = (s.session?.date || "").toString().slice(0, 10);

                     // Return sessions matching any searchable field
                    return (
                        trainerName.includes(q) ||
                        (s.activity?.name || "").toLowerCase().includes(q) ||
                        (s.location?.name || "").toLowerCase().includes(q) ||
                        sessionDate.includes(q)
                    );
                });
            }
                //Individual Filters

            // Filter by trainer name
            if (trainer) {
            sessions = sessions.filter(
            (s) =>
            `${s.user?.firstName || ""} ${s.user?.lastName || ""}`
                .toLowerCase()
                .includes(trainer.toLowerCase())
                );
            }
            //Filter by activity name
            if (activity) {
             sessions = sessions.filter(
            (s) =>
            (s.activity?.name || "")
                .toLowerCase()
                .includes(activity.toLowerCase())
            );
        }
        //Filter by location name
        if(location) {
            sessions = sessions.filter((s) => 
            (s.location?.name || "")
            .toLowerCase()
            .includes(location.toLowerCase()),
            );
        }

        //Filter by session date
        if (date) {
            sessions = sessions.filter((s) => {
                if(!s.session?.date) return false;

                const sessionDate = new Date(s.session.date)
                .toISOString()
                .split("T")[0];

            return sessionDate === date;
            });
        }

        //Filter by start time
        if (start_time) {
            sessions = sessions.filter(
                (s) => (s.session?.start_time || "").slice(0, 5) === start_time,
            );
        }
        //Filter by end time
        if (end_time) {
            sessions = sessions.filter(
                (s) => (s.session?.end_time || "").slice(0, 5) === end_time,
            );
        }

         // Filter by capacity
        if (capacity) {
            sessions = sessions.filter(
                (s) => Number(s.session?.capacity) === Number(capacity),
            );
        }
          // Format session dates for displaying in the UI
        const cleanSessions = sessions.map((item) => ({
            ...item,
            session: {
                ...item.session,
                date: item.session?.date
                ? new Date(item.session.date).toISOString().split("T")[0]
                : "",
            },

        start_time: item.session?.startTime || "",
        end_time: item.session?.endTime || "",
        }));

        //Edit Session
        let selectedSession = null;

        // Find the session selected by the administrator
        if(editId) {
            const found = cleanSessions.find((item) => item.session.id == editId);

            if (found) {
                selectedSession = {
                    session: found.session,
                    activity: found.activity,
                    location: found.location,
                    user: found.user,
                };
            }
        }

        //Get users that are trainers only
        const allUsers = await UserModel.getAll();
        const users = allUsers.filter((u) => u.role === "trainer");

        // Render the admin session management page
        return res.render("session_management.ejs", {
            user: req.user,
            sessions: cleanSessions,
            selectedSession,
            locations: await LocationModel.getAll(),
            activities: await ActivityModel.getAll(),
            users,

            search,
            trainer,
            activity,
            location,
            date,
            start_time,
            end_time,
            capacity,
        });

    } catch(error) {
        console.error(error);
        return res.status(500).render("status.ejs", {
            status: "Internal Server Error",
            message: "Failed to load admin sessions",
            returnUrl: "/session",
        });
      }
    }

    // ==================== ADMIN SESSION MANAGEMENT ====================
        // Handle administrator create, update and delete actions
    static async handleSessionManagement(req,res) {
        const selectedSessionId = req.params.id;
        const {
    sessionDate,
    startTime,
    endTime,
    capacity,
    action
} = req.body;

        try{
                  // Run validation when trainer is creating or updating a session
            if (action === "create" || action === "update") {

                // Combine date and time values into Date objects
                const startDateTime = new Date(`${sessionDate}T${startTime}`);
                const endDateTime = new Date(`${sessionDate}T${endTime}`);
                const now = new Date();

                // Prevent session creation in the past
                if (startDateTime < now) {
                    return res.status(400).render("status.ejs", {
                        status: "Validation Error",
                        message: "Session start time cannot be in the past",
                        returnUrl: "/session",
                    });
                }

                //End must be after start
                if(endDateTime <= startDateTime) {
                    return res.status(400).render("status.ejs", {
                        status: "Validation Error",
                        message: "End time must be after start time",
                        returnUrl: "/session",
                    });
                }

                //Capacity check
                if(Number(capacity) < 1) {
                    return res.status(400).render("status.ejs", {
                        status: "Validation error",
                        message: "Capacity must be at least 1",
                        returnUrl: "/session",
                    });
                }
            }

    // Create
    if (action === "create") {

    // Check whether the exact same session already exists
    const duplicateSession = await SessionModel.findDuplicate(req.body);

    // Prevent the exact same session from being created twice
    if (duplicateSession) {
        return res.status(400).render("status.ejs", {
            status: "Duplicate Session",
            message: "This exact session already exists.",
            returnUrl: "/session",
        });
    }

    await SessionModel.create(req.body);
}
                //Update
            if (action === "update") {
                await SessionModel.update({
                id: selectedSessionId,
                ...req.body,
            });
        }

        //Delete
        if(action === "delete") {
            await SessionModel.delete(selectedSessionId);
        }
        return res.redirect("/session") ;

        // ==================== ADMIN SESSION DELETION ERROR HANDLING ====================
    } catch (err) {
    console.error(err);

    // Prevent deleting a session if a member still has a booking for it
    if (err.code === "ER_ROW_IS_REFERENCED") {
        return res.status(400).render("status.ejs", {
            status: "Cannot Delete Session",
            message: "This session cannot be deleted because a booking still references it.",
            returnUrl: "/session",
        });
    }

    // Handle any other server/database errors
    return res.status(500).render("status.ejs", {
        status: "Server Error",
        message: "Something went wrong while processing the session",
        returnUrl: "/session",
         });
        }
    }

          // Display sessions belonging to the logged-in trainer
      static async viewTrainerSession(req, res) {
        try {
            const user = req.user; // Get logged-in trainer

        // Get selected session for editing
        const editId = req.query.edit_id;

        // Read filters from the URL
        const {
        activity,
        location,
        trainer,
        date,
        start_time,
        end_time,
        capacity,
      } = req.query;

      // Get the logged-in trainer's scheduled sessions without duplicating sessions for each booking
      let sessions = await SessionActivityModel.getByUserId(user.id);

      // Filter by activity
      if(activity) {
        sessions = sessions.filter((s) => 
        s.activity.name.toLowerCase()
        .includes(activity.toLowerCase()),
        );
      }

        // Filter by location
      if (location) {
    sessions = sessions.filter(
        (s) =>
            (s.location?.name || "")
                .toLowerCase()
                .includes(location.toLowerCase()),
            );
        }
        // Filter by trainer name
        if (trainer) {
            const fullName = `${s.user.firstName} ${s.user.lastName}`.toLowerCase();
            sessions = sessions.filter((s) =>
          fullName.includes(trainer.toLowerCase()),
        )
    }

        // Filter by date
        if (date) {
            sessions = sessions.filter((s) => {
                if (!s.session?.date) return false;

                const sessionDate = new Date(s.session.date)
                .toISOString()
                .split("T")[0];

            return sessionDate === date;
            });
        }

            // Filter by start time
        if (start_time) {
            sessions = sessions.filter(
                (s) => (s.session?.start_time || "").slice(0, 5) === start_time,
            );
        }
        //Filter by end time
        if (end_time) {
            sessions = sessions.filter(
                (s) => (s.session?.end_time || "").slice(0, 5) === end_time,
            );
        }

        //Filter by capacity
        if (capacity) {
            sessions = sessions.filter(
                (s) => Number(s.session?.capacity) === Number(capacity),
            );
        }

      // Format the trainer's session data so it can be displayed correctly in the EJS view
    const cleanSessions = sessions.map((item) => ({
    ...item,  // Copy the existing joined session, activity, location and user data
// Create the session object that will be sent to the EJS page
    session: { 
        // Copy all existing session properties
        ...item.session, 
        // Format the session date using Brisbane time to prevent timezone date changes
       date: item.session?.sessionDate 
    ? new Date(item.session.sessionDate).toLocaleDateString("en-CA", { 
        timeZone: "Australia/Brisbane", 
    }) // Finish the Brisbane timezone formatting
    : "", // Use an empty string if there is no session date

        start_time: item.session?.startTime || "",  // Get the session start time, or use an empty string if it is missing
        end_time: item.session?.endTime || "",  // Get the session end time, or use an empty string if it is missing
    },
// Finish creating the formatted sessions array
}));

        //Edit Session
        let selectedSession = null;

        if(editId) {
            const found = cleanSessions.find((item) => item.session.id == editId);
            
            if(found) {
                selectedSession = {
                    session: found.session,
                    activity: found.activity,
                    location: found.location,
                    user: found.user,
                };
            }
        }

        //Render
        return res.render("trainer_session.ejs", {
    user: req.user,
    sessions: cleanSessions,
    selectedSession,
    locations: await LocationModel.getAll(),
    activities: await ActivityModel.getAll(),
    trainer,
    activity,
    location,
    date,
    start_time,
    end_time,
    capacity,
});
        } catch(error) {
            console.error(error);
            return res.status(500).render("status.ejs", {
                status: "Internal Server Error",
                message: "Failed to load trainer sessions",
                returnUrl: "/session/trainer",
            });
        }
      }

     // Get the logged-in trainer's sessions, filter them by the selected week, and generate a downloadable XML file
static async exportTrainerSessionsXml(req, res) {
    try {
        const trainer = req.user; // Get the currently logged-in trainer

        // Get the selected start and end dates from the URL query
        const { startDate, endDate } = req.query;        

        // Check that both dates were provided
        if (!startDate || !endDate) {
            return res.status(400).render("status.ejs", {
                status: "Invalid Export",
                message: "Please select a start and end date",
            });
        }
        // Get all sessions belonging to the logged-in trainer
        let sessions =
            await SessionActivityModel.getByUserId(trainer.id);

        // Filter the trainer's sessions to only include the selected date range
        sessions = sessions.filter((item) => {
            const sessionDate =
                new Date(item.session.sessionDate)
                    .toISOString()
                    .split("T")[0];
        // Keep sessions that are between the start and end dates
            return (
                sessionDate >= startDate &&
                sessionDate <= endDate
            );
        });
        // Set the response content type to XML
        res.type("application/xml");

        // Tell the browser to download the response as an XML file
        res.setHeader(
            "Content-Disposition",
            'attachment; filename="trainer-sessions.xml"'
        );

        // Render the XML template with the trainer and session data
        return res.render("xml/trainer_sessions.xml.ejs", {
            trainer, // Send the logged-in trainer to the XML template
            sessions, // Send the filtered sessions to the XML template
            startDate, // Send the selected start date to the XML template
            endDate, // Send the selected end date to the XML template
        });

    } catch (error) {
        console.error(error);
        // Return an error page if the XML export fails
        return res.status(500).render("status.ejs", {
            status: "XML Export Error",
            message: "Failed to export trainer sessions",
        });
    }
}

    // ==================== TRAINER SESSION MANAGEMENT ====================
          // Handle trainer session creation and deletion
      static async handleTrainerSessions(req, res) {

        const trainerId = req.user.id; // Get the logged-in trainer's ID

        // Get submitted form values
        const {action, session_id, date, start_time, end_time, capacity} =
            req.body;

        try {

            if (action === "create" || action === "update") {
            
            // Convert dates to Date objects for validation
            const now = new Date();

            // Prevent administrators from creating sessions with a start date or time in the past
            const startDateTime = new Date(`${date}T${start_time}:00`);

            // Prevent trainers from creating sessions with a start date or time in the past
            if (startDateTime.getTime() <= now.getTime()) {
                return res.status(400).render("status.ejs", {
                    status: "Bad Request",
                    message: "Cannot create session in the past",
                });
            }

            // Validate session capacity
            if (Number(capacity) < 1) {
            return res.status(400).render("status.ejs", {
                 status: "Invalid Capacity",
                message: "Capacity cannot be 0. It must be greater than 0.",
                    });
                }
            }
                // Create a new session for the trainer
                 if (action === "create") {

                    // Check if an exact session already exists
                        const duplicateSession = await SessionModel.findDuplicate({
                        trainerId: trainerId,
                        locationId: req.body.location_id,
                        activityId: req.body.activity_id,
                        sessionDate: date,
                        startTime: start_time,
                        endTime: end_time,
                    });

                    // Stop the trainer from creating the exact same session twice
                    if (duplicateSession) {
                        return res.status(400).render("status.ejs", {
                            status: "Duplicate Session",
                            message: "This exact session already exists.",
                        });
                    }

                    // Create the new session in the database using the trainer's form data
                   await SessionModel.create({
                    trainerId: trainerId,
                    locationId: req.body.location_id,
                    activityId: req.body.activity_id,
                    sessionDate: date,
                    startTime: start_time,
                    endTime: end_time,
                    capacity: capacity,
                    });
                }

                // Update one of the logged-in trainer's own sessions
                if (action === "update") {

                    const existing = await SessionModel.getById(session_id);

                    // Make sure the session exists
                    if (!existing) {
                        return res.status(404).send("Session not found");
                    }

                    // Only allow the trainer to update their own session
                    if (Number(existing.trainerId) !== Number(trainerId)) {
                        return res.status(403).send("Not allowed");
                    }
                    // Update the trainer's session using the submitted form data
                    await SessionModel.update({
                        id: Number(session_id),
                        trainerId: trainerId,
                        locationId: req.body.location_id,
                        activityId: req.body.activity_id,
                        sessionDate: date,
                        startTime: start_time,
                        endTime: end_time,
                        capacity: capacity,
                    });
                }
    // ==================== SESSION MANAGEMENT ====================

    // ==================== TRAINER SESSION DELETION ====================

                // Delete one of the trainer's sessions
                if (action === "delete") {
                    // Get the selected session
                    const existing = await SessionModel.getById(session_id);

                    // Make sure the session exists
                    if(!existing) {
                        return res.status(404).send("session not found");
                    }
                     // Prevent trainers from deleting sessions they do not own
                    if (Number(existing.trainerId) !== Number(trainerId)) {
                        return res.status(403).send("Not allowed");
                    }
                    // Delete the selected session
                    // The database stops deletion if the session has an active booking
                    await SessionModel.delete(session_id); 
                }
                // Return trainer to their sessions page
                return res.redirect("/session/trainer/view");

                // ==================== TRAINER SESSION DELETION ERROR HANDLING ====================

            } catch(error) {
                console.error(error);

        // Display an error message when a session cannot be deleted because it has an existing booking
                return res.status(500).render("status.ejs", {
                    status: "Cannot delete session",
                    message: "This session cannot be deleted because a booking still references it.",
                });
              }
            }

                // Display available sessions to a member and show their booking status
            static async viewMemberSession(req, res) {
                try {
                    const user = req.user;  // Get the currently logged-in member

                    const sessions = await SessionActivityModel.getAll();// Get all sessions with their activity, location and trainer details

                    const bookings = await BookingModel.getByMemberId(user.id); // Get all active bookings belonging to this member

                    const bookedSessionIds = bookings.map((b) => Number(b.sessionId));// Store the IDs of sessions the member has already booked

                    //Create an array for days of the week
                    const sessionByDay = {
                    Monday: [],
                    Tuesday: [],
                    Wednesday: [],
                    Thursday: [],
                    Friday: [],
                    Saturday: [],
                    Sunday: [],
                    };

                    // Go through every available session
                    sessions.forEach((item) => {
                    if (!item.session?.sessionDate) return; // Skip the session if it does not have a date

                    // Determine the Brisbane weekday
                    const day = new Date(item.session.sessionDate).toLocaleDateString("en-AU", {
                     weekday: "long",
                     timeZone: "Australia/Brisbane",
                     });

                    if (!sessionByDay[day]) return; // Skip the session if the weekday is invalid

                    const rawDate = item.session.sessionDate; //Get the session date

                    let cleanDate = "";

                        // Convert the date into YYYY-MM-DD format for the view
                    if (rawDate instanceof Date) {
                        cleanDate = rawDate.toLocaleDateString("en-CA", {
                            timeZone: "Australia/Brisbane",
                        });
                    } else if (typeof rawDate === "string") {
                        cleanDate = rawDate.split("T")[0];
                    }
                        // Add readable session data to the correct weekday
                    sessionByDay[day].push({
                        session_id: item.session.id,
                        activity_name: item.activity.name,
                        location_name: item.location.name,
                       start_time: item.session.startTime,
                        end_time: item.session.endTime,
                        date: cleanDate,
                        trainer_name: item.user.firstName + " " + item.user.lastName,
                        capacity: item.session.capacity,
                        // ==================== MEMBER BOOKING STATUS ====================
                        isBooked: bookedSessionIds.includes(item.session.id), // Check whether this member has already booked the session
                    });
                });

               // Sort each weekday's sessions from earliest to latest
                Object.keys(sessionByDay).forEach((day) => {
                    sessionByDay[day].sort((a, b) => {
                        return new Date(a.date) - new Date(b.date);
                    });
                });

                 //res.render() tells Express to render the member_session.ejs view. 
                 // The SessionController passes user, sessionByDay, and bookedSessionIds to 
                 // the view so the EJS page can display that information."

                return res.render("member_session.ejs", { // Render the member sessions page and send the session data to the EJS view
                    user,
                    sessionByDay,
                    bookedSessionIds,
                });
            } catch (error) {
                console.error(error); // Log the real error in the terminal

                // Display an error page if the sessions cannot be loaded
                return res.status(500).render("status.ejs", {
                    status: "Internal Server Error",
                    message: "Failed to load member sessions",
                });
            }  
         }
        // Handle a member selecting a session to book
         static async handleMemberSession(req, res) {
            try {
                const userId = req.user.id; //Get logged in member
                const sessionId = req.params.id; // Get selected session ID from URL

             // Get the selected session from the database
            const targetSession = await SessionModel.getById(sessionId);

            // Make sure the session exists
            if (!targetSession) {
            return res.status(404).render("status.ejs", {
              status: "Not found",
                message: "Session not found",
            });
        }       

             // Convert the session date into a Date object
            const sessionDate = new Date(targetSession.sessionDate);
            sessionDate.setHours(0, 0, 0, 0);

            // Get current day's date
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Prevent booking sessions in the past
            if (sessionDate < today) {
            return res.status(422).render("status.ejs", {
            status: "Invalid Booking",
            message: "Cannot book previous dates",
            });
        }

                const user = req.user; // Get current member information

                   // Create the booking
                await BookingModel.create({
                    sessionId,   // The session the member wants to book
                    created: new Date(),  // The current date/time the booking was made
                    customerFirstName: user.firstName, // Logged-in member's first name
                    customerLastName: user.lastName, // Logged-in member's last name
                    customerEmail: user.email, // Logged-in member's email
                    userId,  // ID of the member
                });

                // Return member to their bookings page
                return res.redirect("/booking/member/view");
            } catch (error) {
                console.error(error);
                return res.status(500).render("status.ejs", {
                    status: "Internal Server Error",
                    message: "Member booking error",
                });
            }
         }
    }


