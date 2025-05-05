import mysql from "mysql2/promise"
import { DatabaseModel } from "./DatabaseModel.mjs";

export class UserModel extends DatabaseModel {
    /**
     * Creates instance of the UserModel.
     * @param {number} id - The ID of the user.
     * @param {string} first_name - The first name of the user.
     * @param {string} last_name - The last name of the user.
     * @param {string} role - The role of the user ("admin", "member", "trainer").
     * @param {string} email - The email address of the user.
     * @param {string} password - The password of the user (hashed with bcryptjs).
     * @param {string} authentication_key - The authentication api key
     */
    constructor(id, first_name, last_name, role, email, password, authentication_key = null) {
        super()
        this.id = id
        this.first_name = first_name
        this.last_name = last_name
        this.role = role
        this.email = email
        this.password = password
        this.authentication_key
    }

    /**
     * Converts a row from the database into a UserModel instance.
     * @param {Object} row 
     * @param {number} row.id - ID of user
     * @param {number} row.first_name - first name of user
     * @param {string} row.last_name - last name of user
     * @param {string} row.role - role of user ("admin", "trainer", "member")
     * @param {string} row.email - email address of the user
     * @param {string} row.password - password of the user (hashed with bcryptjs)
     * @param {string} authentication_key - the authentication api key
     * @returns {UserModel} new instance of the UserModel class.
     */
    static tableToModel(row) {
        return new UserModel(
            row["id"],
            row["first_name"],
            row["last_name"],
            row["role"],
            row["email"],
            row["password"],  
            row["authentication_key"]  
        )
    }

    /**
     * Retrieves all users from the database that are not deleted. 
     * @returns {Promise<Array<UserModel>>}
     */
    static getAll() {
        return this.query("SELECT * FROM users WHERE deleted = 0")
            .then(result => result.map(row => this.tableToModel(row.users)))
    }

    /**
     * Retrieves user by their ID.
     * @param {number} id - ID of the user.
     * @returns {Promise<UserModel>}
     * @throws {Promise<Error>} if no user is found, rejects with message "not found".
     */
    static getById(id) {
        return this.query("SELECT * FROM users WHERE id = ?", [id])
            .then(result =>
                result.length > 0
                    ? this.tableToModel(result[0].users)
                    : Promise.reject("not found")
            )
    }

    /**
     * Retrieves a user by their email. 
     * @param {number} id - ID of the user
     * @returns {Promise<UserModel>}
     * @throws {Promise<Error>} if no user is found, rejects with message "not found".
     */
    static getByEmail(email) {
        return this.query("SELECT * FROM users WHERE email = ? AND deleted = 0", [email])
            .then(result =>
                result.length > 0
                    ? this.tableToModel(result[0].users)
                    : Promise.reject("not found")
            )
    }

    /**
     * 
     * @param {string} authenticationKey 
     * @returns {Promise<EmployeeModel>}
     */
    static getByAuthenticationKey(authenticationKey) {
        return this.query("SELECT * FROM users WHERE authentication_key = ? AND deleted = 0", [authenticationKey])
            .then(result =>
                result.length > 0
                    ? this.tableToModel(result[0].users)
                    : Promise.reject("not found")
            )
    }

    /**
     * Updates an existing user in database.
     * @param {UserModel} users
     * @returns {Promise<mysql.OkPacket>}
     */
    static update(user) {
        return this.query(`
            UPDATE users
            SET 
                first_name = ?, 
                last_name = ?, 
                role = ?, 
                email = ?, 
                password = CASE 
                    WHEN ? IS NOT NULL THEN ? 
                    ELSE password 
                END,
                authentication_key = ?
            WHERE id = ?
        `,
        [user.first_name, user.last_name, user.role, user.email, user.password, user.password, user.authentication_key, user.id]);
    }
                                                                                            // user.authenticationKey???
    /**
     * Creates a new user in the database
     * @param {UserModel} users
     * @returns {Promise<mysql.OkPacket>}
     */
    static create(users) {
        return this.query(`
            INSERT INTO users
            (first_name, last_name, role, email, password, authentication_key)
            VALUES (?, ?, ?, ?, ?, ?)
        `,
            [users.first_name, users.last_name, users.role, users.email, users.password, users.authentication_key]
        )
    }

    /**
     * Deletes a user by their ID. 
     * @param {number} id 
     * @returns {Promise<mysql.OkPacket>}
     */
    static delete(id) {
        return this.query(
            `DELETE FROM users WHERE id = ?`,
            [id]
        )
    }

    /**
     * Soft deletes a user by their ID by setting deleted value to 1. 
     * @param {number} id 
     * @returns {Promise<mysql.OkPacket>}
     */
    static softDelete(id) {
        return this.query(
            `UPDATE users SET deleted = 1 WHERE id = ?`, 
            [id]
        )
    }
}


///testing

// UserModel.getAll()
//     .then(users => console.log(users))
//     .catch(error => console.error(error))

// UserModel.getByEmail('ethan42') 
//     .then(user => {
//         if (user) {
//             console.log(user.email); 
//         } else {
//             console.log('User not found');
//         }
//     })
//     .catch(error => console.error('Error:', error));

// UserModel.getById(1)
//     .then(user => {
//         if (user) {
//             console.log(`User found: ${user.email}`);
//         } else {
//             console.log("User not found.");
//         }
//     })
//     .catch(error => {
//         console.error("Error fetching user by ID:", error);
//     });