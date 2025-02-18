import mongoose from "mongoose";

export const DB_NAME = "school";

export const isValidMongoId = (id) => {
  return (
    mongoose.Types.ObjectId.isValid(id) &&
    new mongoose.Types.ObjectId(id).toString() === id
  );
};

export const areValidMongoIds = (ids) => {
  if (!Array.isArray(ids)) return false;
  return ids.every((id) => isValidMongoId(id));
};
