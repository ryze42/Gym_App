import mysql from "mysql2/promise"
import { DatabaseModel } from "./DatabaseModel.mjs";

export class BookingModel extends DatabaseModel {
    /**
     * Creates an instance of BookingModel.
     * @param {number} id - The booking id.
     * @param {number} member_id - The member making the booking.
     * @param {number} session_id - The session that was booked.
     * @param {string} [status="active"] - The booking status. Default is active
     */
    constructor(id, member_id, session_id, status = "active") {
        super();
        this.id = id;
        this.member_id = member_id;
        this.session_id = session_id;
        this.status = status;
    }

    /**
     * Converts a database row into a BookingModel instance.
     * @param {Object} row 
     * @param {number} row.id - The ID of the booking.
     * @param {number} row.member_id - The ID of the member making the booking.
     * @param {number} row.session_id - The ID of the session.
     * @param {string} row.status - The current status of the booking.
     * @returns {BookingModel} - A new instance of BookingModel.
     */
    static tableToModel(row) {
        return new BookingModel(
            row["id"],
            row["member_id"],
            row["session_id"],
            row["status"]
        );
    }

    /**
     * Retrieves all bookings that are not deleted.
     * @returns {Promise<Array<BookingModel>>}
     */
    static getAll() {
        return this.query("SELECT * FROM bookings WHERE status = 'active'")
            .then(result => result.map(row => this.tableToModel(row)));
    }
    
    static getById(id) {
        return this.query("SELECT * FROM bookings WHERE id = ? AND status = 'active'", [id])
            .then(result =>
            result.length > 0
                ? this.tableToModel(result[0])
                : Promise.reject(new Error("booking not found"))
            );
    }



    /**
     * Updates an existing booking by ID.
     * @param {BookingModel} booking 
     * @returns {Promise<mysql.OkPacket>}
     */
    static update(booking) {
        return this.query(`
            UPDATE bookings
            SET member_id = ?, session_id = ?, status = ?
            WHERE id = ?
        `,
            [
                booking.member_id,
                booking.session_id,
                booking.status || "active",
                booking.id
            ]
        );
    }

    /**
     * Creates a new booking.
     * @param {BookingModel} booking 
     * @returns {Promise<mysql.OkPacket>}
     */
    static create(booking) {
        return this.query(`
            INSERT INTO bookings
            (member_id, session_id, status)
            VALUES (?, ?, ?)
        `,
            [
                booking.member_id,
                booking.session_id,
                booking.status || "active"
            ]
        );
    }

    /**
     * Cancels a booking by updating its status to 'cancelled'.
     * @param {number} id - The booking ID.
     * @returns {Promise<mysql.OkPacket>}
     */
    static cancel(id) {
        return this.query(
            `UPDATE bookings SET status = 'cancelled' WHERE id = ?`,
            [id]
        );
    }

    /**
     * Finds an active booking for a given session and member.
     * @param {number} sessionId 
     * @param {number} memberId 
     * @returns {Promise<BookingModel|null>}
     */
    static findBookingBySessionAndMember(sessionId, memberId) {
        return this.query(
            "SELECT * FROM bookings WHERE session_id = ? AND member_id = ? AND status = 'active'",
            [sessionId, memberId]
        ).then(result => result.length > 0 ? this.tableToModel(result[0]) : null);
    }
}
