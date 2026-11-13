// Import the base DatabaseModel class.
// BookingActivityModel inherits the database query functionality from this class.
import { DatabaseModel } from "./DatabaseModel.mjs";

/**
 * Manages the retrieval of gym bookings with related details. 
 *
 * Extends DatabaseModel to retrieve booking data from MySQL.
 *
 * Provides methods for retrieving a member's active bookings,
 * retrieving all bookings with their session, activity and
 * location information, and finding a booking by its ID.
 */
export class BookingActivityModel extends DatabaseModel {

    
    /**
     * Retrieves all active bookings belonging to a specific member.
     *
     * Uses INNER JOIN statements to retrieve booking information
     * together with the related session, activity and location.
     *
     * Only returns bookings with a status of 'booked'.
     *
     * Converts each database row into an object containing
     * the booking and its related details.
     *
     * @static
     * @async
     * @param {number} memberId - The unique ID of the member.
     * @returns {Promise<Object[]>} A promise resolving to an array
     * of active bookings with their session, activity and location details.
     */
    static async getByMember(memberId) {

        // Run a SQL query and pass the member ID as a parameter.
        const rows = await this.query(
            `
            SELECT
                b.booking_id,
                b.member_id,
                b.session_id,
                b.booking_status,
                b.booked_at,

                s.session_date,
                s.start_time,
                s.end_time,

                a.activity_id,
                a.activity_name,

                l.location_id,
                l.location_name

            FROM bookings b
            INNER JOIN sessions s
                ON b.session_id = s.session_id
            INNER JOIN activities a
                ON s.activity_id = a.activity_id
            INNER JOIN locations l
                ON s.location_id = l.location_id

            WHERE b.member_id = ?
            AND b.booking_status = 'booked'
            `,
            [memberId]
        );

        // Convert each database row into a cleaner nested object.
        // This makes the API response easier for the frontend to work with.
        return rows.map((row) => ({
            booking: {
                id: row.booking_id,
                memberId: row.member_id,
                sessionId: row.session_id,
                status: row.booking_status,
                bookedAt: row.booked_at
            },

            session: {
                id: row.session_id,
                date: row.session_date,
                startTime: row.start_time,
                endTime: row.end_time
            },

            activity: {
                id: row.activity_id,
                name: row.activity_name
            },

            location: {
                id: row.location_id,
                name: row.location_name
            }
        }));
    }
    /**
     * Retrieves all gym bookings with their related information.
     *
     * Uses INNER JOIN statements to connect the bookings,
     * sessions, activities and locations tables.
     *
     * Converts each returned database row into an object
     * containing the booking, session, activity and location.
     *
     * Includes bookings regardless of their booking status.
     *
     * @static
     * @async
     * @returns {Promise<Object[]>} A promise resolving to an array
     * of bookings with their related session, activity and location details.
     */
    static async getWithDetails() {
        const rows = await this.query(`
            SELECT
                b.booking_id,
                b.member_id,
                b.session_id,
                b.booking_status,
                b.booked_at,

                s.session_date,
                s.start_time,
                s.end_time,

                a.activity_id,
                a.activity_name,

                l.location_id,
                l.location_name

            FROM bookings b
            INNER JOIN sessions s
                ON b.session_id = s.session_id
            INNER JOIN activities a
                ON s.activity_id = a.activity_id
            INNER JOIN locations l
                ON s.location_id = l.location_id
        `);

        // Format each database row into grouped objects
        // rather than returning one large flat object.
        return rows.map((row) => ({
            booking: {
                id: row.booking_id,
                memberId: row.member_id,
                sessionId: row.session_id,
                status: row.booking_status,
                bookedAt: row.booked_at
            },

            session: {
                id: row.session_id,
                date: row.session_date,
                startTime: row.start_time,
                endTime: row.end_time
            },

            activity: {
                id: row.activity_id,
                name: row.activity_name
            },

            location: {
                id: row.location_id,
                name: row.location_name
            }
        }));
    }
    /**
     * Retrieves a single gym booking using its unique ID.
     *
     * Uses a parameterised SQL query to find the
     * matching booking in the bookings table.
     *
     * Returns the database row if the booking exists,
     * otherwise returns null.
     *
     * @static
     * @async
     * @param {number} id - The unique ID of the booking.
     * @returns {Promise<Object|null>} A promise resolving
     * to the booking record or null if not found.
     */
    static async getById(id) {

        // The ? placeholder prevents the ID from being inserted
        // directly into the SQL query.
        const rows = await this.query(
            `
            SELECT *
            FROM bookings
            WHERE booking_id = ?
            LIMIT 1
            `,
            [id]
        );

        // Return the first booking if one was found.
        // Otherwise return null.
        return rows[0] || null;

    }
}