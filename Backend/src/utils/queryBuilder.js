// src/utils/queryBuilder.js
import mongoose from "mongoose";

/**
 * Builds an aggregation pipeline for searching, filtering, and sorting documents.
 * Supports multi-select filters (status, type) and cross-field search (name + client email).
 */
export const buildDocumentAggregation = (queryParams = {}) => {
  const {
    search,
    type,
    status,
    sortDate,
    startDate,
    endDate,
  } = queryParams;

  const pipeline = [];

  // 🔗 Join client user collection to get client email
  pipeline.push({
    $lookup: {
      from: "users",
      localField: "client",
      foreignField: "_id",
      as: "clientData",
    },
  });

  pipeline.push({
    $unwind: { path: "$clientData", preserveNullAndEmptyArrays: true },
  });

  // 🔍 SEARCH: file name or client email (case-insensitive)
  if (search) {
    const searchRegex = new RegExp(search, "i");
    pipeline.push({
      $match: {
        $or: [{ name: searchRegex }, { "clientData.email": searchRegex }],
      },
    });
  }

  // 🧮 FILTERS
  const matchStage = {};

  // ✅ Multi-select Type filter (e.g., ?type=PDF,Word)
  if (type) {
    const types = Array.isArray(type)
      ? type
      : type.split(",").map((t) => t.trim());
    matchStage.type = { $in: types };
  }

  // ✅ Multi-select Status filter (e.g., ?status=Pending Review,Approved)
  if (status) {
    const statuses = Array.isArray(status)
      ? status
      : status.split(",").map((s) => s.trim());
    matchStage.status = { $in: statuses };
  }

  // 📅 Date range filter
  if (startDate || endDate) {
    matchStage.uploadedDate = {};
    if (startDate) matchStage.uploadedDate.$gte = new Date(startDate);
    if (endDate) matchStage.uploadedDate.$lte = new Date(endDate);
  }

  // Apply matchStage if filters exist
  if (Object.keys(matchStage).length > 0) {
    pipeline.push({ $match: matchStage });
  }

  // 🧭 SORT — newest first by default
  let sortOrder = -1;
  if (sortDate === "oldest") sortOrder = 1;
  pipeline.push({ $sort: { uploadedDate: sortOrder } });

  return pipeline;
};
