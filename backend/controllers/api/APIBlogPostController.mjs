import express from "express"
import { BlogPostModel } from "../../models/BlogPostModel.mjs";
import { BlogPostUserModel } from "../../models/BlogPostUserModel.mjs";
import validator from "validator";

export class APIBlogPostController {
    /**
     * router for blog post routes.
     * @type {express.Router}
     */
    static routes = express.Router()

    static {
        this.routes.get("/", this.viewBlogPosts);
        this.routes.get("/blog_posts", this.viewBlogPostManagement); 
        this.routes.get("/blog_posts/:id", this.viewBlogPostManagement);
        this.routes.get("/blog_posts/:id", this.handleBlogPostManagement);

        this.routes.post("/", this.handleCreateBlogPost); 
        this.routes.post("/blog_posts", this.handleBlogPostManagement);
        this.routes.post("/blog_posts/:id", this.handleBlogPostManagement);
        this.routes.post("/delete-blog-post/:id", this.deleteBlogPosts);
    }

    /**
     * Retrieves and renders all blog posts.
     * @param {express.Request} req 
     * @param {express.Response} res 
     */
    static viewBlogPosts(req, res) {
        if (!req.authenticatedUser) {
          return res.status(401).render("status.ejs", {
            status: "Unauthorised",
            message: "Please log in to view blog posts."
          });
        }
        
        BlogPostUserModel.getAll()
          .then(blog_posts => {
            res.render("blog_posts.ejs", { 
              blog_posts, 
              authenticatedUser: req.authenticatedUser, 
              user: req.authenticatedUser, 
              role: req.authenticatedUser.role  
            });
          })
          .catch(error => {
            console.error("Error fetching blog posts:", error);
            res.status(500).send("Error fetching blog posts.");
          });
    }

