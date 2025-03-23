import mongoose from "mongoose";
import { Announcement } from "../models/announcement.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const MAKE_ANNOUNCEMENT = async (req, res) => {
  const { title, content, audience } = req.body;
  const userId = req.user.id;
  const role = req.user.role;

  const session = await mongoose.startSession();
  session.startTransaction();

  let newAnnouncement;
  let createdAnnouncement;

  try {
    switch (role) {
      case "principal":
        newAnnouncement = await Announcement.create(
          [
            {
              title,
              content,
              createdByPrincipal: userId,
              audience,
            },
          ],
          { session }
        );

        createdAnnouncement = await Announcement.findById(
          newAnnouncement[0]._id
        )
          .populate({
            path: "createdByPrincipal",
            select: "name role",
          })
          .session(session);
        break;
      case "teacher":
        newAnnouncement = await Announcement.create(
          [
            {
              title,
              content,
              createdByTeacher: userId,
              audience,
            },
          ],
          { session }
        );
        createdAnnouncement = await Announcement.findById(
          newAnnouncement[0]._id
        ).populate({
          path: "createdByTeacher",
          select: "name role classTeacher",
          populate: {
            path: "classTeacher",
            select: "className section",
          },
        });
        break;
    }

    if (!createdAnnouncement)
      throw new ApiError(500, "Uh oh! Announcement is not created");

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    return res
      .status(201)
      .json(
        new ApiResponse(
          200,
          createdAnnouncement,
          "Announcement Created Successfully"
        )
      );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const GET_ALL_ANNOUNCEMENT = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  try {
    const announcements = await Announcement.find()
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
      .skip(skip)
      .limit(limit);

    const totalAnnouncement = await Announcement.countDocuments();
    const totalPages = Math.ceil(totalAnnouncement / limit);

    return res.status(201).json(
      new ApiResponse(200, {
        announcements,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: totalAnnouncement,
        },
      })
    );
  } catch (error) {
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const GET_ANNOUNCEMENT_BY_ID = async (req, res) => {
  const { announcementId } = req.params;
  try {
    const announcement = Announcement.findById(announcementId)
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

    if (!announcement) throw new ApiError(400, "Announcement does not exits");

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { announcement },
          "Announcement fetched successfully"
        )
      );
  } catch (error) {
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const DELETE_ANNOUNCEMENT = async (req, res) => {
  const { announcementIds } = req.body;
  const userId = req.user.id;
  const role = req.user.role;

  try {
    if (
      !announcementIds ||
      !Array.isArray(announcementIds) ||
      announcementIds.length === 0
    ) {
      throw new ApiError(400, "Invalid request. Provide a list of event api");
    }

    const announcements = await Announcement.find({
      _id: { $in: announcementIds },
    });
    if (announcementIds.length !== announcements.length) {
      throw new ApiError(404, "One or more announcements not found");
    }

    for (const announcement of announcements) {
      if (
        role !== "principal" &&
        announcement.createdByTeacher?.toString() !== userId &&
        announcement.createdByPrincipal?.toString() !== userId
      ) {
        throw new ApiError(403, "You are not authorized to delete this event");
      }
    }

    // delete multiple announcement
    const deleteResult = await Announcement.deleteMany({
      _id: { $in: announcementIds },
    }).exec();
    if (deleteResult.deletedCount === 0) {
      throw new ApiError(404, "No announcement found to delete.");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { deletedCount: deleteResult.deletedCount },
          `${deleteResult.deletedCount} announcements deleted successfully.`
        )
      );
  } catch (error) {
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};
