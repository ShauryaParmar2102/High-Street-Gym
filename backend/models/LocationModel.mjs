import { DatabaseModel } from "./DatabaseModel.mjs";

export class LocationModel extends DatabaseModel{ // LocationModel represents a location record from the database

    constructor(id, name, address){     // Constructor - creates a new LocationModel object
        super(); //Call parent class constructor
        
        this.id = id;         // Store the location ID
        this.name = name; //Store Location Name
        this.address = address; //Store location address
    }

    static tableToModel(row) { // Converts a database row into a LocationModel object
        const locationRow = row.location || row.locations || row; // Use the "location" or "locations" object if it exists,
        return new LocationModel(     // Create and return a new LocationModel object
        locationRow.location_id,     // Location ID Primary Key
        locationRow.location_name, //Name of the location
        locationRow.address, //Location address
        );
    }

// Gets all locations from the database
    static async getAll(){
            // Selects every row from the locations table
        return this.query("SELECT * FROM locations").then((results) => {

            // Converts each database row into a Location model object
            return results.map((row) => this.tableToModel(row));
             });
    }
    
    // Gets one location from the database using its ID
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
        // Update the location's name and address using its ID
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