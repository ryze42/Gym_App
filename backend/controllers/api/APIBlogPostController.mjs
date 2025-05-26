import express from "express";
import { BlogPostModel } from "../../models/BlogPostModel.mjs";
import { BlogPostUserModel } from "../../models/BlogPostUserModel.mjs";
import validator from "validator";
import { APIAuthenticationController } from "../api/APIAuthenticationController.mjs";

export class APIBlogPostController {
  static routes = express.Router();

  static {
    this.routes.use(APIAuthenticationController.middleware);
    this.routes.get("/", APIAuthenticationController.restrict("any"), this.getAllPosts);
    this.routes.post("/", APIAuthenticationController.restrict(["admin", "member", "trainer"]), this.createPost);
    this.routes.delete("/:id", APIAuthenticationController.restrict(["admin", "member", "trainer"]), this.deletePost);
    this.routes.patch("/:id", APIAuthenticationController.restrict(["admin", "member", "trainer"]), this.patchPost);
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
      const blogPostUserModels = await BlogPostUserModel.getAll();
      const posts = blogPostUserModels.map(entry => {
        const { id, user_id, subject, content } = entry.blog_post;
        const user = entry.user || null;

        return {
          id,
          user_id,
          subject,
          content,
          user, 
        };
      });

      res.status(200).json(posts);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch blog posts" });
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
   *             $ref: "#/components/schemas/BlogPostInput"
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
      let existing;
      try {
        existing = await BlogPostModel.getById(postId);
      } catch (error) {
        if (error === "not found") {
          return res.status(404).json({ message: "Blog post not found" });
        }
        throw error;
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
      console.error(error);
      res.status(500).json({ message: "Failed to delete blog post" });
    }
  }

  /**
   * @type {express.RequestHandler}
   * @openapi
   * /api/blog_posts/{id}:
   *   patch:
   *     summary: "Partially update a blog post"
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
   *             type: object
   *             properties:
   *               subject:
   *                 type: string
   *               content:
   *                 type: string
   *     responses:
   *       '200':
   *         description: "Blog post partially updated"
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Blog post patched"
   *       '400':
   *         $ref: "#/components/responses/Error"
   *       '403':
   *         $ref: "#/components/responses/Error"
   *       '404':
   *         $ref: "#/components/responses/NotFound"
   *       default:
   *         $ref: "#/components/responses/Error"
   */
  static async patchPost(req, res) {
    const postId = req.params.id;
    const { subject, content } = req.body;

    try {
      let existing;
      try {
        existing = await BlogPostModel.getById(postId);
      } catch (error) {
        if (error === "not found") {
          return res.status(404).json({ message: "Blog post not found" });
        }
        throw error;
      }

      if (
        req.authenticatedUser.id !== existing.user_id &&
        req.authenticatedUser.role !== "admin"
      ) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const patchData = {
        id: postId,
        user_id: undefined,
        subject: subject ? validator.escape(subject) : undefined,
        content: content ? validator.escape(content) : undefined
      };

      await BlogPostModel.patch(patchData);
      res.status(200).json({ message: "Blog post patched" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to patch blog post" });
    }
  }
}
