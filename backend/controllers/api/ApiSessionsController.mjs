import express from "express";
import { ApiAuthenticationController } from "./ApiAuthenticationController.mjs";
import { SessionModel } from "../../models/SessionModel.mjs";
import { SessionActivityModel } from "../../models/SessionActivityModel.mjs";
import { ActivityModel } from "../../models/ActivityModel.mjs";
import { LocationModel } from "../../models/LocationModel.mjs";

export class ApiSessionsController {
    static routes = express.Router(); // Create an Express router for API session routes

    static {
    this.routes.use(ApiAuthenticationController.middleware);     // Run authentication middleware before all session API routes

    // ==================== SESSION API ROUTES ====================

    // These API routes connect the Express backend to the React frontend.
// React sends HTTP requests to these endpoints to retrieve,
// create, update and delete gym session information.

    this.routes.get("/", this.getSessions); //Get All gym sessions
    this.routes.get("/xml", this.getSessionsXML); // Export all gym sessions as an XML document
    this.routes.get("/trainer", this.getTrainerSessionsById); // Get all sessions for a specific trainer by their ID
    this.routes.get("/activities", this.getActivities);
this.routes.get("/locations", this.getLocations);

// Create a new trainer session
this.routes.post(
    "/",
    ApiAuthenticationController.restrict(["trainer"]),
    this.createTrainerSession
);

    // Update a trainer's existing session
this.routes.put(
    "/:id",
    ApiAuthenticationController.restrict(["administrator", "trainer"]),
    this.updateTrainerSession
);

    // Delete a session (administrators and trainers only)
    this.routes.delete("/:id",ApiAuthenticationController.restrict(["administrator", "trainer"]),
    this.deleteTrainerSessions,
    );
}

// Get all available activities
static async getActivities(req, res) {
    try {
        const activities = await ActivityModel.getAll();

        // Send available gym activities to the React frontend as JSON
        return res.status(200).json(activities);
    } catch (error) {
        return res.status(500).json({
            message: "Failed to load activities"
        });
    }
}

// Get all available locations
static async getLocations(req, res) {
    try {
        const locations = await LocationModel.getAll();

        // Send available gym locations to the React frontend as JSON
        return res.status(200).json(locations);
    } catch (error) {
        return res.status(500).json({
            message: "Failed to load locations"
        });
    }
}


// ==================== CREATE SESSION ====================

static async createTrainerSession(req, res) {
    try {
        const trainerId = Number(req.authenticatedUser.id);

        const {
            activityId,
            locationId,
            date,
            startTime,
            endTime,
            capacity
        } = req.body;

        // Validate required fields
        if (
            !activityId ||
            !locationId ||
            !date ||
            !startTime ||
            !endTime ||
            !capacity
        ) {
            return res.status(400).json({
                message: "Please complete all session fields"
            });
        }

        // Validate session details
        if (
            !Number.isInteger(Number(activityId)) ||
            Number(activityId) < 1 ||
            !Number.isInteger(Number(locationId)) ||
            Number(locationId) < 1 ||
            !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
            !/^\d{2}:\d{2}$/.test(startTime) ||
            !/^\d{2}:\d{2}$/.test(endTime) ||
            startTime >= endTime ||
            !Number.isInteger(Number(capacity)) ||
            Number(capacity) < 1
        ) {
            return res.status(400).json({
                message: "Invalid session details"
            });
        }

        // Prevent creating sessions in the past
        const startDateTime = new Date(`${date}T${startTime}:00`);

        if (
            Number.isNaN(startDateTime.getTime()) ||
            startDateTime <= new Date()
        ) {
            return res.status(400).json({
                message: "Cannot create a session in the past"
            });
        }

        const sessionData = {
            trainerId,
            activityId: Number(activityId),
            locationId: Number(locationId),
            sessionDate: date,
            startTime,
            endTime,
            capacity: Number(capacity)
        };

        // Prevent duplicate sessions
        const duplicate = await SessionModel.findDuplicate(sessionData);

        if (duplicate) {
            return res.status(409).json({
                message: "This exact session already exists"
            });
        }

        // Save the session to MySQL
        await SessionModel.create(sessionData);

        return res.status(201).json({
            message: "Session created successfully"
        });

    } catch (error) {
        console.error("CREATE SESSION ERROR:", error);

        return res.status(500).json({
            message: "Failed to create session"
        });
    }
}

    // ==================== GET ALL SESSIONS ====================

    // Get all sessions and return them as JSON data
    static async getSessions(req, res) {
        try {
            const { filter } = req.query; // Get the optional search/filter value from the request 

            // Fetch session data and related details from the database
            const sessions =
                await SessionActivityModel.getAllWithDetails(filter);

            const now = new Date(); // Get the current date and time

            // Convert each session into the format required by the API
            const formattedSessions = sessions.map((item) => {

                // Get the hour and minute from the session end time
                const [hh, mm] = (item.end_time || "00:00")
                    .slice(0, 5)
                    .split(":");

                const sessionEnd = new Date(item.session_date); // Create a date object using the session date

                // Add the session end time to the session date
                sessionEnd.setHours(
                    Number(hh),
                    Number(mm),
                    0,
                    0
                );

                // Check whether the session has already ended
                const isExpired =
                    sessionEnd.getTime() < now.getTime();

                // Return the session data as an object
                return {
                    session_id: item.session_id,
                    activity_name: item.activity_name,
                    location_name: item.location_name,
                    trainer_name: item.trainer_name,
                    session_date: item.session_date,
                    start_time: item.start_time,
                    end_time: item.end_time,
                    capacity: item.capacity,
                    isExpired,
                };
            });
            // Receive session form data from the React frontend and save it to MySQL
            return res.status(200).json(formattedSessions);
        } catch (err) {
            console.error("SESSION ERROR:", err);

            return res.status(500).json({
                message: "failed to load sessions from database",
                error: err.message,
            });
        }
    }

