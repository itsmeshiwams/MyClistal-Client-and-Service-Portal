// src/validators/calendarValidators.js
import { body, query, param } from "express-validator";

export const createEventValidator = [
  body("title").isString().trim().notEmpty().withMessage("title required"),
  body("start").isISO8601().withMessage("start must be ISO8601 date"),
  body("end").isISO8601().withMessage("end must be ISO8601 date"),
  body("attendees").optional().isArray().withMessage("inviteUsers must be an array of user IDs"),
];

export const respondToRequestValidator = [
  param("eventId").isMongoId().withMessage("invalid event id"),
  body("action").isIn(["accept", "reject"]).withMessage("action must be accept|reject"),
];

export const listEventsValidator = [
  query("filter").optional().isIn(["all", "today", "upcoming", "deadline", "range"]),
  query("from").optional().isISO8601(),
  query("to").optional().isISO8601(),
];

export const connectProviderValidator = [
  body("provider").isIn(["google", "outlook"]),
  body("accessToken").isString().optional(),
  body("refreshToken").isString().optional(),
  body("remoteId").optional().isString(),
  body("syncEnabled").optional().isBoolean(),
];
