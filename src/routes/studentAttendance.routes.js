import { Router } from "express";
import {
  FETCH_ATTENDANCE_CLASS,
  FETCH_ATTENDANCE_HISTORY_STUDENT,
  MARK_ATTENDANCE,
  UPDATE_ATTENDANCE,
} from "../controllers/studentAttendance.controller.js";

const studentAttendanceRouter = Router();

// Mark attendance for a class
studentAttendanceRouter.post("/classes/:classId/attendance", MARK_ATTENDANCE);
// Fetch attendance for a class on a specific date
studentAttendanceRouter.get(
  "/classes/:classId/attendance/:date",
  FETCH_ATTENDANCE_CLASS
);
// Update attendance for a class on a specific date
studentAttendanceRouter.put(
  "/classes/:classId/attendance/:date",
  UPDATE_ATTENDANCE
);
// Fetch attendance history for a student
studentAttendanceRouter.get(
  "/students/:studentId/attendance-history",
  FETCH_ATTENDANCE_HISTORY_STUDENT
);

export default studentAttendanceRouter;
