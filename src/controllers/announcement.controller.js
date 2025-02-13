import { Announcement } from "../models/announcement.model.js";

export const MAKE_ANNOUNCEMENT = async (req, res) => {
  try {
    const { title, content, audience } = req.body;
    const userId = req.user.id; // ID of the teacher/principal

    const newAnnouncement = new Announcement({
      title,
      content,
      createdBy: userId,
      audience,
    });

    await newAnnouncement.save();
    res
      .status(201)
      .json({ message: "Announcement created successfully", newAnnouncement });
  } catch (error) {
    console.error("Error creating announcement:", error);
    res.status(500).json({ message: "Server error" });
  }
};
