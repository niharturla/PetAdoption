import mongoose from "mongoose";

const AdopterSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  homeType: {
    type: String,
    enum: ["Apartment", "House", "Townhouse", "Other"],
    required: true,
  },
  experience: {
    type: String,
    default: "None",
  },
  
});

// Indexes for efficient querying
// Index on homeType for filtering adopters by home type (used in filter routes)
AdopterSchema.index({ homeType: 1 });

// Index on experience for filtering by experience level (used in filter routes)
AdopterSchema.index({ experience: 1 });

// Compound index for homeType and experience (used in complex adopter filtering queries)
AdopterSchema.index({ homeType: 1, experience: 1 });

export const Adopter = mongoose.model("Adopter", AdopterSchema);