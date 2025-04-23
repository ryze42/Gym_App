import { DatabaseModel } from "./DatabaseModel.mjs";
import { SessionModel } from "./SessionModel.mjs";
import { ActivityModel } from "./ActivityModel.mjs";
import { LocationModel } from "./LocationModel.mjs";
import { UserModel } from "./UserModel.mjs";

/**
 * Represents a session with its associated trainer, activity, and location.
 */
export class SessionTrainerActivityLocationModel extends DatabaseModel {
    /**
     * Creates an instance of the SessionTrainerActivityLocationModel.
     * @param {SessionModel} session - The session related to the model.
     * @param {UserModel} trainer - The trainer related to the session.
     * @param {ActivityModel} activity - The activity related to the session.
     * @param {LocationModel} location - The location where the session takes place.
     */
    constructor(session, trainer, activity, location) {
        super();
        this.session = session;
        this.trainer = trainer;
        this.activity = activity;
        this.location = location;
    }

    /**
     * Converts a database row into a SessionTrainerActivityLocationModel instance.
     * @param {Object} row - The row returned from database with joined data.
     * @param {Object} row.sessions - The session details.
     * @param {Object} row.users - The trainer's details.
     * @param {Object} row.activities - The activity details.
     * @param {Object} row.locations - The location details.
     * @returns {SessionTrainerActivityLocationModel} new instance of the model 
     */
    static tableToModel(row) {
        return new SessionTrainerActivityLocationModel (
            SessionModel.tableToModel(row.sessions),
            UserModel.tableToModel(row.users),
            ActivityModel.tableToModel(row.activities),
            LocationModel.tableToModel(row.locations)
        )
    }

    /**
     * Retrieves the booking details for a session by its ID, including the session information,
     * available trainers, and available locations.
     * 
     * This method executes three queries:
     * 1. Retrieves session details joined with the trainer, activity, and location.
     * 2. Retrieves a list of all available trainers.
     * 3. Retrieves a list of all available locations.
     * 
     * @param {number|string} sessionId - The ID of the session to retrieve booking details for.
     * @returns {Promise<{ 
    *   session: SessionTrainerActivityLocationModel | null, 
    *   availableTrainers: Array<{ id: number, first_name: string, last_name: string }>, 
    *   availableLocations: Array<{ id: number, name: string }> 
    * }>} A promise resolving to an object containing:
    * - `session`: The session details (or `null` if not found).
    * - `availableTrainers`: An array of available trainers with their IDs and names.
    * - `availableLocations`: An array of available locations with their IDs and names.
    */
    static getAll() {
        return this.query(`
            SELECT sessions.*, users.*, activities.*, locations.*
            FROM sessions
            INNER JOIN users ON sessions.trainer_id = users.id AND users.role = 'trainer'
            INNER JOIN activities ON sessions.activity_id = activities.id
            INNER JOIN locations ON sessions.location_id = locations.id
            WHERE sessions.deleted = 0
        `, [])
        .then(result => {
            return result.map(row => this.tableToModel(row));
        })
    }

    /**
     * Retrieves the booking details for a session by its ID, including available trainers and locations.
     * 
     * @param {number|string} sessionId - The ID of the session to retrieve booking details for.
     * @returns {Promise<Object>} Resolves to an object containing the session, available trainers, and locations.
     */
    static getBookingDetailsBySessionId(sessionId) {
        const sql = `
            SELECT sessions.id, sessions.start_time, sessions.date, users.*, activities.*, locations.*
            FROM sessions
            INNER JOIN users ON sessions.trainer_id = users.id AND users.role = 'trainer'
            INNER JOIN activities ON sessions.activity_id = activities.id
            INNER JOIN locations ON sessions.location_id = locations.id
            WHERE sessions.deleted = 0 AND sessions.id = ?;

            SELECT id, first_name, last_name FROM users WHERE role = 'trainer';

            SELECT id, name FROM locations;
        `;
        return this.query(sql, [sessionId])
            .then(result => {
                const sessionResult = result[0];
                const trainersResult = result[1];
                const locationsResult = result[2];
                return {
                    session: sessionResult.length > 0 ? this.tableToModel(sessionResult[0]) : null,
                    availableTrainers: trainersResult,
                    availableLocations: locationsResult
                };
            });
    }

    /**
     * Retrieves all sessions matching the specified date, time, activity, and location.
     * This includes the session ID and the trainer's full name.
     * @param {string} date - The date of the session (YYYY-MM-DD format).
     * @param {string} start_time - The start time of the session (HH:MM:SS format).
     * @param {number} activity_id - The ID of the activity.
     * @param {number} location_id - The ID of the location.
     * @returns {Promise<Array<{ sessionId: number, trainerName: string }>>} A promise that resolves to an 
     * array of session objects containing the session ID and trainer's full name.
     */
    static getSessionsByDateTimeActivityLocation(date, start_time, activity_id, location_id) {
        const sql = `
          SELECT sessions.id AS sessionId, 
                 users.first_name, users.last_name, 
                 CONCAT(users.first_name, ' ', users.last_name) AS trainerName
          FROM sessions
          INNER JOIN users ON sessions.trainer_id = users.id AND users.role = 'trainer'
          WHERE sessions.date = ?
            AND sessions.start_time = ?
            AND sessions.activity_id = ?
            AND sessions.location_id = ?
            AND sessions.deleted = 0
          ORDER BY users.last_name ASC
        `;
        return this.query(sql, [date, start_time, activity_id, location_id])
          .then(rows => {
            return rows.map(row => ({
              sessionId: row.sessions.sessionId,
              trainerName: row[''].trainerName || `${row.users.first_name} ${row.users.last_name}`
            }));
          });
      }
 
}