import mysql from "mysql2/promise"
import { DatabaseModel } from "./DatabaseModel.mjs"

export class BlogPostModel extends DatabaseModel {
    /**
     * Creates an instance of BlogPostModel.
     * @param {number} id - ID of the blog post.
     * @param {number} user_id - The ID of the user who created the blog post.
     * @param {string} subject - Subject of the blog post.
     * @param {string} content - Content of the blog post.
     */
    constructor(id, user_id, subject, content) {
        super()
        this.id = id
        this.user_id = user_id
        this.subject = subject
        this.content = content
    }

    /**
     * Converts database row into a BlogPostModel instance.
     * @param {Object} row 
     * @param {number} row.id - ID of the blog post.
     * @param {number} row.user_id - The ID of the user who created the blog post.
     * @param {string} row.subject - Subject of the blog post.
     * @param {string} row.content - Content of the blog post.
     * @returns {BlogPostModel} New BlogPostModel instance.
     */
    static tableToModel(row) {
        return new BlogPostModel(
            row["id"],
            row["user_id"],
            row["subject"],
            row["content"]
        )
    }

    /**
     * Retrieves all blog posts from database.
     * @returns {Promise<Array<BlogPostModel>>} 
     */
    static getAll() {
        return this.query("SELECT * FROM blog_posts")
            .then(result => result.map(row => this.tableToModel(row.blog_posts)))
    }

    /**
     * Retrieves a blog post by its ID.
     * @param {number} id - ID of blog post.
     * @returns {Promise<BlogPostModel>} 
     * @throws {Promise<Error>} if no blog post found, rejects with message "not found"
     */
    static getById(id) {
        return this.query("SELECT * FROM blog_posts WHERE id = ?", [id])
            .then(result =>
                result.length > 0
                    ? this.tableToModel(result[0].blog_posts)
                    : Promise.reject("not found")
            )
    }

    /**
     * Updates an existing blog post in database.
     * @param {BlogPostModel} blog_posts 
     * @returns {Promise<mysql.OkPacket>}
     */
    static update(blog_posts) {
        return this.query(`
            UPDATE blog_posts
            SET user_id = ?, subject = ?, content = ?
            WHERE id = ?
        `,
            [blog_posts.user_id, blog_posts.subject, blog_posts.content, blog_posts.id]
        )
    }

    /**
     * Partially updates an existing blog post in database with a PATCH
     * @param {Partial<BlogPostModel>} blog_posts 
     * @returns {Promise<mysql.OkPacket>}
     */
    static patch(blog_posts) {
        return this.query(`
            UPDATE blog_posts
            SET
                user_id = COALESCE(?, user_id),
                subject = COALESCE(?, subject),
                content = COALESCE(?, content)
            WHERE id = ?
        `,
            [blog_posts.user_id, blog_posts.subject, blog_posts.content, blog_posts.id]
        );
    }


    /**
     * Create a new blog post in database
     * @param {BlogPostModel} blog_posts
     * @returns {Promise<mysql.OkPacket>}
     */
    static create(blog_posts) {
        return this.query(`
            INSERT INTO blog_posts
            (user_id, subject, content)
            VALUES (?, ?, ?)
        `,
            [blog_posts.user_id, blog_posts.subject, blog_posts.content]
        )
    }


    /**
     * Create a new blog post in database
     * @param {BlogPostModel} blog_posts
     * @returns {Promise<mysql.OkPacket>}
     */
    static createWithExistingId(blog_posts) {
        return this.query(`
            INSERT INTO blog_posts
            (id, user_id, subject, content)
            VALUES (?, ?, ?, ?)
        `,
            [blog_posts.id, blog_posts.user_id, blog_posts.subject, blog_posts.content]
        )
    }

    /**
     * Deletes a blog post from database by its ID.
     * @param {number} id 
     * @returns {Promise<mysql.OkPacket>}
     */
    static delete(id) {
        return this.query(
            `DELETE FROM blog_posts WHERE id = ?`,
            [id]
        )
    }
}


/// testing

// BlogPostModel.getAll()
//     .then(blog_posts => console.log(blog_posts))
//     .catch(error => console.error(error))