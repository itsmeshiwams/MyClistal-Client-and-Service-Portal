// utils/computeEventStatus.js

/**
 * Compute event status based on current date
 * @param {Date} start - Event start date
 * @param {Date} end - Event end date
 * @returns {"Upcoming" | "On-Going" | "Expired"}
 */
export const computeEventStatus = (start, end) => {
  const now = new Date();
  if (now < new Date(start)) return "Upcoming";
  if (now >= new Date(start) && now <= new Date(end)) return "On-Going";
  return "Expired";
};

