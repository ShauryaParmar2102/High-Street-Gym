// Import the parent DatabaseModel class which contains shared database methods
import { DatabaseModel } from "./DatabaseModel.mjs";

/**
 * Represents a gym activity in the High Street Gym system.
 *
 * Extends DatabaseModel to manage activity data in MySQL.
 * Allows activities to be created, retrieved, updated and deleted.
 *
 * Also provides methods for deleting related bookings
 * and sessions when an activity is removed.
 */
export class ActivityModel extends DatabaseModel {

    /**
     * Creates a new ActivityModel instance.
     *
     * Stores the activity's ID, name and description.
     *
     * @constructor
     * @param {number} id - The unique ID of the activity.
     * @param {string} name - The name of the gym activity.
     * @param {string} description - A description of the activity.
     */
    constructor(id, name, description) {
        super(); //Call parent class constructor

        //Assign values to the object
        this.id = id;
        this.name = name;
        this.description = description;
    }
    /**
     * Converts a database row into an ActivityModel object.
     *
     * Uses the activity ID, name and description returned
     * from the activities table.
     *
     * @static
     * @param {Object} row - The database row containing activity information.
     * @returns {ActivityModel} A new ActivityModel object containing the activity details.
     */
    static tableToModel(row) {
        return new ActivityModel(
            row.activity_id,
            row.activity_name,
            row.description
        );
    }
    /**
     * Retrieves all gym activities from the MySQL database.
     *
     * Executes a SELECT query on the activities table
     * and converts each returned row into an ActivityModel object.
     *
     * @static
     * @async
     * @returns {Promise<ActivityModel[]>} A promise resolving
     * to an array of all gym activities.
     */
    static async getAll() {
            // SELECT retrieves all columns from the activities table
        return this.query(`
            SELECT * FROM activities
        `).then((results) =>
            results.map((row) => this.tableToModel(row))
        );
    }
    /**
     * Retrieves a gym activity using its unique ID.
     *
     * Uses a parameterised SQL query to find the
     * matching activity in the database.
     *
     * Returns null if the activity does not exist.
     *
     * @static
     * @async
     * @param {number} id - The unique ID of the activity.
     * @returns {Promise<ActivityModel|null>} A promise resolving
     * to the matching activity or null if not found.
     */
    static async getById(id) {
        return this.query(
            `
            SELECT * FROM activities
            WHERE activity_id = ?
            `,
            [id] // Safely insert the ID into the query
        ).then((result) =>
            result.length > 0 ? this.tableToModel(result[0]) : null //Return activity if found, if not found return null
        );
    }

    /**
     * Creates a new gym activity in the MySQL database.
     *
     * Uses an INSERT query to save the activity's
     * name and description in the activities table.
     *
     * @static
     * @async
     * @param {ActivityModel} activity - The activity details to insert.
     * @returns {Promise<Object>} A promise resolving
     * to the database INSERT query result.
     */
    static async create(activity) {
        return this.query(
            // INSERT command adds the activity name and description to the activities table
            `
            INSERT INTO activities (activity_name, description)
            VALUES (?, ?)
            `,
            // Provides the values for the activity name and description
            [activity.name, activity.description] 
        );
    }

    /**
     * Updates an existing gym activity in the database.
     *
     * Uses a parameterised UPDATE query to change
     * the activity's name and description using its ID.
     *
     * @static
     * @async
     * @param {ActivityModel} activity - The updated activity details.
     * @returns {Promise<Object>} A promise resolving
     * to the database UPDATE query result.
     */
    static async update(activity) {
        return this.query(
            `
            UPDATE activities
            SET activity_name = ?, description = ?
            WHERE activity_id = ?
            `,
            [activity.name, activity.description, activity.id] // Update the name and description for the matching ID
        );
    }

/**
 * Deletes bookings associated with a specific gym activity.
 *
 * Finds sessions belonging to the activity and removes
 * any bookings that reference those sessions.
 *
 * This helps prevent foreign key issues when
 * deleting activities and their related sessions.
 *
 * @static
 * @async
 * @param {number} id - The unique ID of the activity.
 * @returns {Promise<Object>} A promise resolving
 * to the database DELETE query result.
 */
static async deleteRelatedBookings(id) {
    return this.query(
        `
        DELETE FROM bookings
        WHERE session_id IN (
            SELECT session_id
            FROM sessions
            WHERE activity_id = ?
        )
        `,
        // Provides the activity ID used to find related sessions
        [id]
    );
}

/**
 * Deletes all gym sessions associated with an activity.
 *
 * Uses a DELETE query to remove sessions that
 * reference the specified activity ID.
 *
 * @static
 * @async
 * @param {number} id - The unique ID of the activity.
 * @returns {Promise<Object>} A promise resolving
 * to the database DELETE query result.
 */
static async deleteRelatedSessions(id) {
    return this.query(
        `
        DELETE FROM sessions
        WHERE activity_id = ?
        `,
        [id]
    );
}

/**
 * Permanently deletes a gym activity from the database.
 *
 * Uses a parameterised DELETE query to remove
 * the activity with the matching activity ID.
 *
 * @static
 * @async
 * @param {number} id - The unique ID of the activity to delete.
 * @returns {Promise<Object>} A promise resolving
 * to the database DELETE query result.
 */
static async delete(id) {
    return this.query(
        `
        DELETE FROM activities
        WHERE activity_id = ?
        `,
        [id] // Delete the row with the matching ID
    );
}}