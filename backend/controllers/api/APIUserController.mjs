import express from "express"
import { UserModel } from "../../models/UserModel.mjs"
import { APIAuthenticationController } from "../api/APIAuthenticationController.mjs"

export class APIUserController {
    static routes = express.Router()
    
    static {
        this.routes.get(
            "/self", 
            APIAuthenticationController.restrict("any"), 
            this.getAuthenticatedUser
        )
        
    }
    
    /**
     * Handle getting an employee by their current authentication key header
     * 
     * @type {express.RequestHandler}
     * @openapi
     * /api/user/self:
     *      get:
     *          summary: "Get user by current authentication key header"
     *          tags: [Users]
     *          security:
     *              - ApiKey: [] 
     *          responses:
     *              '200':
     *                  description: 'User with provide authentication key'
     *                  content:
     *                      application/json:
     *                          schema:
     *                              $ref: "#/components/schemas/User"
     *              default:
     *                  $ref: "#/components/responses/Error"
     */
    static async getAuthenticatedUser(req, res) {
        res.status(200).json(req.authenticatedUser)
    }
}