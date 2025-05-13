import { DatabaseModel } from "./DatabaseModel.mjs";
import { BookingModel } from "./BookingModel.mjs";
import { SessionModel } from "./SessionModel.mjs";
import { UserModel } from "./UserModel.mjs";
import { ActivityModel } from "./ActivityModel.mjs";
import { LocationModel } from "./LocationModel.mjs";

/**
 * Represents a booking with its associated session, trainer, activity, and location.
 */
export class BookingSessionTrainerActivityLocationModel extends DatabaseModel {
    /**
     * Creates instance of BookingSessionTrainerActivityLocationModel.
     * @param {BookingModel} booking - The booking associated with the session.
     * @param {SessionModel} session - The session details.
     * @param {UserModel} trainer - The trainer assigned to the session.
     * @param {ActivityModel} activity - The activity for the session.
     * @param {LocationModel} location - The location of the session.
     */
    constructor(booking, session, trainer, activity, location) {
        super();
        this.booking = booking;
        this.session = session;
        this.trainer = trainer;
        this.activity = activity;
        this.location = location;
    }

    /**
     * Converts a database row into a BookingSessionTrainerActivityLocationModel instance.
     * @param {Object} row - The row returned from database with joined data.
     * @param {Object} row.bookings - The booking details.
     * @param {Object} row.sessions - The session details.
     * @param {Object} row.users - The trainer's details.
     * @param {Object} row.activities - The activity details.
     * @param {Object} row.locations - The location details.
     * @returns {BookingSessionTrainerActivityLocationModel} new instance of the model 
     */
    static tableToModel(row) {
        return new BookingSessionTrainerActivityLocationModel(
            BookingModel.tableToModel(row.bookings),
            SessionModel.tableToModel(row.sessions),
            UserModel.tableToModel(row.users),
            ActivityModel.tableToModel(row.activities),
            LocationModel.tableToModel(row.locations)
        );
    }

    /**
     * Retrieves all bookings along with their associated session, trainer, activity, and location.
     * This joins the bookings, sessions, users, activities, and locations tables.
     * 
     * @returns {Promise<Array<BookingSessionTrainerActivityLocationModel>>} - Promise that resolves 
     * to an array of BookingSessionTrainerActivityLocationModel instances.
     */
    static getAll() {
        return this.query(`
            SELECT bookings.*, sessions.*, users.*, activities.*, locations.*
            FROM bookings
            INNER JOIN sessions ON bookings.session_id = sessions.id
            INNER JOIN users ON sessions.trainer_id = users.id AND users.role = 'trainer'
            INNER JOIN activities ON sessions.activity_id = activities.id
            INNER JOIN locations ON sessions.location_id = locations.id
            WHERE sessions.deleted = 0
            ORDER BY sessions.date ASC, sessions.start_time ASC
        `, [])
        .then(result => {
            return result.map(row => this.tableToModel(row));
        });
    }

    /**
     * Retrieves booking details for a specific session by its ID.
     * This method joins the sessions, bookings, users, activities, and locations tables to gather the details.
     * @param {number|string} sessionId - The ID of the session for which to retrieve booking details.
     * @returns {Promise<{session: BookingSessionTrainerActivityLocationModel} | null>} - A promise that resolves 
     * to an object containing the session details as a BookingSessionTrainerActivityLocationModel instance, or null if no matching session is found.
     */
    static getBookingDetailsBySessionId(sessionId) {
        const sql = `
            SELECT bookings.*, sessions.*, users.*, activities.*, locations.*
            FROM sessions
            LEFT JOIN bookings ON sessions.id = bookings.session_id
            INNER JOIN users ON sessions.trainer_id = users.id AND users.role = 'trainer'
            INNER JOIN activities ON sessions.activity_id = activities.id
            INNER JOIN locations ON sessions.location_id = locations.id
            WHERE sessions.id = ?
              AND sessions.deleted = 0
            LIMIT 1
        `;
        return this.query(sql, [sessionId])
            .then(rows => {
                if (!rows || rows.length === 0) {
                    return null;
                }
                return {
                    session: this.tableToModel(rows[0])
                };
            });
    }

    /**
     * Retrieves all bookings for a specific user.
     * This method joins the bookings, sessions, users, activities, and locations tables to gather the details.
     * @param {number|string} userId - The ID of the user for whom to retrieve bookings.
     * @returns {Promise<Array<BookingSessionTrainerActivityLocationModel>>} - A promise that resolves 
     * to an array of BookingSessionTrainerActivityLocationModel instances.
     */
    static getAllForMember(memberId) {
        const sql = `
            SELECT bookings.*, sessions.*, users.*, activities.*, locations.*
            FROM bookings
            INNER JOIN sessions ON bookings.session_id = sessions.id
            INNER JOIN users ON sessions.trainer_id = users.id AND users.role = 'trainer'
            INNER JOIN activities ON sessions.activity_id = activities.id
            INNER JOIN locations ON sessions.location_id = locations.id
            WHERE bookings.member_id = ?
            AND sessions.deleted = 0
            ORDER BY sessions.date ASC, sessions.start_time ASC
        `;
        return this.query(sql, [memberId])
            .then(result => result.map(row => this.tableToModel(row)));
    }

    /**
     * Retrieves all bookings for a specific trainer by their ID.
     * This method joins the bookings, sessions, users, activities, and locations tables to gather the details.
     * @param {number|string} trainerId - The ID of the trainer for whom to retrieve bookings.
     * @returns {Promise<Array<BookingSessionTrainerActivityLocationModel>>} - A promise that resolves 
     * to an array of BookingSessionTrainerActivityLocationModel instances.
     */
    static getAllByTrainer(trainerId) {
        const sql = `
            SELECT bookings.*, sessions.*, users.*, activities.*, locations.*
            FROM bookings
            INNER JOIN sessions ON bookings.session_id = sessions.id
            INNER JOIN users ON sessions.trainer_id = users.id AND users.role = 'trainer'
            INNER JOIN activities ON sessions.activity_id = activities.id
            INNER JOIN locations ON sessions.location_id = locations.id
            WHERE sessions.trainer_id = ?
            AND sessions.deleted = 0
            ORDER BY sessions.date ASC, sessions.start_time ASC
        `;
        return this.query(sql, [trainerId])
            .then(result => result.map(row => this.tableToModel(row)));
    }

}