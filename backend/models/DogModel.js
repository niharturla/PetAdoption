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
  }
});

export const Dog = mongoose.model("Dog", DogSchema)