    /**
     * Handles the creation of a new blog post.
     * Runs through validation and sanitisation before sending form data to database. 
     * @param {express.Request} req 
     * @param {express.Response} res 
     */
    static handleCreateBlogPost(req, res) {
        const formData = req.body;
        
        if (!req.authenticatedUser) {
            return res.status(401).render("status.ejs", {
                status: "Unauthorised",
                message: "Please log in to create a blog post."
            });
        }
        
        if (!formData.subject || !/^[a-zA-Z0-9\s\.,!?;:()\-'\"]{3,100}$/.test(formData.subject)) {
            return res.status(400).render("status.ejs", {
                status: "Invalid input provided.",
                message: "Please enter a valid subject between 3 and 100 characters, containing only alphanumeric characters and common punctuation."
            });
        }
        
        if (!formData.content || formData.content.trim().length < 10) {
            return res.status(400).render("status.ejs", {
                status: "Invalid input provided.",
                message: "Please enter valid content with at least 10 characters."
            });
        }
        
        const wordCount = formData.content.trim().split(/\s+/).length;
        if (wordCount > 1000) {
            return res.status(400).render("status.ejs", {
                status: "Invalid input provided.",
                message: "Content exceeds the maximum limit of 1000 words. Please shorten your content."
            });
        }
        
        const blog_post = new BlogPostModel(
            null, 
            req.authenticatedUser.id, 
            validator.escape(formData.subject), 
            validator.escape(formData.content)
        );
        
        BlogPostModel.create(blog_post)
            .then(() => {
                res.redirect("/blog"); 
            })
            .catch((error) => {
                console.log(error);
                res.status(500).render("status.ejs", {
                    status: "Database Error",
                    message: "Failed to create the blog post."
                });
            });
    }
    
    /**
     * Renders the blog post management page.
     * Only accessible by admins. BlogPostModel.getAll fetches all blog posts that aren't deleted. 
     * @param {express.Request} req 
     * @param {express.Response} res 
     */
    static viewBlogPostManagement(req, res) {
        if (!req.authenticatedUser || req.authenticatedUser.role !== "admin") {
            return res.status(403).render("status.ejs", {
                status: "Forbidden",
                message: "Access denied :)"
            });
        }
    
        const selectedBlogPostId = req.params.id;
    
        BlogPostModel.getAll()
            .then(blog_posts => {
                const selectedBlogPost = blog_posts.find(
                    blog_post => blog_post.id == selectedBlogPostId
                ) ?? new BlogPostModel(null, "", "");
    
                res.render("crud_blog_posts.ejs", {
                    blog_posts, 
                    selectedBlogPost, 
                    role: "admin",
                    authenticatedUser: req.authenticatedUser
                });
            })
            .catch(error => {
                console.log(error);
                res.status(500).send("Error fetching blog post.");
            });
    }
    
    /**
     * Handles blog post creation, updating, or deletion.
     * Runs through validation and sanitisation before sending form data to database. 
     * @param {express.Request} req 
     * @param {express.Response} res 
     */
    static handleBlogPostManagement(req, res) {
        const selectedBlogPostId = req.params.id || req.body.id;
        const formData = req.body;
        const user_id = formData.user_id || req.authenticatedUser.id;
        const action = formData.action;

        if (!req.authenticatedUser || req.authenticatedUser.role !== "admin") {
            return res.status(403).render("status.ejs", {
                status: "Forbidden",
                message: "Access denied :)"
            });
        }

        if (action === "create" || action === "update") {
            if (!formData.subject || !/^[a-zA-Z0-9\s\.,!?;:()\-'\"]{3,100}$/.test(formData.subject)) {
                return res.status(400).render("status.ejs", {
                    status: "Invalid input provided.",
                    message: "Please enter a valid subject between 3 and 100 characters, containing only alphanumeric characters and common punctuation."
                });
            }
            
            if (!formData.content || formData.content.trim().length < 10) {
                return res.status(400).render("status.ejs", {
                    status: "Invalid input provided.",
                    message: "Please enter valid content with at least 10 characters."
                });
            }
            
            const wordCount = formData.content.trim().split(/\s+/).length;
            if (wordCount > 1000) {
                return res.status(400).render("status.ejs", {
                    status: "Invalid input provided.",
                    message: "Content exceeds the maximum limit of 1000 words. Please shorten your content."
                });
            }
        }

        const blog_post = new BlogPostModel(
            selectedBlogPostId,
            user_id,
            action === "create" || action === "update" ? validator.escape(formData.subject) : formData.subject,
            action === "create" || action === "update" ? validator.escape(formData.content) : formData.content
        );

        if (action == "create") {
            BlogPostModel.create(blog_post)
                .then(result => {
                    res.redirect("/blog/blog_posts");
                })
                .catch(error => {
                    res.render("status.ejs", {
                        status: "Database Error",
                        message: "The blog post could not be created.",
                    });
                    console.error(error);
                });
        } else if (action == "update") {
            BlogPostModel.update(blog_post)
                .then(result => {
                    if (result.affectedRows > 0) {
                        res.redirect("/blog/blog_posts");
                    } else {
                        res.render("status.ejs", {
                            status: "Blog post Update Failed",
                            message: "The blog post could not be found.",
                        });
                    }
                })
                .catch(error => {
                    res.render("status.ejs", {
                        status: "Database Error",
                        message: "The blog post could not be updated.",
                    });
                    console.error(error);
                });
        } else if (action == "delete") {
            BlogPostModel.delete(blog_post.id)
                .then(result => {
                    if (result.affectedRows > 0) {
                        res.redirect("/blog/blog_posts");
                    } else {
                        res.render("status.ejs", {
                            status: "Blog post Deletion Failed",
                            message: "The blog post could not be found.",
                        });
                    }
                })
                .catch(error => {
                    res.render("status.ejs", {
                        status: "Database Error",
                        message: "The blog post could not be deleted.",
                    });
                    console.error(error);
                });
        } else {
            res.render("status.ejs", {
                status: "Invalid Action",
                message: "The form doesn't support this action.",
            });
        }
    }
     
    /**
     * Deletes a blog post by ID.
     * Only the user who created the blog post or an admin can delete it.
     * @param {express.Request} req 
     * @param {express.Response} res 
     */
    static deleteBlogPosts(req, res) {
        if (!req.authenticatedUser) {
            return res.status(401).render("status.ejs", {
                status: "Unauthorised",
                message: "You must be logged in to delete a blog post.",
            });
        }
    
        const blogPostId = req.params.id;
    
        BlogPostModel.getById(blogPostId)
            .then(blogPost => {
                if (!blogPost) {
                    return res.status(404).render("status.ejs", {
                        status: "Not Found",
                        message: "Blog post not found.",
                    });
                }
                if (req.authenticatedUser.id !== blogPost.user_id && req.authenticatedUser.role !== "admin") {
                    return res.status(403).render("status.ejs", {
                        status: "Forbidden",
                        message: "You do not have permission to delete this blog post.",
                    });
                }
    
                return BlogPostModel.delete(blogPostId);
            })
            .then(result => {
                if (result.affectedRows > 0) {
                    res.redirect("/blog");
                } else {
                    res.render("status.ejs", {
                        status: "Deletion Failed",
                        message: "The blog post could not be deleted.",
                    });
                }
            })
            .catch(error => {
                console.error(error);
                res.render("status.ejs", {
                    status: "Database Error",
                    message: "An error occurred while deleting the blog post.",
                });
            });
    }
}
