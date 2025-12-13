import mongoose from "mongoose";

const AdoptedDogSchema = mongoose.Schema({
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
  intakeDate: {
    type: Date,
    required: true,
  },
  adoptedDate: {
    type: Date,
    default: Date.now,
  },
  adopter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Adopter",
    required: true,
  },
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Application",
  },
  originalDogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Dog",
  }
});

// Indexes for efficient querying
// Index on adoptedDate for sorting and filtering by date
AdoptedDogSchema.index({ adoptedDate: -1 });

// Index on adopter for filtering by adopter
AdoptedDogSchema.index({ adopter: 1 });

// Compound index for date range queries with adopter
AdoptedDogSchema.index({ adoptedDate: -1, adopter: 1 });

export const AdoptedDog = mongoose.model("AdoptedDog", AdoptedDogSchema);

