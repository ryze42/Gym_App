import mysql from "mysql2/promise"
import { DatabaseModel } from "./DatabaseModel.mjs";

export class LocationModel extends DatabaseModel {
    /**
     * Creates an instance of the LocationModel. 
     * @param {number} id - The ID of the location.
     * @param {string} name - The name of the location.
     * @param {string} address - The address of the location.
     */
    constructor(id, name, address) {
        super()
        this.id = id
        this.name = name
        this.address = address
    }

    /**
     * Converts a row from the database into a LocationModel instance. 
     * @param {Object} row
     * @param {number} id - The ID of the location.
     * @param {string} name - The name of the location.
     * @param {string} address - The address of the location.
     * @returns {LocationModel} new LocationModel instance.
     */
    static tableToModel(row) {
        return new LocationModel(
            row["id"],
            row["name"],
            row["address"],
        )
    }

    /**
     * Retrieves all locations from database that are not deleted.
     * @returns {Promise<Array<LocationModel>>}
     */
    static getAll() {
        return this.query("SELECT * FROM locations WHERE deleted = 0")
            .then(result => result.map(row => this.tableToModel(row.locations)))
    }

    /**
     * Retrieves a location by its ID.
     * @param {number} id - ID of the location.
     * @returns {Promise<LocationModel>}
     * @throws {Promise<Error>} if no location found, rejects with message "not found".
     */
    static getById(id) {
        return this.query("SELECT * FROM locations WHERE id = ?", [id])
            .then(result =>
                result.length > 0
                    ? this.tableToModel(result[0].locations)
                    : Promise.reject("not found")
            )
    }

    /**
     * Updates and existing location in database by its ID.
     * @param {LocationModel} locations
     * @returns {Promise<mysql.OkPacket>}
     */
    static update(locations) {
        return this.query(`
            UPDATE locations
            SET name = ?, address = ? 
            WHERE id = ?
        `,
            [locations.name, locations.address, locations.id]
        )
    }

    /**
     * Creates a new location in the database 
     * @param {LocationModel} locations
     * @returns {Promise<mysql.OkPacket>}
     */
    static create(locations) {
        return this.query(`
            INSERT INTO locations
            (name, address)
            VALUES (?, ?)
        `,
            [locations.name, locations.address]
        )
    }

    /**
     * Deletes a location by its ID. 
     * @param {number} id 
     * @returns {Promise<mysql.OkPacket>}
     */
    static delete(id) {
        return this.query(
            `DELETE FROM locations WHERE id = ?`,
            [id]
        )
    }
}


//testing

// LocationModel.getAll()
//     .then(locations => console.log(locations))
//     .catch(error => console.error(error))