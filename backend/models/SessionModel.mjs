import { DatabaseModel } from "./DatabaseModel.mjs";

export class SessionModel extends DatabaseModel {

    // Constructor creates a SessionModel object with all session information
    constructor(
        id,
        activityId,
        trainerId,
        locationId,
        sessionDate,
        startTime,
        endTime,
        capacity,
    ) {
        super(); //Calls the parent class constructor

        // Store the session details in the model object
        this.id = id;
        this.activityId = activityId;
        this.trainerId = trainerId;
        this.locationId = locationId;
        this.sessionDate = sessionDate;
        this.startTime = startTime;
        this.endTime = endTime;
        this.capacity = capacity;
    }
    // Convert a database row into a SessionModel object
    static tableToModel(row) {

        // Use the sessions data if it exists, otherwise use the row directly
    const r = row.sessions || row;

// Convert one database row into a SessionModel object
// using the values returned from the sessions table
    return new SessionModel(
        r.session_id,
        r.activity_id,
        r.trainer_id,
        r.location_id,
        r.session_date,

        // Format database times from HH:MM:SS to HH:MM
        r.start_time?.substring(0, 5) || "",
        r.end_time?.substring(0, 5) || "",
        r.capacity,
    );
}
    //Get all sessions from the database
    static async getAll() {
        const rows = await this.query(`
            SELECT *
            FROM sessions
            ORDER BY session_date DESC
            `);

            // Convert database rows into SessionModel objects
            return rows.map((row) => this.tableToModel(row));
    }

    // Get one session using its ID
    static async getById(id) {
        const rows = await this.query(
            `
            SELECT *
            FROM sessions
            WHERE session_id = ?
            `,
            [id],
        );

            // Return null if the session does not exist
        if(!rows.length) return null;

        return this.tableToModel(rows[0]);
    }

    // Find an existing session with the same details
static async findDuplicate(session) {
    const rows = await this.query(
        `
        SELECT *
        FROM sessions
        WHERE trainer_id = ?
        AND location_id = ?
        AND activity_id = ?
        AND session_date = ?
        AND start_time = ?
        AND end_time = ?
        `,
        [
            session.trainerId,
            session.locationId,
            session.activityId,
            session.sessionDate,
            session.startTime,
            session.endTime,
        ],
    );

    // Return the duplicate session if found, otherwise return null
    return rows.length ? this.tableToModel(rows[0]) : null;
}

    // Creates a new session using INSERT so bookings can reference its session ID
    static async create(session) {

        // Run the INSERT query and return the database result
        return this.query(
            `
            INSERT INTO sessions
            (trainer_id, location_id, activity_id, session_date, start_time, end_time, capacity)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            `,

             // Send the session values into the SQL placeholders
            [
            session.trainerId,
            session.locationId,
            session.activityId,
            session.sessionDate,
            session.startTime,
            session.endTime,
            session.capacity,
            ],
        );
    }

    // Update an existing session
    static async update(session) {

         // Run the UPDATE query and return the database result
        return this.query(
            `
            UPDATE sessions
            SET trainer_id = ?, location_id = ?, activity_id = ?, session_date = ?, start_time = ?, end_time = ?, capacity = ?
            WHERE session_id = ?
            `,

            // Send the updated session values into the SQL placeholders
            [
            session.trainerId,
            session.locationId,
            session.activityId,
            session.sessionDate,
            session.startTime,
            session.endTime,
            session.capacity,
            session.id,
            ],
        );
    }

    // Deletes all sessions belonging to a trainer when their account is deleted
static async deleteByTrainerId(trainerId) {

     // Run the DELETE query and return the database result
    return this.query(
        `
        DELETE FROM sessions
        WHERE trainer_id = ?
        `,
        [trainerId],
    );
}

// Permanently delete one session by ID.
// Hard deletes the session from the database.
// The foreign key prevents deletion if a booking still references this session, protecting referential integrity.
// The booking must be removed by an admin before the trainer can delete the session.
static async delete(id) {
    return this.query(
        `
        DELETE FROM sessions
        WHERE session_id = ?
        `,
        [id],
    );
}

// Get all sessions with trainer, location and activity details
    static async getAllWithDetails() {

// Fetch session records and join related tables so readable details like 
// trainer name, location name and activity name can be returned
        const rows = await this.query(`
            SELECT 
                session.session_id,
                session.trainer_id,
                session.location_id,
                session.activity_id,
                session.session_date,
                session.start_time,
                session.end_time,
                session.capacity,

                user.first_name,
                user.last_name,

                location.location_name,
                activity.activity_name

            FROM sessions AS session

            INNER JOIN users AS user
                ON session.trainer_id = user.user_id

            INNER JOIN locations as location
                ON session.location_id = location.location_id

            INNER JOIN activities AS activity
                ON session.activity_id = activity.activity_id

            WHERE 1 = 1

            ORDER BY session.session_date DESC
            `);

            // Convert each database row into session, user, location and activity objects
            return rows.map((row) => ({
            session: new SessionModel(
            row.session_id,
            row.activity_id,
            row.trainer_id,
            row.location_id,
            row.session_date,

            // Remove seconds from the session times
            row.start_time?.substring(0, 5) || "",
            row.end_time?.substring(0, 5) || "",
            row.capacity,
            ),
            // Trainer details
            user: {
                id: row.trainer_id,
                firstName: row.first_name,
                lastName: row.last_name,
            },
            //Location details
            location: {
                id: row.location_id,
                name: row.location_name,
            },
            //Activity Details
            activity: {
                id: row.activity_id,
                name: row.activity_name,
            },
        }));
    }
}

// TESTING
//SessionModel.getAll()
   // .then((sessions) => console.log("Sessions:", sessions))
   // .catch((error) => console.error("Error:", error));