import { DatabaseModel } from "./DatabaseModel.mjs";
import { ActivityModel } from "./ActivityModel.mjs";
import { LocationModel } from "./LocationModel.mjs";
import { SessionModel } from "./SessionModel.mjs";
import { UserModel } from "./UserModel.mjs";

// Model used for returning a session with its related activity, location and user
export class SessionActivityModel extends DatabaseModel{

    constructor(session, activity, location, user) {
        super(); // Call the parent DatabaseModel constructor
        // Store each related object
        this.session = session; // Store the session information
        this.activity = activity; //store the activity information
        this.location = location; //store the location information
        this.user = user; //store the trainer/user information
    }

    // ==================== CONVERT DATABASE ROW TO MODEL ====================

    // Convert a database row into a SessionActivityModel object
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

    // Base SQL query used to retrieve a session and its related data
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
    
    // Retrieve all sessions with their activity, location and trainer details
    static getAll() {

        // Run the SQL query to retrieve sessions and their related details from MySQL
        return this.query(this.baseQuery()).then((rows) =>

        // Convert every returned database row into a SessionActivityModel object
            rows.map((row) => this.tableToModel(row)),
        );
    }

    // ==================== GET SESSIONS BY TRAINER ====================

    // Retrieve sessions belonging to one specific trainer/user
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

    // Retrieve all sessions with their related details
    // An optional filter can be used to search the sessions
    static async getAllWithDetails(filter = ""){
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