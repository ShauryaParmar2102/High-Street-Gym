import { DatabaseModel } from "./DatabaseModel.mjs";

/**
 * Represents a member booking in the High Street Gym system.
 *
 * Extends DatabaseModel to manage booking data in MySQL.
 * Allows bookings to be created, retrieved, updated and deleted.
 *
 * Also provides methods for finding existing bookings,
 * reactivating cancelled bookings and deleting bookings
 * associated with members, trainers and sessions.
 */
export class BookingModel extends DatabaseModel {

    /**
     * Creates a new BookingModel instance.
     *
     * Stores the booking ID, member ID, session ID,
     * booking status and the date the booking was created.
     *
     * @constructor
     * @param {number} id - The unique ID of the booking.
     * @param {number} memberId - The ID of the member making the booking.
     * @param {number} sessionId - The ID of the booked session.
     * @param {string} bookingStatus - The booking status, booked or cancelled.
     * @param {Date|string} bookedAt - The date and time the booking was created.
     */
    constructor(id, memberId, sessionId, bookingStatus, bookedAt) {
    super(); //Call parent class constructor

    this.id = id; // Booking ID
    this.memberId = memberId; // Member who made the booking
    this.sessionId = sessionId; // Session that was booked
    this.bookingStatus = bookingStatus; // booked or cancelled
    this.bookedAt = bookedAt; // Date and time the booking was created
    }

    /**
     * Converts a database row into a BookingModel object.
     *
     * Uses the booking information returned from the database
     * to create a new BookingModel instance.
     *
     * @static
     * @param {Object} row - The database row containing booking information.
     * @returns {BookingModel} A new BookingModel object containing the booking details.
     */
    static tableToModel(row) { // Converts a database row into a BookingModel object
        const b = row.bookings ?? row;     // Use the "bookings" object if it exists, otherwise use the row itself
        return new BookingModel( //Create and Return new bookingModel object
            b.booking_id, //Booking ID PK
            b.member_id, // Member who made the booking (Foreign Key)
            b.session_id, // Session that was booked (Foreign Key)
            b.booking_status, //Booking status, booked or cancelled
            b.booked_at, // Date and time the booking was created
        );
    }
    
    /**
     * Retrieves all active bookings from the MySQL database.
     *
     * Selects bookings with a status of 'booked'
     * and converts each row into a BookingModel object.
     *
     * @static
     * @async
     * @returns {Promise<BookingModel[]>} A promise resolving
     * to an array of active bookings.
     */
    static async getAll() {
            // Run the SQL query and store the returned database rows in "rows".
        const rows = await this.query(`
            SELECT *
            FROM bookings
            WHERE booking_status = 'booked';`
        );
    // Convert each database row into a BookingModel object
    // and return the resulting array.
        return rows.map((row) => this.tableToModel(row));
    }

    /**
     * Retrieves an active booking using its unique ID.
     *
     * Uses a parameterised SQL query to find a booking
     * with the specified ID and a status of 'booked'.
     *
     * Returns null if no matching booking exists.
     *
     * @static
     * @async
     * @param {number} id - The unique ID of the booking.
     * @returns {Promise<BookingModel|null>} A promise resolving
     * to the matching booking or null if not found.
     */
    static async getById(id) { // Get a single active booking by its booking ID

            // Run the SQL query and store the returned rows.
        const rows = await this.query(
        "SELECT * FROM bookings WHERE booking_id = ? AND booking_status = 'booked'", // Select all columns where the booking ID matches and whether the booking is currently active
        [id], // Replace the ? placeholder with the supplied booking ID.

        );
            // If a booking was found, convert the first row into a BookingModel object.
            // If no booking was found, return null.
        return rows.length ? this.tableToModel(rows[0]) : null;
    }
    /**
     * Retrieves all active bookings belonging to a member.
     *
     * Uses a parameterised SQL query to find bookings
     * with the specified member ID and a status of 'booked'.
     *
     * Converts each returned row into a BookingModel object.
     *
     * @static
     * @async
     * @param {number} memberId - The unique ID of the member.
     * @returns {Promise<BookingModel[]>} A promise resolving
     * to an array of the member's active bookings.
     */
    static async getByMemberId(memberId){

        // Run the SQL query and store the returned rows.
        const rows = await this.query(

        // Select all columns from the bookings table.
            `
        SELECT *
        FROM bookings
        WHERE member_id = ? AND booking_status = 'booked'
        `,
        [memberId], // Replace the ? placeholder with the member ID.
        );
    // Convert every returned database row into a BookingModel object
    // and return them as an array.
        return rows.map((row) => this.tableToModel(row));
    }

    /**
     * Finds an active booking for a specific member and session.
     *
     * Searches the bookings table for a matching member ID
     * and session ID where the booking status is 'booked'.
     *
     * @static
     * @async
     * @param {number} memberId - The unique ID of the member.
     * @param {number} sessionId - The unique ID of the session.
     * @returns {Promise<BookingModel|null>} The matching
     * active booking or null if not found.
     */
    static async find(memberId, sessionId) {

        // Search for an active booking that matches the member and session
        const rows = await this.query(
            `
             SELECT *
            FROM bookings
             WHERE member_id = ? AND session_id = ? AND booking_status = 'booked' 
            `,
            [memberId, sessionId],
        );

        // Return the booking if found, otherwise return null
        return rows.length ? this.tableToModel(rows[0]) : null;
    }

