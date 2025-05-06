import express from "express";
import validator from "validator";
import { UserModel } from "../../models/UserModel.mjs";
import { APIAuthenticationController } from "../api/APIAuthenticationController.mjs";

export class APIUserController {
  static routes = express.Router();

  static {
    this.routes.use(APIAuthenticationController.middleware);
    this.routes.get("/self", APIAuthenticationController.restrict("any"), this.getAuthenticatedUser);
    this.routes.put("/self", APIAuthenticationController.restrict("any"), this.updateAuthenticatedUser);
  }

  /**
   * @type {express.RequestHandler}
   * @openapi
   * /api/user/self:
   *   get:
   *     summary: "Get current authenticated user"
   *     tags: [Users]
   *     security:
   *       - ApiKey: []
   *     responses:
   *       '200':
   *         description: "Authenticated user details"
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/User"
   *       default:
   *         $ref: "#/components/responses/Error"
   */
  static async getAuthenticatedUser(req, res) {
    res.status(200).json(req.authenticatedUser);
  }

  /**
   * @type {express.RequestHandler}
   * @openapi
   * /api/user/self:
   *   put:
   *     summary: "Update current authenticated user profile"
   *     tags: [Users]
   *     security:
   *       - ApiKey: []
   *     requestBody:
   *       $ref: "#/components/requestBodies/User"
   *     responses:
   *       '200':
   *         $ref: "#/components/responses/Updated"
   *       '400':
   *         $ref: "#/components/responses/Error"
   *       '500':
   *         $ref: "#/components/responses/Error"
   */
  static async updateAuthenticatedUser(req, res) {
    const user = req.authenticatedUser;
    const { first_name, last_name, email, password } = req.body;

    if (!first_name || !last_name || !email) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    if (!validator.isLength(first_name, { min: 1, max: 50 }) || !validator.isAlpha(first_name, 'en-US', { ignore: " -'" })) {
      return res.status(400).json({ message: "Invalid first name" });
    }
    if (!validator.isLength(last_name, { min: 1, max: 50 }) || !validator.isAlpha(last_name, 'en-US', { ignore: " -'" })) {
      return res.status(400).json({ message: "Invalid last name" });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Invalid email address" });
    }

    user.first_name = validator.escape(first_name.trim());
    user.last_name = validator.escape(last_name.trim());
    user.email = validator.normalizeEmail(email);

    if (password) {
      if (!validator.isLength(password, { min: 8 })) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }
      user.password = await UserModel.hashPassword(password);
    }

    try {
      await UserModel.update(user);
      res.status(200).json({ message: "Item updated" });
    } catch (err) {
      res.status(500).json({ message: "Failed to update user profile" });
    }
  }
}
