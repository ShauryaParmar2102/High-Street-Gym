// Import the parent DatabaseModel class which contains shared database methods
import { DatabaseModel } from "./DatabaseModel.mjs";

// Define the ActivityModel class and inherit database functionality
export class ActivityModel extends DatabaseModel {

        // Constructor creates a new Activity object
    constructor(id, name, description) {
        super(); //Call parent class constructor

        //Assign values to the object
        this.id = id;
        this.name = name;
        this.description = description;
    }
        // Convert a database row into an ActivityModel object
    static tableToModel(row) {
        return new ActivityModel(
            row.activity_id,
            row.activity_name,
            row.description
        );
    }
    // Fetches all activities from the MySQL activities table
    static async getAll() {
            // SELECT retrieves all columns from the activities table
        return this.query(`
            SELECT * FROM activities
        `).then((results) =>
            results.map((row) => this.tableToModel(row))
        );
    }
        //Retrieve a single activity by ID
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

    // Adds a new activity to the MySQL activities table
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

    // Updates an existing activity in the MySQL activities table using its ID
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

// Deletes bookings linked to sessions that use the activity before deleting the activity
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

// Delete all sessions that are using this activity
static async deleteRelatedSessions(id) {
    return this.query(
        `
        DELETE FROM sessions
        WHERE activity_id = ?
        `,
        [id]
    );
}

// Delete an activity from the database by its ID
static async delete(id) {
    return this.query(
        `
        DELETE FROM activities
        WHERE activity_id = ?
        `,
        [id] // Delete the row with the matching ID
    );
}}