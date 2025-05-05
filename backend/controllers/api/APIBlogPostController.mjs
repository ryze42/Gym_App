import express from "express";
import { BlogPostModel } from "../../models/BlogPostModel.mjs";
import validator from "validator";
import { APIAuthenticationController } from "../api/APIAuthenticationController.mjs";

export class APIBlogPostController {
  static routes = express.Router();

  static {
    this.routes.use(APIAuthenticationController.middleware);
    this.routes.get("/", APIAuthenticationController.restrict("any"), this.getAllPosts);
    this.routes.get("/:id", APIAuthenticationController.restrict("any"), this.getPostById);
    this.routes.post("/", APIAuthenticationController.restrict(["admin", "member", "trainer"]), this.createPost);
    this.routes.put("/:id", APIAuthenticationController.restrict(["admin", "member", "trainer"]), this.updatePost);
    this.routes.delete("/:id", APIAuthenticationController.restrict(["admin", "member", "trainer"]), this.deletePost);
  }

  /**
   * @type {express.RequestHandler}
   * @openapi
   * /api/blog_posts:
   *   get:
   *     summary: "Get all blog posts"
   *     tags: [BlogPosts]
   *     security:
   *       - ApiKey: []
   *     responses:
   *       '200':
   *         description: "List of blog posts"
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: "#/components/schemas/BlogPost"
   *       default:
   *         $ref: "#/components/responses/Error"
   */
  static async getAllPosts(req, res) {
    try {
      const posts = await BlogPostModel.getAll();
      res.status(200).json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  }

  /**
   * @type {express.RequestHandler}
   * @openapi
   * /api/blog_posts/{id}:
   *   get:
   *     summary: "Get a single blog post by ID"
   *     tags: [BlogPosts]
   *     security:
   *       - ApiKey: []
   *     parameters:
   *       - $ref: "#/components/parameters/BlogPostId"
   *     responses:
   *       '200':
   *         description: "Blog post found"
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/BlogPost"
   *       '404':
   *         $ref: "#/components/responses/NotFound"
   *       default:
   *         $ref: "#/components/responses/Error"
   */
  static async getPostById(req, res) {
    try {
      const post = await BlogPostModel.getById(req.params.id);
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      res.status(200).json(post);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blog post" });
    }
  }

  /**
   * @type {express.RequestHandler}
   * @openapi
   * /api/blog_posts:
   *   post:
   *     summary: "Create a new blog post"
   *     tags: [BlogPosts]
   *     security:
   *       - ApiKey: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: "#/components/schemas/BlogPost"
   *     responses:
   *       '201':
   *         $ref: "#/components/responses/Created"
   *       '400':
   *         $ref: "#/components/responses/Error"
   *       default:
   *         $ref: "#/components/responses/Error"
   */
  static async createPost(req, res) {
    const { subject, content } = req.body;

    // Validation
    if (!subject || !/^[\w\s\.,!?;:()\-'"]{3,100}$/.test(subject)) {
      return res.status(400).json({ message: "Invalid subject" });
    }
    if (!content || content.trim().length < 10) {
      return res.status(400).json({ message: "Invalid content" });
    }
    if (content.trim().split(/\s+/).length > 1000) {
      return res.status(400).json({ message: "Content exceeds maximum word count" });
    }

    try {
      const newPost = {
        user_id: req.authenticatedUser.id,
        subject: validator.escape(subject),
        content: validator.escape(content)
      };
      const result = await BlogPostModel.create(newPost);
      res.status(201).json({ id: result.insertId, message: "Item created" });
    } catch (error) {
      res.status(500).json({ message: "Failed to create blog post" });
    }
  }

  /**
   * @type {express.RequestHandler}
   * @openapi
   * /api/blog_posts/{id}:
   *   put:
   *     summary: "Update an existing blog post"
   *     tags: [BlogPosts]
   *     security:
   *       - ApiKey: []
   *     parameters:
   *       - $ref: "#/components/parameters/BlogPostId"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: "#/components/schemas/BlogPost"
   *     responses:
   *       '200':
   *         $ref: "#/components/responses/Updated"
   *       '400':
   *         $ref: "#/components/responses/Error"
   *       '404':
   *         $ref: "#/components/responses/NotFound"
   *       default:
   *         $ref: "#/components/responses/Error"
   */
  static async updatePost(req, res) {
    const postId = req.params.id;
    const { subject, content } = req.body;

    // Validation (same rules as create)
    if (!subject || !/^[\w\s\.,!?;:()\-'"]{3,100}$/.test(subject)) {
      return res.status(400).json({ message: "Invalid subject" });
    }
    if (!content || content.trim().length < 10) {
      return res.status(400).json({ message: "Invalid content" });
    }
    if (content.trim().split(/\s+/).length > 1000) {
      return res.status(400).json({ message: "Content exceeds maximum word count" });
    }

    try {
      const existing = await BlogPostModel.getById(postId);
      if (!existing) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      if (
        req.authenticatedUser.id !== existing.user_id &&
        req.authenticatedUser.role !== "admin"
      ) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const updated = {
        id: postId,
        user_id: existing.user_id,
        subject: validator.escape(subject),
        content: validator.escape(content)
      };
      await BlogPostModel.update(updated);
      res.status(200).json({ message: "Item updated" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update blog post" });
    }
  }

  /**
   * @type {express.RequestHandler}
   * @openapi
   * /api/blog_posts/{id}:
   *   delete:
   *     summary: "Delete a blog post by ID"
   *     tags: [BlogPosts]
   *     security:
   *       - ApiKey: []
   *     parameters:
   *       - $ref: "#/components/parameters/BlogPostId"
   *     responses:
   *       '200':
   *         description: "Blog post deletion successful"
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Blog post deleted"
   *       '403':
   *         $ref: "#/components/responses/Error"
   *       '404':
   *         $ref: "#/components/responses/NotFound"
   *       default:
   *         $ref: "#/components/responses/Error"
   */
  static async deletePost(req, res) {
    const postId = req.params.id;
    try {
      const existing = await BlogPostModel.getById(postId);
      if (!existing) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      if (
        req.authenticatedUser.id !== existing.user_id &&
        req.authenticatedUser.role !== "admin"
      ) {
        return res.status(403).json({ message: "Forbidden" });
      }

      await BlogPostModel.delete(postId);
      res.status(200).json({ message: "Blog post deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete blog post" });
    }
  }
}
