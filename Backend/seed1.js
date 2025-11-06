// backend/seed1.js
import dotenv from "dotenv";
import mongoose from "mongoose";
import Event from "./src/models/Event.js";
import User from "./src/models/User.js";

dotenv.config();

const getRandomDateWithinNextWeek = () => {
  const now = new Date();
  const future = new Date(now.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000);
  return future;
};

const getRandomStatus = () => {
  const statuses = ["pending", "accepted", "declined"];
  return statuses[Math.floor(Math.random() * statuses.length)];
};

const seedEvents = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    // Fetch all users
    const users = await User.find({});
    if (users.length === 0) {
      console.log("⚠️ No users found. Please run seed.js first.");
      process.exit(0);
    }

    // Clear old events
    await Event.deleteMany({});
    console.log("🧹 Cleared previous events");

    const events = [];

    for (const user of users) {
      let hasPendingEvent = false;

      for (let i = 1; i <= 5; i++) {
        const start = getRandomDateWithinNextWeek();
        const end = new Date(start.getTime() + (30 + Math.random() * 90) * 60000); // 30–120 min duration

        // Random attendees (excluding creator)
        const otherUsers = users.filter((u) => u._id.toString() !== user._id.toString());
        const attendeesSample = otherUsers
          .sort(() => 0.5 - Math.random())
          .slice(0, Math.floor(Math.random() * 3) + 1) // 1–3 attendees
          .map((u) => ({
            user: u._id,
            status: getRandomStatus(),
            reminder: new Date(start.getTime() - Math.floor(Math.random() * 60) * 60000),
          }));

        // Ensure at least one pending event for this user
        if (!hasPendingEvent && i === 5) {
          if (attendeesSample.length > 0) {
            attendeesSample[0].status = "pending";
            hasPendingEvent = true;
          } else {
            // if no attendees, add one with pending status
            const randomAttendee = otherUsers[Math.floor(Math.random() * otherUsers.length)];
            attendeesSample.push({
              user: randomAttendee._id,
              status: "pending",
              reminder: new Date(start.getTime() - 30 * 60000),
            });
            hasPendingEvent = true;
          }
        }

        events.push({
          title: `${user.email.split("@")[0]} Event ${i}`,
          description: `Detailed discussion and updates for ${user.email.split("@")[0]} Event ${i}.`,
          start,
          end,
          createdBy: user._id,
          attendees: attendeesSample,
        });
      }
    }

    await Event.insertMany(events);
    console.log(`✅ Seeded ${events.length} total events across all users!`);
    console.log(`🎯 Each user now has at least one event with pending attendees.`);

    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding events:", err);
    process.exit(1);
  }
};

seedEvents();
