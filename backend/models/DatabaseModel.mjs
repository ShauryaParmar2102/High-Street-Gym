import mysql from "mysql2/promise";

/**
 * Provides shared database functionality for the High Street Gym system.
 *
 * Manages the MySQL connection pool and allows other models
 * to execute SQL queries using the shared connection.
 *
 * Also provides a method for converting JavaScript dates
 * into a MySQL-compatible date format.
 */
export class DatabaseModel{
    static connection; // Stores the MySQL connection pool

    // Static block runs automatically when the class is loaded
    static{
        this.connection = mysql.createPool(
            {
                host: "localhost",
                user: "gym_user",
                password: "shaurya21",
                database: "high_street_gym",
            });

             // Test database connection
        this.connection.getConnection()
            .then(connection => {
                console.log("Database connected successfully");
                connection.release();
            })
            .catch(error => {
                console.error("Database connection failed:", error);
            });
    }
    /**
 * Executes an SQL query using the MySQL connection pool.
 *
 * Accepts an SQL statement and optional parameter values.
 * Returns the database results after the query completes.
 *
 * @static
 * @param {string} sql - The SQL query to execute.
 * @param {Array} [values] - Optional values for SQL placeholders.
 * @returns {Promise<Array|Object>} A promise resolving to
 * the database rows or the result of a modification query.
 */
    static query(sql, values){
    return this.connection.query(sql, values).then(([result]) => result);

    }

    /**
     * Converts a JavaScript Date into a MySQL-compatible date string.
     *
     * Extracts the year, month and day from the supplied date
     * and formats them as YYYY-MM-DD.
     *
     * @static
     * @param {Date} date - The JavaScript Date object to convert.
     * @returns {string} The formatted date in YYYY-MM-DD format.
     */
    static toMySqlDate(date){
        const year = date.toLocaleString("default", {year: numeric});// Gets the year from the date
        const month = date.toLocaleString("default", {month: 2-digit}); // Gets the month as two digits, e.g. 08
        const day = date.toLocaleString("default", {day: 2-digit}); // Gets the day as two digits, e.g. 24
        return[year, month, day].join("-");// Joins the date parts together, e.g. 2026-08-24
    }
}