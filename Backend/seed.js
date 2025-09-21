import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./src/models/User.js";

dotenv.config();

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const hashedPassword = await bcrypt.hash("password123", 10);

    await User.deleteMany();

    await User.insertMany([
      { email: "ram@example.com", password: hashedPassword, role: "Client" },
      { email: "staff@example.com", password: hashedPassword, role: "Staff" }
    ]);

    console.log("Users seeded");
    process.exit();
  } catch (err) {
    console.error("Error seeding users:", err.message);
    process.exit(1);
  }
};

seedUsers();
