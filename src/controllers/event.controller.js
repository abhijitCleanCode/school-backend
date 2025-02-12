import { Event } from "../models/event.model.js";

export const CREATE_EVENT = async (req, res) => {
  try {
    const { title, description, date, location, audience } = req.body;
    const userId = req.user.id; // ID of the teacher/principal

    const newEvent = new Event({
      title,
      description,
      date,
      location,
      createdBy: userId,
      audience,
    });

    await newEvent.save();
    res.status(201).json({ message: "Event created successfully", newEvent });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ message: "Server error" });
  }
};
