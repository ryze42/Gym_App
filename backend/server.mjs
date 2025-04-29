import express from "express"
import path from "path"
import { AuthenticationController } from "./controllers/AuthenticationController.mjs"
import { SessionTimetableController } from "./controllers/SessionTimetableController.mjs"
import { BlogPostController } from "./controllers/BlogPostController.mjs"
import { LocationController } from "./controllers/LocationController.mjs"
import { ActivityController } from "./controllers/ActivityController.mjs"
import { UserController } from "./controllers/UserController.mjs"
import { SessionController } from "./controllers/SessionController.mjs"
import { BookingController } from "./controllers/BookingController.mjs"
import { APIController } from "./controllers/API/APIController.mjs"
import cors from "cors"

const app = express()
const port = 8080

// Enable cross-origin resources sharing (CORS) and preflight OPTIONS requests
app.use(
    cors({
        origin: true, // Allow all origins, CHANGE TO BELOW  
        // origin: "http://localhost:8080", // Allow only backend origin 
    })
)

app.set("view engine", "ejs")
app.set("views", path.join(import.meta.dirname, "views"))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(AuthenticationController.middleware)

app.use("/authenticate", AuthenticationController.routes)
app.use("/session_timetable", SessionTimetableController.routes)
app.use("/blog", BlogPostController.routes)
app.use("/activity", ActivityController.routes)
app.use("/location", LocationController.routes)
app.use("/user", UserController.routes)
app.use("/session", SessionController.routes)
app.use("/booking", BookingController.routes)
app.use("/api", APIController.routes )

app.get("/authenticate", (req, res) => {
    res.render("authenticate", { page: "login" });
});

app.get("/", (req, res) => {
    res.status(301).redirect("/authenticate")
})

app.use(express.static(path.join(import.meta.dirname, "public")))

app.listen(port, () => {
    console.log("Backend started on http://localhost:" + port)
})