import { DatabaseModel } from "./DatabaseModel.mjs";

/**
 * Represents a gym location in the High Street Gym system.
 *
 * Extends DatabaseModel to manage location data in MySQL.
 * Allows locations to be created, retrieved, updated and deleted.
 *
 * Also provides methods for finding locations
 * using their unique ID or name.
 */
export class LocationModel extends DatabaseModel{ // LocationModel represents a location record from the database

    /**
     * Creates a new LocationModel instance.
     *
     * Stores the location's ID, name and address.
     *
     * @constructor
     * @param {number} id - The unique ID of the location.
     * @param {string} name - The name of the gym location.
     * @param {string} address - The address of the gym location.
     */
    constructor(id, name, address){     // Constructor - creates a new LocationModel object
        super(); //Call parent class constructor
        
        this.id = id;         // Store the location ID
        this.name = name; //Store Location Name
        this.address = address; //Store location address
    }

    /**
     * Converts a database row into a LocationModel object.
     *
     * Retrieves the location information from the database row
     * and creates a new LocationModel instance.
     *
     * Supports rows containing nested location information.
     *
     * @static
     * @param {Object} row - The database row containing location information.
     * @returns {LocationModel} A new LocationModel object containing the location details.
     */
    static tableToModel(row) { // Converts a database row into a LocationModel object
        const locationRow = row.location || row.locations || row; // Use the "location" or "locations" object if it exists,
        return new LocationModel(     // Create and return a new LocationModel object
        locationRow.location_id,     // Location ID Primary Key
        locationRow.location_name, //Name of the location
        locationRow.address, //Location address
        );
    }

    /**
     * Retrieves all gym locations from the MySQL database.
     *
     * Executes a SELECT query on the locations table
     * and converts each returned row into a LocationModel object.
     *
     * @static
     * @async
     * @returns {Promise<LocationModel[]>} A promise resolving
     * to an array of all gym locations.
     */
    static async getAll(){
            // Selects every row from the locations table
        return this.query("SELECT * FROM locations").then((results) => {

            // Converts each database row into a Location model object
            return results.map((row) => this.tableToModel(row));
             });
    }
    
    /**
     * Retrieves a gym location using its unique ID.
     *
     * Uses a parameterised SQL query to find
     * the matching location in the database.
     *
     * Returns null if the location does not exist.
     *
     * @static
     * @async
     * @param {number} id - The unique ID of the location.
     * @returns {Promise<LocationModel|null>} A promise resolving
     * to the matching location or null if not found.
     */
    static async getById(id){

    // Selects the location where the location_id matches the given ID
    // The ? is replaced safely with the value inside [id]
        return this.query("SELECT * FROM locations WHERE location_id = ?", [id]).then(
        (result) => {

            // Checks if a matching location was found
            if(result.length > 0) {

                // Converts the first database row into a Location model object
                return this.tableToModel(result[0]);
            }

            // Returns null if no location was found
            return null;
            },
        );
    }

    /**
     * Retrieves a gym location using its name.
     *
     * Searches the locations table for a record
     * with the specified location name.
     *
     * Returns null if no matching location exists.
     *
     * @static
     * @async
     * @param {string} name - The name of the gym location.
     * @returns {Promise<LocationModel|null>} A promise resolving
     * to the matching location or null if not found.
     */
    static async getByName(name) { // Finds a location by its name
        return this.query("SELECT * FROM locations WHERE location_name = ?", [name]).then(  // Run a SQL query to find a location with the given name
            (result) => {
                if (result.length > 0) { // If a matching location was found
                    return this.tableToModel(result[0]);  // Convert the database row into a LocationModel object
                }
                return null; // Return null if no matching location exists
            },
        );
    }

    /**
     * Creates a new gym location in the MySQL database.
     *
     * Uses an INSERT query to save the location's
     * name and address in the locations table.
     *
     * @static
     * @async
     * @param {LocationModel} location - The location details to insert.
     * @returns {Promise<Object>} A promise resolving
     * to the database INSERT query result.
     */
    static async create(location) { // Creates a new location in the database

        // Inserts a new location record
        return this.query( 
            `
            INSERT INTO locations (location_name, address)
            VALUES (?, ?)
            `,
            [location.name, location.address]
        );
    }
    /**
     * Updates an existing gym location in the database.
     *
     * Uses a parameterised UPDATE query to change
     * the location's name and address using its unique ID.
     *
     * @static
     * @async
     * @param {LocationModel} location - The updated location details.
     * @returns {Promise<Object>} A promise resolving
     * to the database UPDATE query result.
     */
    static async update(location) {
        return this.query(
            `
        UPDATE locations
        SET location_name = ?, address = ?
        WHERE location_id = ?
        `,
        [location.name, location.address, location.id],
        );
    }

    /**
     * Permanently deletes a gym location from the database.
     *
     * Uses a parameterised DELETE query to remove
     * the location with the specified ID.
     *
     * @static
     * @async
     * @param {number} id - The unique ID of the location to delete.
     * @returns {Promise<Object>} A promise resolving
     * to the database DELETE query result.
     */
    static async delete(id){ // Deletes a location from the database using its ID
        return this.query(     // Delete the matching location record
            `
            DELETE FROM locations
            WHERE location_id = ?
            `,
            [id],
        );
    }
}

// TESTING
//LocationModel.getAll()
  //  .then((locations) => console.log("Locations:", locations))
  //  .catch((err) => console.error("Error fetching locations:", err));