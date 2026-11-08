import { DatabaseModel } from "./DatabaseModel.mjs";
import { ActivityModel } from "./ActivityModel.mjs";
import { LocationModel } from "./LocationModel.mjs";
import { SessionModel } from "./SessionModel.mjs";
import { UserModel } from "./UserModel.mjs";

// Model used for returning a session with its related activity, location and user

/**
 * Represents a gym session together with its related activity,
 * location and trainer information.
 *
 * Extends DatabaseModel to retrieve session data from MySQL.
 */
export class SessionActivityModel extends DatabaseModel{

    /**
     * Creates a new SessionActivityModel instance.
     *
     * Stores the session information together with its related
     * activity, location and trainer objects.
     *
     * Each object is created using its corresponding model class.
     *
     * @constructor
     * @param {SessionModel} session - The session containing its ID, date, times and capacity.
     * @param {ActivityModel} activity - The activity associated with the session.
     * @param {LocationModel} location - The location where the session is scheduled.
     * @param {UserModel} user - The trainer assigned to the session.
     */
    
    constructor(session, activity, location, user) {
        super(); // Call the parent DatabaseModel constructor
        // Store each related object
        this.session = session; // Store the session information
        this.activity = activity; //store the activity information
        this.location = location; //store the location information
        this.user = user; //store the trainer/user information
    }

    // ==================== CONVERT DATABASE ROW TO MODEL ====================

    /**
     * Converts a database row into a SessionActivityModel object.
     *
     * Takes a row returned from a SQL query containing joined
     * session, activity, location and user information.
     *
     * Uses the tableToModel method from each related model
     * to convert the row into individual model objects.
     *
     * @static
     * @param {Object} row - The database row containing session and related table fields.
     * @returns {SessionActivityModel} A new object containing the converted models.
     */
    static tableToModel(row) {

    // Convert each part of the joined database row using its related model
    return new SessionActivityModel(
        SessionModel.tableToModel(row),
        ActivityModel.tableToModel(row),
        LocationModel.tableToModel(row),
        UserModel.tableToModel(row),
    );
}

    // ==================== BASE SQL QUERY ====================

    /**
     * Returns the base SQL query used to retrieve gym sessions.
     *
     * Uses INNER JOIN statements to connect the sessions table
     * with the activities, locations and users tables.
     *
     * The tables are joined using their related foreign keys
     * so each session includes its activity, location and trainer.
     *
     * @static
     * @returns {string} The SQL SELECT statement for retrieving joined session data.
     */
    static baseQuery() {
    return `
    SELECT *
    FROM sessions AS session

    INNER JOIN activities AS activity
        ON session.activity_id = activity.activity_id

    INNER JOIN locations AS location
        ON session.location_id = location.location_id

    INNER JOIN users AS user
        ON session.trainer_id = user.user_id
    `;
}

    // ==================== GET ALL SESSIONS ====================

    // ==================== DATABASE DATA RETRIEVAL ====================
    
    /**
     * Retrieves all gym sessions from the MySQL database.
     *
     * Executes the SQL query returned by baseQuery().
     *
     * Converts each database row into a SessionActivityModel
     * object using the tableToModel() method.
     *
     * @static
     * @returns {Promise<SessionActivityModel[]>} A promise resolving to an array
     * of session objects containing their related activity, location and trainer.
     */
    static getAll() {

        // Run the SQL query to retrieve sessions and their related details from MySQL
        return this.query(this.baseQuery()).then((rows) =>

        // Convert every returned database row into a SessionActivityModel object
            rows.map((row) => this.tableToModel(row)),
        );
    }

    // ==================== GET SESSIONS BY TRAINER ====================

    /**
     * Retrieves gym sessions assigned to a specific trainer.
     *
     * Uses the base SQL query and adds a WHERE condition
     * to filter sessions using the trainer's user ID.
     *
     * Uses a parameterised SQL query to safely pass the user ID.
     *
     * Converts each returned row into a SessionActivityModel object.
     *
     * @static
     * @param {number} userId - The unique ID of the trainer.
     * @returns {Promise<SessionActivityModel[]>} A promise resolving to
     * an array of sessions assigned to the specified trainer.
     */
    static getByUserId(userId) {

    // Add a WHERE condition to the base query to only get a specific trainer's sessions
    return this.query(
        this.baseQuery() + " WHERE session.trainer_id = ?",
        [userId],
    ).then((rows) =>

    // Convert every returned row into a SessionActivityModel object
        rows.map((row) => this.tableToModel(row))
    );
}

    // ==================== GET SESSIONS WITH DETAILS AND FILTERING ====================

    /**
     * Retrieves gym sessions with their related activity,
     * location and trainer information.
     *
     * Builds a SQL query that joins the sessions, activities,
     * locations and users tables.
     *
     * Supports optional searching by activity name, location
     * name or the trainer's full name.
     *
     * When a trainer ID is provided, only sessions belonging
     * to that trainer are retrieved.
     *
     * Uses parameterised SQL queries to safely handle
     * search values and trainer IDs.
     *
     * Orders the sessions by date in descending order.
     *
     * Converts the database results into simplified objects
     * containing session IDs, names, dates, times and capacity.
     *
     * @static
     * @async
     * @param {string} [filter=""] - Optional text used to search for gym sessions.
     * @param {number|null} [trainerId=null] - Optional trainer ID used to filter sessions.
     * @returns {Promise<Object[]>} A promise resolving to an array
     * of session objects with their related details.
     */
    static async getAllWithDetails(filter = "", trainerId = null) {
        let query = `
        SELECT
        session.session_id,
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

      INNER JOIN locations AS location
        ON session.location_id = location.location_id

      INNER JOIN activities AS activity
        ON session.activity_id = activity.activity_id

      WHERE 1 = 1
        `;

        const params = []; // Stores the values that will be safely inserted into the SQL query

        // Filter sessions by the logged-in trainer when a trainer ID is provided
if (trainerId !== null) {
    query += " AND session.trainer_id = ?";
    params.push(trainerId);
}

        // If the user entered a search term, add search conditions to the query
        if (filter.trim()) {
            
        // Search by activity name, location name or trainer's full name
            query += `
            AND ( 
            activity.activity_name LIKE ?
            OR location.location_name LIKE ?
            OR CONCAT(user.first_name, ' ', user.last_name) LIKE ?
            )
            `;
            // Add % so MySQL can find the search text anywhere in the value
            const search = `%${filter}%`;

            params.push(search, search, search); // Add the search value for each ? placeholder
        }

        // Sort the sessions by date with the newest sessions first
        query += `
        ORDER BY session.session_date DESC
        `;

        // Run the completed SQL query and wait for the results
        const rows = await this.query(query, params);

               
        // Convert each database row into an easier object for the view to use
        // Convert each database row into an easier object for the view to use
return rows.map((row) => ({
    session_id: row.session_id, // Store the session ID

    activity_name: row.activity_name, // Stores the activity name

    location_name: row.location_name, // Stores the location name

    trainer_name: `${row.first_name} ${row.last_name}`, // Combine the trainer's first and last name

    session_date: row.session_date, // Store the session date

    start_time: row.start_time?.substring(0, 5), // Remove seconds from the start time

    end_time: row.end_time?.substring(0, 5), // Remove seconds from the end time

    capacity: row.capacity, // Store the maximum session capacity
}));
    }

}