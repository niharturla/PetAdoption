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

export const Adopter = mongoose.model("Adopter", AdopterSchema);