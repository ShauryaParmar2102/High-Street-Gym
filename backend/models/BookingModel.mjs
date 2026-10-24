import { DatabaseModel } from "./DatabaseModel.mjs";

export class BookingModel extends DatabaseModel {

    constructor(id, memberId, sessionId, bookingStatus, bookedAt) {
    super(); //Call parent class constructor

    this.id = id; // Booking ID
    this.memberId = memberId; // Member who made the booking
    this.sessionId = sessionId; // Session that was booked
    this.bookingStatus = bookingStatus; // booked or cancelled
    this.bookedAt = bookedAt; // Date and time the booking was created
    }

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
     * Retrieves all active bookings from the database.
     *
     * @async
     * @returns {Promise<Array>} A list of booking records.
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
    // Get all active bookings belonging to a specific member.
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

    // Find an active booking for a specific member and session
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

    // Find any booking for a specific member and session, including cancelled bookings
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

    // Change a cancelled booking back to booked
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
    // Create a new booking for a user and selected session
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

    // Update an existing booking
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

    // Permanently delete all bookings belonging to a member
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

// Permanently delete bookings for sessions run by a trainer
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
