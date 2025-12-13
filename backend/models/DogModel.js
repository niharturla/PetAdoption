import mongoose from "mongoose";

const DogSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    required: true,
    min: 0,
  },
  breed: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["Available", "Pending", "Adopted"],
    default: "Available",
  },
  intakeDate: {
    type: Date,
    default: Date.now,
  },
  availableUntil: {
    type: Date,
    required: true,
  }, 

  totalApps: {
    type: Number,
    default: 0,
  }
});

// Indexes for efficient querying
// Index on status for filtering dogs by availability status (used in dog listings and reports)
DogSchema.index({ status: 1 });

// Index on breed for breed-based filtering (used in filter routes and reports)
DogSchema.index({ breed: 1 });

// Compound index for status and availableUntil (used in checkStatuses route to find dogs that need status updates)
DogSchema.index({ status: 1, availableUntil: 1 });

// Index on intakeDate for sorting and date range queries (used in reports)
DogSchema.index({ intakeDate: -1 });

export const Dog = mongoose.model("Dog", DogSchema)