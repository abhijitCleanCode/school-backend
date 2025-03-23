import mongoose from "mongoose";
import { Event } from "../models/events.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const CREATE_EVENT = async (req, res) => {
  const { title, content, eventDate, venue, audience } = req.body;
  const userId = req.user.id;
  const role = req.user.role;

  const session = await mongoose.startSession();
  session.startTransaction();

  let newEvent;
  let createdEvent;

  try {
    switch (role) {
      case "principal":
        newEvent = await Event.create(
          [
            {
              title,
              content,
              eventDate,
              venue,
              createdByPrincipal: userId,
              audience,
            },
          ],
          { session }
        );
        createdEvent = await Event.findById(newEvent[0]._id)
          .populate({
            path: "createdByPrincipal",
            select: "name role",
          })
          .session(session);
        break;
      case "teacher":
        newEvent = await Event.create(
          [
            {
              title,
              content,
              eventDate,
              venue,
              createdByTeacher: userId,
              audience,
            },
          ],
          { session }
        );
        createdEvent = await Event.findById(newEvent[0]._id).populate({
          path: "createdByTeacher",
          select: "name role classTeacher",
          populate: {
            path: "classTeacher",
            select: "className section",
          },
        });
    }

    if (!createdEvent) throw new ApiError(400, "Event Creation failed");

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    return res
      .status(201)
      .json(new ApiResponse(200, createdEvent, "Event created successfully"));
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

// limit = 10, per page
export const GET_ALL_EVENTS = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  try {
    const events = await Event.find()
      .populate({
        path: "createdByTeacher",
        select: "name role classTeacher",
        populate: {
          path: "classTeacher",
          select: "className section",
        },
      })
      .populate({
        path: "createdByPrincipal",
        select: "name role",
      })
      .sort({ date: 1 }) // Sort events by date (ascending order)
      .skip(skip)
      .limit(limit);

    const totalEvents = await Event.countDocuments();
    const totalPages = Math.ceil(totalEvents / limit);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          events,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems: totalEvents,
          },
        },
        "Events retrieved successfully"
      )
    );
  } catch (error) {
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const GET_EVENT_BY_ID = async (req, res) => {
  const { eventId } = req.params;

  try {
    const event = await Event.findById(eventId)
      .populate({
        path: "createdByTeacher",
        select: "name role classTeacher",
        populate: {
          path: "classTeacher",
          select: "className section",
        },
      })
      .populate({
        path: "createdByPrincipal",
        select: "name role",
      });

    if (!event) {
      throw new ApiError(400, "Event does not exists");
    }

    res
      .status(200)
      .json(new ApiResponse(200, { event }, "Event fetched successfully"));
  } catch (error) {
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const DELETE_EVENTS = async (req, res) => {
  const { eventIds } = req.body; // array of event IDs to be deleted
  const userId = req.user.id;
  const role = req.user.role;

  try {
    if (!eventIds || !Array.isArray(eventIds) || eventIds.length === 0) {
      throw new ApiError(400, "Invalid request. Provide a list of event IDs.");
    }

    const events = await Event.find({ _id: { $in: eventIds } });
    if (events.length !== eventIds.length) {
      throw new ApiError(404, "One or more events not found");
    }

    for (const event of events) {
      if (
        role !== "principal" &&
        event.createdByTeacher?.toString() !== userId &&
        event.createdByPrincipal?.toString() !== userId
      ) {
        throw new ApiError(403, "You are not authorized to delete this event");
      }
    }

    // delete multiple events
    const deleteResult = await Event.deleteMany({
      _id: { $in: eventIds },
    }).exec();
    if (deleteResult.deletedCount === 0) {
      throw new ApiError(404, "No events found to delete.");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { deletedCount: deleteResult.deletedCount },
          `${deleteResult.deletedCount} events deleted successfully.`
        )
      );
  } catch (error) {
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};
