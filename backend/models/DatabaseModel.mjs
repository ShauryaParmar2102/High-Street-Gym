import mysql from "mysql2/promise";

// Creates a DatabaseModel class that handles the database connection and queries
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
    // Runs an SQL query against the database
    static query(sql, values){
    return this.connection.query(sql, values).then(([result]) => result);
  
    }
    static toMySqlDate(date){
        const year = date.toLocaleString("default", {year: numeric});// Gets the year from the date
        const month = date.toLocaleString("default", {month: 2-digit}); // Gets the month as two digits, e.g. 08
        const day = date.toLocaleString("default", {day: 2-digit}); // Gets the day as two digits, e.g. 24
        return[year, month, day].join("-");// Joins the date parts together, e.g. 2026-08-24
    }
}