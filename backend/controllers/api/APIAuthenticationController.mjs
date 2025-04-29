import express from "express"
import { UserModel } from "../../models/UserModel.mjs"
import bcrypt from "bcryptjs"

export class APIAuthenticationController {
    static middleware = express.Router()
    static routes = express.Router()

    static {
        this.middleware.use(this.#APIAuthenticationProvider)
        this.routes.post("/authenticate", this.handleAuthenticate)
        this.routes.delete("/authenticate", this.handleAuthenticate)
    }

    /**
     * This middleware checks for the API key header in the incoming request
     * and loads the respective user into req.authenticatedUser if found.
     * 
     * @private
     * @type {express.RequestHandler}
     */
    static async #APIAuthenticationProvider(req, res, next) {
        const authenticationKey = req.headers["x-auth-key"]
        if (authenticationKey) {
            try {
                req.authenticatedUser 
                    = await EmployeeModel.getByAuthenticationKey(authenticationKey)
            } catch (error) {
                if (error == "not found") {
                    res.status(404).json({
                        message: "Failed to authenticate - key not found"
                    })
                } else {
                    console.error(error)
                    res.status(500).json({
                        message: "Failed to authenticate - database error"
                    })
                }
            }
        }
        next()
    }
    

    /**
     * 
     * @type {express.RequestHandler}
     * @openapi
     *  /api/authenticate:
     *      post:
     *          summary: "Authenticate with username and password"
     *          tags: [Authentication]
     *          requestBody:
     *              required: true
     *              content:
     *                  application/json:
     *                      schema:
     *                          $ref: "#/components/schemas/UserCredentials"
     *          responses:
     *              '200':
     *                  $ref: "#/components/responses/LoginSuccessful"
     *              '400':
     *                  $ref: "#/components/responses/Error"
     *              '500':
     *                  $ref: "#/components/responses/Error"
     *      delete:
     *          summary: "Deauthenticate with API key header"
     *          tags: [Authentication]
     *          security:
     *              - ApiKey: []
     *          responses:
     *              '200':
     *                  $ref: "#/components/responses/Updated"
     *              default:
     *                  $ref: "#/components/responses/Error"
     * 
     */
    static async handleAuthenticate(req, res) {
        if (req.method == "POST") {
            try {
                const employee = await EmployeeModel.getByEmail(req.body.email)
    
                if (await bcrypt.compare(req.body.password, user.password)) {
                    const authenticationKey = crypto.randomUUID()
                    
                    user.authenticationKey = authenticationKey
                    await UserModel.update(user)
                    
                    res.status(200).json({
                        key: authenticationKey
                    })
                } else {
                    res.status(400).json({
                        message: "Invalid credentials"
                    })
                }
            } catch (error) {
                switch (error) {
                    case "not found":
                        res.status(400).json({
                            message: "Invalid credentials"
                        })
                        break;
                    default:
                        console.error(error)
                        res.status(500).json({
                            message: "Failed to authenticate user"
                        })
                        break;
                }
            }
        } else if (req.method == "DELETE") {
            if (req.authenticatedUser) {
                const user = await UserModel
                    .getByAuthenticationKey(req.authenticatedUser.authenticationKey)
                user.authenticationKey = null
                await UserModel.update(user)
                
                res.status(200).json({
                    message: "Deauthentication successful"
                })                
            } else {
                res.status(401).json({
                    message: "Please login to access the requested resources"
                })
            }
        }
    }
    
    /**
     * Allows us to define restricted routes
     * 
     * @param {Array<"admin" | "trainer" | "member"> | "any"} allowedRoles 
     * @returns {express.RequestHandler}
     */
    static restrict(allowedRoles) {
        return function (req, res, next) {
            if (req.authenticatedUser) {
                if (allowedRoles == "any" || allowedRoles.includes(req.authenticatedUser.role)) {
                    next()
                } else {
                    res.status(403).json({
                        message: "Access forbidden",
                        errors: ["Role does not have access to the requested resource"]
                    })
                }
            } else {
                res.status(401).json({
                    message: "Not authenticated",
                    errors: ["Please authenticate to access the requested resource"]
                })
            }
        }
    }
}




// try {
            //     const user = req.authenticatedUser
            //     if (!user) {
            //         res.status(400).json({
            //             message: "No user authenticated"
            //         })
            //         return
            //     }
    
            //     user.authenticationKey = null
            //     await UserModel.update(user)
    
            //     res.status(200).json({
            //         message: "User deauthenticated"
            //     })
            // } catch (error) {
            //     console.error(error)
            //     res.status(500).json({
            //         message: "Failed to deauthenticate user"
            //     })
            // }