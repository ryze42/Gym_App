import express from "express"

export class APIAuthenticationController {
    static middleware = express.Router()
    static routes = express.Router()

    static {
        this.middleware.use(this.#APIAuthenticationProvider)
        this.routes.post("/authenticate", this.handleAuthenticate)
        this.routes.delete("/authenticate", this.handleAuthenticate)
    }

    /**
     * This middleware checks for the api key header in the incoming 
     * requrest and loads the respective user into req.authenticatedUser if found.
     * @private
     * @type {express.RequestHandler}
     */
    static async #APIAuthenticationProvider(req, res, next) {
        next()
    }
    
    static async handleAuthenticate(req, res) {
        
    }
    
    static restrict(allowedRoles) {

    }
}