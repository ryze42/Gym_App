import { DatabaseModel } from "./DatabaseModel.mjs";
import { BlogPostModel } from "./BlogPostModel.mjs";
import { UserModel } from "./UserModel.mjs";

export class BlogPostUserModel extends DatabaseModel {
    /**
     * Creates an instance of BlogPostUserModel.
     * @param {BlogPostModel} blog_post - The blog post data.
     * @param {UserModel} user - The user data.
     */
    constructor(blog_post, user) {
        super();
        this.blog_post = blog_post;
        this.user = user;
    }

    /**
     * Maps a row from the joined query into a BlogPostUserModel instance.
     * @param {Object} row - The database row.
     * @param {Object} row.blog_posts - The blog post data from the row.
     * @param {number} row.blog_posts.blog_post_id - The blog post ID.
     * @param {number} row.blog_posts.blog_post_user_id - The ID of the user who created the post.
     * @param {string} row.blog_posts.blog_post_subject - The subject of the blog post.
     * @param {string} row.blog_posts.blog_post_content - The content of the blog post.
     * @param {Object} row.users - The user data from the row.
     * @param {number} row.users.user_id - The user ID.
     * @param {string} [row.users.first_name="N/A"] - The first name of the user.
     * @param {string} [row.users.last_name="N/A"] - The last name of the user.
     * @returns {BlogPostUserModel} The mapped BlogPostUserModel instance.
     */
    static rowToModel(row) {
        return new BlogPostUserModel(
            new BlogPostModel(
                row.blog_posts.blog_post_id, 
                row.blog_posts.blog_post_user_id, 
                row.blog_posts.blog_post_subject, 
                row.blog_posts.blog_post_content
            ),
            new UserModel(
                row.users.user_id,
                row.users.first_name || "N/A", 
                row.users.last_name || "N/A",
                "", "", "" 
            )
        );
    }

    /**
    * Retrieves all blog posts joined with user data.
    * For public blog post page so it display users first and last name. 
    * @returns {Promise<BlogPostUserModel[]>} A promise that resolves to an array of BlogPostUserModel instances.
    */
    static getAll() {
        return this.query(`
        SELECT 
            blog_posts.id AS blog_post_id,
            blog_posts.user_id AS blog_post_user_id,
            blog_posts.subject AS blog_post_subject,
            blog_posts.content AS blog_post_content,
            users.id AS user_id,
            users.first_name,
            users.last_name
        FROM blog_posts
        INNER JOIN users ON blog_posts.user_id = users.id
        ORDER BY blog_posts.id DESC
        `).then(results => {
            return results.map(row => BlogPostUserModel.rowToModel(row));
        }).catch(error => {
            console.error("Error fetching blog posts:", error);
        });
    }
}
