import mysql from "mysql2/promise"
import { DatabaseModel } from "./DatabaseModel.mjs";

export class SessionModel extends DatabaseModel {
    /**
     * Creates an instance of the SessionModel.
     * @param {number} id - The ID of the session.
     * @param {number} activity_id - The ID of the activity associated with the session.
     * @param {string} date - The date of the session.
     * @param {string} start_time - The start time of the session.
     * @param {number} location_id - The ID of the location for the session.
     * @param {number} trainer_id - The ID of the trainer for the session.
     */
    constructor(id, activity_id, date, start_time, location_id, trainer_id) {
        super()
        this.id = id
        this.activity_id = activity_id
        this.date = date
        this.start_time = start_time
        this.location_id = location_id
        this.trainer_id = trainer_id
    }

    /**
     * Converts a row from the database into a SessionModel instance. 
     * @param {Object} row
     * @param {number} id - The ID of the session.
     * @param {number} activity_id - The ID of the activity associated with the session.
     * @param {string} date - The date of the session.
     * @param {string} start_time - The start time of the session.
     * @param {number} location_id - The ID of the location for the session.
     * @param {number} trainer_id - The ID of the trainer for the session
     * @returns {SessionModel} A new SessionModel instance.
     */
    static tableToModel(row) {
        return new SessionModel(
            row["id"],
            row["activity_id"],
            row["date"],
            row["start_time"],
            row["location_id"],
            row["trainer_id"]
        )
    }
    
    /**
     * Retrieves all sessions from database that are not deleted.
     * @returns {Promise<Array<SessionModel>>}
     */
    static getAll() {
    return this.query("SELECT * FROM sessions WHERE deleted = 0")
        .then(result => {
            return result.map(row => this.tableToModel(row));
        })
        .catch(error => {
            console.error("Error in getAll:", error);
        });
    }

    /**
     * Retrieves all distinct locations from the sessions.
     * @returns {Promise<Array<string>>} array of unique locations.
     */
    static getLocations() {
        return this.query("SELECT DISTINCT location_id FROM sessions")
            .then(result => result.map(row => row.location)); 
    }

    /**
     * Retrieves a session by it's ID.
     * @param {number} id 
     * @returns {Promise<SessionModel>} 
     * @throws {Promise<Error>} if no session found, rejects with message "not found"
     */
    static getById(id) {
        return this.query("SELECT * FROM sessions WHERE id = ?", [id])
            .then(result =>
                result.length > 0
                    ? this.tableToModel(result[0])
                    : Promise.reject("not found")
            )
    }

    /**
     * Updates an existing session within database by it's ID. 
     * @param {SessionModel} sessions
     * @returns {Promise<mysql.OkPacket>}
     */
    static update(sessions) {
        return this.query(`
            UPDATE sessions
            SET activity_id = ?, date = ?, start_time = ?, location_id = ?, trainer_id = ?
            WHERE id = ?
        `,
            [sessions.activity_id, sessions.date, sessions.start_time, sessions.location_id, sessions.trainer_id, sessions.id]
        )
    }

    /**
     * Creates a new session in database. 
     * @param {SessionModel} session 
     * @returns {Promise<mysql.OkPacket>}
     */
    static create(session) {
        return this.query(`
            INSERT INTO sessions
            (activity_id, date, start_time, location_id, trainer_id)
            VALUES (?, ?, ?, ?, ?)
        `,
            [session.activity_id, session.date, session.start_time, session.location_id, session.trainer_id]
        )
    }

    /**
     * Delete a session by it's ID.
     * @param {number} id 
     * @returns {Promise<mysql.OkPacket>}
     */
    static delete(id) {
        return this.query(
            `DELETE FROM sessions WHERE id = ?`,
            [id]
        )
    }

    /**
     * Soft deletes a session by setting its deleted value to 1, by ID.
     * @param {number} id 
     * @returns {Promise<mysql.OkPacket>}
     */
    static softDelete(id) {
        return this.query(
            `UPDATE sessions SET deleted = 1 WHERE id = ?`, 
            [id]
        )
    }
}


// testing

// SessionModel.getAll()
//     .then(sessions => console.log(sessions))
//     .catch(error => console.error(error))