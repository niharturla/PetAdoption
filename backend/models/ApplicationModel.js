import mongoose from "mongoose";

const ApplicationSchema = mongoose.Schema({
  dog: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Dog",
    required: true,
  },
  adopter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Adopter",
    required: true,
  },
  status: {
    type: String,
    enum: ["Submitted", "Approved", "Rejected", "In Review"],
    default: "Submitted",
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
});

export const Application = mongoose.model("Application", ApplicationSchema)