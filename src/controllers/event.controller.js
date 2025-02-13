import { Event } from "../models/events.model.js";

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

// limit = 10, per page
export const GET_ALL_EVENTS = async (req, res) => {
  const page = parseInt(req.query.page) || 1; // Get the page number from query params (default to 1)
  const limit = 10; // Number of events per page
  const skip = (page - 1) * limit; // Calculate the number of documents to skip

  try {
    // Fetch events with pagination and populate the createdBy field
    const events = await Event.find()
      .populate("createdBy", "name email") // Populate the teacher/principal who created the event
      .sort({ date: 1 }) // Sort events by date (ascending order)
      .skip(skip) // Skip documents for pagination
      .limit(limit); // Limit the number of documents

    // Get the total number of events for pagination metadata
    const totalEvents = await Event.countDocuments();
    const totalPages = Math.ceil(totalEvents / limit);

    // Respond with events and pagination metadata
    res.status(200).json({
      message: "Events retrieved successfully",
      events,
      pagination: {
        currentPage: page,
        totalPages,
        totalEvents,
        eventsPerPage: limit,
      },
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const GET_EVENT_BY_ID = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Fetch event by ID from the database
    const event = await Event.findById(eventId).populate(
      "createdBy",
      "name email"
    );

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.status(200).json(event);
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const DELETE_EVENTS = async (req, res) => {
  try {
    const { eventIds } = req.body; // Expecting an array of event IDs

    if (!eventIds || !Array.isArray(eventIds) || eventIds.length === 0) {
      return res
        .status(400)
        .json({ message: "Invalid request. Provide a list of event IDs." });
    }

    // Delete multiple events
    const deleteResult = await Event.deleteMany({ _id: { $in: eventIds } });

    if (deleteResult.deletedCount === 0) {
      return res.status(404).json({ message: "No events found to delete." });
    }

    res.status(200).json({
      message: `${deleteResult.deletedCount} event(s) deleted successfully.`,
      deletedCount: deleteResult.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting events:", error);
    res.status(500).json({ message: "Server error" });
  }
};
