import express from "express";
import {Dog} from "../models/DogModel.js";
import {Application} from "../models/ApplicationModel.js";

const router = express.Router();

// ✅ Create (Add) new dog
router.post("/addDog", async (req, res) => {
  try {
    console.log("Inside the add dog function");
    const { name, age, breed, availableTime } = req.body;

    if (!name || !breed || age === undefined) {
      return res.status(400).json({ error: "Name, breed, and age are required." });
    }

    // Calculate availableUntil based on availableTime (in days)
    const availableUntil = availableTime 
      ? new Date(Date.now() + availableTime * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default 30 days

    const dog = new Dog({
      name,
      age,
      breed,
      availableUntil
    });

    const savedDog = await dog.save();
    res.status(201).json(savedDog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Get all dogs
router.get("/getDogs", async (req, res) => {
  try {
    const dogs = await Dog.find();
    res.status(200).json(dogs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Get a single dogs by ID
router.get("/getDog/:id", async (req, res) => {
  try {
    const dog = await Dog.findById(req.params.id);

    if (!dog) {
      return res.status(404).json({ error: "Dog not found." });
    }

    res.status(200).json(dog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Update dog (PUT)
router.put("/updateDog/:id", async (req, res) => {
  try {
    const { name, breed, age, status, availableTime } = req.body;

    const updateData = { name, age, breed };
    if (status) updateData.status = status;
    
    // Update availableUntil if availableTime is provided
    if (availableTime !== undefined) {
      updateData.availableUntil = new Date(Date.now() + availableTime * 24 * 60 * 60 * 1000);
    }

    const updatedDog = await Dog.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedDog) {
      return res.status(404).json({ error: "Dog not found." });
    }

    res.status(200).json(updatedDog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Check and update dog statuses based on availableUntil (auto-change to Pending)
router.post("/checkStatuses", async (req, res) => {
  try {
    const now = new Date();
    const dogs = await Dog.find({ 
      status: "Available",
      availableUntil: { $lte: now }
    });

    const updatePromises = dogs.map(dog => 
      Dog.findByIdAndUpdate(dog._id, { status: "Pending" }, { new: true })
    );

    const updated = await Promise.all(updatePromises);
    res.status(200).json({ 
      message: `Updated ${updated.length} dog(s) to Pending status`,
      count: updated.length 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Mark dog as adopted (Found Home)
router.post("/foundHome/:id", async (req, res) => {
  try {
    const { applicationId } = req.body;
    const dogId = req.params.id;

    const dog = await Dog.findById(dogId);
    if (!dog) {
      return res.status(404).json({ error: "Dog not found." });
    }

    // Update dog status to Adopted
    const updatedDog = await Dog.findByIdAndUpdate(
      dogId,
      { status: "Adopted" },
      { new: true }
    );

    // If applicationId is provided, update the application status to Approved
    if (applicationId) {
      await Application.findByIdAndUpdate(applicationId, { status: "Approved" });
    }

    res.status(200).json({ 
      message: "Dog has found a home! Status updated to Adopted.",
      dog: updatedDog 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Delete dog
router.delete("/deleteDog/:id", async (req, res) => {
  try {
    const deletedDog = await Dog.findByIdAndDelete(req.params.id);

    if (!deletedDog) {
      return res.status(404).json({ error: "Dog not found." });
    }

    res.status(200).json({ message: "Dog deleted successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
