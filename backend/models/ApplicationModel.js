import mongoose from "mongoose";

// use schema types to enforce consistency
const ApplicationSchema = mongoose.Schema({
  dog: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Dog",
    required: true,
  },

  name: String, 
  breed: String,
  
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

// Indexes for efficient querying
// Index on status for filtering applications by status (used extensively in reports and application listings)
ApplicationSchema.index({ status: 1 });

// Index on dog for finding all applications for a specific dog (used when checking if dog has applications)
ApplicationSchema.index({ dog: 1 });

// Index on adopter for finding all applications by a specific adopter (used in adopter reports)
ApplicationSchema.index({ adopter: 1 });

// Index on submittedAt for date range queries and sorting (used in reports with date filters)
ApplicationSchema.index({ submittedAt: -1 });

// Compound index for status and submittedAt (used in reports that filter by both status and date)
ApplicationSchema.index({ status: 1, submittedAt: -1 });

// Compound index for dog and status (used to find approved applications for a dog)
ApplicationSchema.index({ dog: 1, status: 1 });

export const Application = mongoose.model("Application", ApplicationSchema)