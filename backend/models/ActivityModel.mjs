import mysql from "mysql2/promise"
import { DatabaseModel } from "./DatabaseModel.mjs";

export class ActivityModel extends DatabaseModel {
    /**
     * Creates an instance of ActivityModel.
     * @param {number} id - The ID of the activity.
     * @param {string} name - The name of the activity.
     * @param {number} duration - The duration of the activity in minutes.
     */
    constructor(id, name, duration) {
        super()
        this.id = id
        this.name = name
        this.duration = duration
    }

    /**
     * Converts database row into an ActivityModel instance.
     * @param {Object} row 
     * @param {number} row.id - Activity ID.
     * @param {string} row.name - Activity name.
     * @param {number} row.duration - Duration of activity.
     * @returns {ActivityModel}
     */
    static tableToModel(row) {
        return new ActivityModel(
            row["id"],
            row["name"],
            row["duration"],
        )
    }

    /**
     * Retrieves all activities that are not deleted.
     * @returns {Promise<Array<ActivityModel>>} 
     */
    static getAll() {
        return this.query("SELECT * FROM activities WHERE deleted = 0")
            .then(result => result.map(row => this.tableToModel(row.activities)))
    }

    /**
     * Retrieves an activity by its ID.
     * @param {number} id - Activity ID.
     * @returns {Promise<ActivityModel>}
     * @throws {Promise<Error>} if no activity found, rejects with message "not found"
     */
    static getById(id) {
        return this.query("SELECT * FROM activities WHERE id = ?", [id])
            .then(result =>
                result.length > 0
                    ? this.tableToModel(result[0])
                    : Promise.reject("not found")
            )
    }

    /**
     * Updates an existing activity.
     * @param {ActivityModel} activity 
     * @returns {Promise<mysql.OkPacket>}
     */
    static update(activities) {
        return this.query(`
            UPDATE activities
            SET name = ?, duration = ?
            WHERE id = ?
        `,
            [activities.name, activities.duration, activities.id]
        )
    }

    /**
     * Creates a new activity.
     * @param {ActivityModel} activity 
     * @returns {Promise<mysql.OkPacket>} 
     */
    static create(activities) {
        return this.query(`
            INSERT INTO activities
            (name, duration)
            VALUES (?, ?)
        `,
            [activities.name, activities.duration]
        )
    }

    /**
     * Deletes an activity by its ID.
     * @param {number} id - Activity ID.
     * @returns {Promise<mysql.OkPacket>} 
     */
    static delete(id) {
        return this.query(
            `DELETE FROM activities WHERE id = ?`,
            [id]
        )
    }

    /**
     * Soft deletes an activity by setting its deleted value to 1.
     * @param {number} id - Activity ID.
     * @returns {Promise<mysql.OkPacket>}
     */
    static softDelete(id) {
        return this.query(
            `UPDATE activities  SET deleted = 1 WHERE id = ?`, 
            [id]
        )
    }
}

///testingg

// ActivityModel.getAll()
//     .then(activities => console.log(activities))
//     .catch(error => console.error(error))