    /**
     * Finds an existing booking for a member and session.
     *
     * Searches for a booking regardless of whether
     * its status is booked or cancelled.
     *
     * @static
     * @async
     * @param {number} memberId - The unique ID of the member.
     * @param {number} sessionId - The unique ID of the session.
     * @returns {Promise<BookingModel|null>} The matching
     * booking or null if not found.
     */
    static async findAny(memberId, sessionId) {

        // Search for a booking that matches the member and session
        const rows = await this.query(
            `
            SELECT *
            FROM bookings
            WHERE member_id = ? AND session_id = ?
            `,
            [memberId, sessionId],
        );

         // Return the booking if found, otherwise return null
        return rows.length ? this.tableToModel(rows[0]) : null;
    }

    /**
     * Reactivates a cancelled booking by changing its status to 'booked'.
     *
     * Uses an UPDATE query to change the booking status
     * for the booking with the specified ID.
     *
     * @static
     * @async
     * @param {number} id - The unique ID of the booking to reactivate.
     * @returns {Promise<Object>} A promise resolving to the database UPDATE result.
     */
    static async reactivate(id) {
        return this.query(
            `
            UPDATE bookings
            SET booking_status = 'booked'
            WHERE booking_id = ?
            `,
            [id],
        );
    }
    /**
     * Creates a new gym booking in the MySQL database.
     *
     * Uses an INSERT query to save the member ID
     * and session ID with a status of 'booked'.
     *
     * @static
     * @async
     * @param {BookingModel} booking - The booking details to insert.
     * @returns {Promise<Object>} A promise resolving to the database INSERT result.
     */
    static async create(booking) {
        return this.query(
            `
            INSERT INTO bookings (member_id, session_id, booking_status)
            VALUES (?, ?, 'booked')
            `,
            // Replace the ? placeholders with the member and session IDs
            [booking.memberId, booking.sessionId],
        );
    }

/**
 * Updates an existing booking in the database.
 *
 * Uses an UPDATE query to change the member ID
 * and session ID of a booking using its unique ID.
 *
 * @static
 * @async
 * @param {BookingModel} booking - The updated booking details.
 * @returns {Promise<Object>} A promise resolving to the database UPDATE result.
 */
static async update(booking) {
    return this.query(
        `
        UPDATE bookings
        SET member_id = ?,
            session_id = ?
        WHERE booking_id = ?
        `,
        [
            booking.memberId, // Replace the first ? with the new member ID
            booking.sessionId, // Replace the second ? with the new session ID
            booking.id, // Replace the third ? with the booking ID to update
        ],
    );
}

/**
 * Permanently deletes all bookings belonging to a member.
 *
 * Uses a DELETE query to remove bookings
 * associated with the specified member ID.
 *
 * @static
 * @async
 * @param {number} memberId - The unique ID of the member.
 * @returns {Promise<Object>} A promise resolving to the database DELETE result.
 */
static async deleteByMemberId(memberId) {
    return this.query(
        `
        DELETE FROM bookings
        WHERE member_id = ?
        `,
        // Replace the ? with the selected member's ID
        [memberId],
    );
}

/**
 * Deletes bookings associated with a specific trainer.
 *
 * Finds sessions assigned to the trainer and removes
 * bookings that reference those sessions.
 *
 * @static
 * @async
 * @param {number} trainerId - The unique ID of the trainer.
 * @returns {Promise<Object>} A promise resolving to the database DELETE result.
 */
static async deleteByTrainerId(trainerId) {
    return this.query(
        `
        DELETE FROM bookings
        WHERE session_id IN (
            SELECT session_id
            FROM sessions
            WHERE trainer_id = ?
        )
        `,
        // Replace the ? with the trainer's ID
        [trainerId],
    );
}

    /**
     * Permanently deletes bookings associated with a gym session.
     *
     * Uses a DELETE query to remove all bookings
     * referencing the specified session ID.
     *
     * @static
     * @async
     * @param {number} sessionId - The unique ID of the gym session.
     * @returns {Promise<Object>} A promise resolving to the database DELETE result.
     */
    static async deleteBySessionId(sessionId) {
        return this.query(
            `
            DELETE FROM bookings
            WHERE session_id = ?
            `,
            [sessionId],
        );
    }
    /**
     * Permanently deletes a booking using its unique ID.
     *
     * Uses a parameterised DELETE query to remove
     * the matching booking from the database.
     *
     * @static
     * @async
     * @param {number} id - The unique ID of the booking to delete.
     * @returns {Promise<Object>} A promise resolving to the database DELETE result.
     */
    static async delete(id){
        return this.query(
            `
            DELETE FROM bookings
            WHERE booking_id = ?
            `,
            [id],
        );
    }
}

//TESTING AREA
//BookingModel.getAll().then((bookings) => console.log(bookings));