        // ==================== GET SESSIONS AS XML ====================

        // Retrieve all sessions and convert them into XML format
    static async getSessionsXML(req, res) {
        try {
            // Fetch all sessions with their related details from the database
            const sessions =
                await SessionActivityModel.getAllWithDetails();
            // Start the XML document
            let xml =
                `<?xml version="1.0" encoding="UTF-8"?>\n<sessions>\n`;
             // Add each session to the XML document
            sessions.forEach((s) => {
                xml += `
                    <session id="${s.session_id}">
                    <activity_name>${s.activity_name}</activity_name>
                    <location_name>${s.location_name}</location_name>
                    <date>${s.session_date}</date>
                    <start_time>${s.start_time}</start_time>
                    <end_time>${s.end_time}</end_time>
                    <capacity>${s.capacity}</capacity>
                </session>`;
            });
            // Close the XML document
            xml += `\n</sessions>`;
            // Set the response type to XML
            res.setHeader("Content-Type", "application/xml");
            // Send the XML response
            return res.status(200).send(xml);
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                message: "Failed to generate XML",
            });
        }
    }

        // ==================== GET SESSIONS BY TRAINER ====================

// Get all sessions belonging to a specific trainer
   static async getTrainerSessionsById(req, res) {
    try {
        // Check if the user is authenticated
        if (!req.authenticatedUser) {
            return res.status(401).json({
                message: "You must be logged in to view trainer sessions"
            });
        }

        const id = Number(req.authenticatedUser.id);

            const sessions = await SessionActivityModel.getByUserId(id); // Fetch sessions belonging to the selected trainer

            // Return the trainer's sessions as JSON
            return res.status(200).json(sessions);
        } catch(error) {
            console.error(error);
            return res.status(500).json({
                message: "Failed to load trainer sessions",
            });
           }  
         }

         // ==================== UPDATE SESSION ====================

// Update an existing trainer session
static async updateTrainerSession(req, res) {
    try {
        const id = Number(req.params.id);
        const userId = Number(req.authenticatedUser.id);

        // Validate the session ID
        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({
                message: "Invalid session ID",
            });
        }

        // Find the existing session
        const session = await SessionModel.getById(id);

        if (!session) {
            return res.status(404).json({
                message: "Session not found",
            });
        }

        // Only the session owner or an administrator can update it
        if (
            session.trainerId !== userId &&
            req.authenticatedUser.role !== "administrator"
        ) {
            return res.status(403).json({
                message: "You cannot edit another trainer's session",
            });
        }

        // Get updated values from the frontend
        const {
            activityId,
            locationId,
            date,
            startTime,
            endTime,
            capacity
        } = req.body;

        // Validate required fields
        if (
    activityId === undefined ||
    activityId === null ||
    activityId === "" ||
    locationId === undefined ||
    locationId === null ||
    locationId === "" ||
    !date ||
    !startTime ||
    !endTime ||
    capacity === undefined ||
    capacity === null ||
    capacity === ""
) {
            return res.status(400).json({
                message: "Please complete all session fields",
            });
        }

        if (
    !Number.isInteger(Number(activityId)) ||
    Number(activityId) < 1 ||
    !Number.isInteger(Number(locationId)) ||
    Number(locationId) < 1 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !/^\d{2}:\d{2}$/.test(startTime) ||
    !/^\d{2}:\d{2}$/.test(endTime) ||
    startTime >= endTime ||
    !Number.isInteger(Number(capacity)) ||
    Number(capacity) < 1
) {
    return res.status(400).json({
        message: "Invalid session details",
    });
}

        // Update all six session fields
session.activityId = Number(activityId);
session.locationId = Number(locationId);
session.sessionDate = date;
session.startTime = startTime;
session.endTime = endTime;
session.capacity = Number(capacity);


        // Save session changes submitted by the React frontend to MySQL
        await SessionModel.update(session);

        return res.status(200).json({
            message: "Session updated successfully",
        });

    } catch (error) {
        console.error("UPDATE SESSION ERROR:", error);

        return res.status(500).json({
            message: "Failed to update session",
        });
    }
}

         // ==================== DELETE SESSION ====================

         // Delete a session using its session ID
         static async deleteTrainerSessions(req, res) {
            try {
                const id = Number(req.params.id);  // Convert the session ID from the URL into a number
                
                await SessionModel.delete(id); // Permanently delete the selected session

                return res.status(200).json({
                    message: "Session deleted successfully"
                });

            } catch (error) {
                console.error(error);
                return res.status(500).json({
                    message: "failed to delete session. A member has booked this session."
                });
            }
         }
    }