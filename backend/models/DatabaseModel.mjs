import mysql from "mysql2/promise"

export class DatabaseModel {
    static connection

    static {
        this.connection = mysql.createPool({
            host: "localhost",
            user: "hsg-admin", // changed to hsg-admin from 'root'
            password: "password123",
            database: "high_street_gym",
            nestTables: true,
            multipleStatements: true,
            timezone: "-10:00"// compensate to take ten hours off to match local time, fix later, find source of why its changing from the db to the initial fetch 
        })
    }

    /**
     * Executes a SQL query against the database. 
     * @param {string} sql 
     * @param {Array} values 
     * @returns {Promise<Object>}
     */
    static query(sql, values) {
        return this.connection.query(sql, values) 
            .then(([result]) => result)
    }

    /**
     * Converts a JavaScript Date object into a MySQL-formatted date string (YYYY-MM-DD). 
     * @param {Date} date
     * @returns {string} date in MySQL format (YYYY-MM-DD).
     */
    static toMySqlDate(date) {
        const year = date.toLocaleString("default", {year: "numeric"})
        const month = date.toLocaleString("default", {month: "2-digit"})
        const day = date.toLocaleString("default", {day: "2-digit"})

        return [year, month, day].join("-")
    }
}