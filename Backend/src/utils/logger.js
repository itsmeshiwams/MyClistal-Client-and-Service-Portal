import Activity from "../models/Activity.js";

/**
 * Log user activity for compliance.
 * @param {ObjectId} userId - ID of the user performing the action
 * @param {String} action - Action description
 * @param {ObjectId} documentId - Related document ID
 */
export const logActivity = async (userId, action, documentId) => {
  try {
    await Activity.create({
      user: userId,
      action,
      document: documentId,
    });
  } catch (err) {
    console.error("Failed to log activity:", err.message);
  }
};
