import express, { urlencoded } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

// import routes
import studentRouter from "./routes/student.routes.js";
import classRouter from "./routes/class.routes.js";
import teacherRouter from "./routes/teacher.routes.js";
import subjectRouter from "./routes/subject.routes.js";
import eventRouter from "./routes/event.routes.js";
import announcementRouter from "./routes/announcement.routes.js";
import markRouter from "./routes/mark.routes.js";
import principalRouter from "./routes/principal.routes.js";

// Build express app
const app = express();

app.use(
  cors({
    //! cautions change when deploy
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// routes
app.use("/api/v1/principal", principalRouter);

app.use("/api/v1/student", studentRouter);
app.use("/api/v1/class", classRouter);
app.use("/api/v1/teacher", teacherRouter);
app.use("/api/v1/subject", subjectRouter);
app.use("/api/v1/event", eventRouter);
app.use("api/v1/announcement", announcementRouter);
app.use("/api/v1/mark", markRouter);

export { app };
