import { DatabaseModel } from "./DatabaseModel.mjs";

/**
 * Represents a gym session in the High Street Gym system.
 *
 * Extends DatabaseModel to manage session data in MySQL.
 * Allows sessions to be created, retrieved, updated and deleted.
 *
 * Also provides methods for finding duplicate sessions
 * and retrieving sessions with related details.
 */
export class SessionModel extends DatabaseModel {

    /**
     * Creates a new SessionModel instance.
     *
     * Stores the session's ID, activity, trainer, location,
     * date, start time, end time and capacity.
     *
     * @constructor
     * @param {number} id - The unique ID of the session.
     * @param {number} activityId - The ID of the activity.
     * @param {number} trainerId - The ID of the assigned trainer.
     * @param {number} locationId - The ID of the session location.
     * @param {string|Date} sessionDate - The date of the session.
     * @param {string} startTime - The session start time.
     * @param {string} endTime - The session end time.
     * @param {number} capacity - The maximum number of participants.
     */
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
    
    /**
     * Converts a database row into a SessionModel object.
     *
     * Uses the session values returned from the database
     * and formats the start and end times to HH:MM.
     *
     * @static
     * @param {Object} row - The database row containing session information.
     * @returns {SessionModel} A new SessionModel object containing the session details.
     */
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
    /**
     * Retrieves all gym sessions from the MySQL database.
     *
     * Orders the sessions by date in descending order
     * and converts each database row into a SessionModel object.
     *
     * @static
     * @async
     * @returns {Promise<SessionModel[]>} A promise resolving
     * to an array of all gym sessions.
     */
    static async getAll() {
        const rows = await this.query(`
            SELECT *
            FROM sessions
            ORDER BY session_date DESC
            `);

            // Convert database rows into SessionModel objects
            return rows.map((row) => this.tableToModel(row));
    }

    /**
     * Retrieves a gym session using its unique ID.
     *
     * Executes a parameterised SQL query to find the
     * matching session in the database.
     *
     * Returns null if the session does not exist.
     *
     * @static
     * @async
     * @param {number} id - The unique ID of the session.
     * @returns {Promise<SessionModel|null>} A promise resolving
     * to the matching session or null if not found.
     */
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


/**
 * Checks whether a gym session already exists.
 *
 * Searches for a session with the same trainer,
 * location, activity, date, start time and end time.
 *
 * Uses a parameterised SQL query to check for duplicates.
 *
 * @static
 * @async
 * @param {SessionModel} session - The session details to check.
 * @returns {Promise<SessionModel|null>} A promise resolving
 * to the duplicate session or null if none exists.
 */
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

    /**
     * Creates a new gym session in the MySQL database.
     *
     * Uses an INSERT query to save the session's trainer,
     * location, activity, date, times and capacity.
     *
     * @static
     * @async
     * @param {SessionModel} session - The session details to insert.
     * @returns {Promise<Object>} A promise resolving
     * to the database INSERT query result.
     */
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

    /**
     * Updates an existing gym session in the database.
     *
     * Uses a parameterised UPDATE query to change the
     * session details using its unique session ID.
     *
     * @static
     * @async
     * @param {SessionModel} session - The updated session details.
     * @returns {Promise<Object>} A promise resolving
     * to the database UPDATE query result.
     */
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

/**
 * Deletes all gym sessions assigned to a specific trainer.
 *
 * Uses a DELETE query to remove sessions belonging
 * to the trainer when their account is deleted.
 *
 * @static
 * @async
 * @param {number} trainerId - The unique ID of the trainer.
 * @returns {Promise<Object>} A promise resolving
 * to the database DELETE query result.
 */
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

/**
 * Permanently deletes a gym session using its ID.
 *
 * Uses a parameterised DELETE query to remove the session.
 *
 * Foreign key constraints prevent deletion when
 * existing bookings still reference the session.
 *
 * @static
 * @async
 * @param {number} id - The unique ID of the session to delete.
 * @returns {Promise<Object>} A promise resolving
 * to the database DELETE query result.
 */
static async delete(id) {
    return this.query(
        `
        DELETE FROM sessions
        WHERE session_id = ?
        `,
        [id],
    );
}

/**
 * Retrieves all gym sessions with their related details.
 *
 * Uses INNER JOIN statements to retrieve session,
 * trainer, location and activity information.
 *
 * Orders the sessions by date in descending order.
 *
 * Converts each database row into an object containing
 * the session and its related trainer, location and activity.
 *
 * @static
 * @async
 * @returns {Promise<Object[]>} A promise resolving to an
 * array of session objects with their related details.
 */
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