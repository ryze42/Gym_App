import express from "express"
import swaggerJSDoc from "swagger-jsdoc"
import swaggerUI from "swagger-ui-express"
import * as ApiValidator from "express-openapi-validator"
import { APIAuthenticationController } from "../api/APIAuthenticationController.mjs"
import { APIUserController } from "../api/APIUserController.mjs"
import { APIBlogPostController } from "../api/APIBlogPostController.mjs"
import { APIBookingController } from "../api/APIBookingController.mjs"
import { APISessionTimetableController } from "../api/APISessionTimetableController.mjs"

const options = {
    failOnErrors: true, 
    definition: {
        openapi: "3.0.0",
        info: {
            version: "1.0.0",
            title: "HSG API",
            description: "JSON REST API for hsg backend",
        },
        components: {
            securitySchemes: {
                ApiKey: {
                    type: "apiKey",
                    in: "header",
                    name: "x-auth-key",
                },
            }
        },
    },
    apis: ["./controllers/**/*.{js,mjs,yaml}", "./components.yaml"],
}

const specification = swaggerJSDoc(options)

export class APIController {
    static routes = express.Router()

    static {
        /**
         * @openapi
         * /api/docs:
         *      get:
         *          summary: "View automatically generated API documentation"
         *          tags: [Documentation]
         *          responses:
         *            '200':
         *              description: 'Swagger documentation page'
         */
        this.routes.use("/docs", swaggerUI.serve, swaggerUI.setup(specification))

        this.routes.use(ApiValidator.middleware({
            apiSpec: specification,
            validateRequests: true,
            validateResponses: true,
        }))

        this.routes.use((err, req, res, next) => {
            res.status(err.status || 500).json({
                status: err.status,
                message: err.message,
                errors: err.errors,
            })
        })
        
        // API authentication middleware and routes
        this.routes.use(APIAuthenticationController.middleware)
        this.routes.use(APIAuthenticationController.routes)
        this.routes.use("/self", APIUserController.routes)
        this.routes.use("/blog_posts", APIBlogPostController.routes)
        this.routes.use("/bookings", APIBookingController.routes)
        this.routes.use("/timetable", APISessionTimetableController.routes)
        this.routes.use("/user", APIUserController.routes)
    }
}