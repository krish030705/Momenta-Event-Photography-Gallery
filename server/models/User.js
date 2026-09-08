// models/User.js
// Represents anyone who can log in: an Admin/Lead or a Team Member.
// (Customers never get a User account -- they only ever use a gallery PIN.)

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ["admin", "team_member"],
      default: "team_member",
    },
  },
  { timestamps: true }
);

// Runs automatically before every save. Only re-hashes the password if
// it's new or has just been changed -- otherwise unrelated updates (like
// changing a name) would re-hash an already-hashed password and break login.
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method: user.comparePassword("someGuess") -- used during login.
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("User", userSchema);