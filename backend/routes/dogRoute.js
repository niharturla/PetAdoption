import express from "express";
import {Dog} from "../models/DogModel.js";
import {Application} from "../models/ApplicationModel.js";
import {MedicalRecords} from "../models/recordModel.js";
import {AdoptedDog} from "../models/AdoptedDogModel.js";
import mongoose from "mongoose";

const router = express.Router();

// ✅ Create (Add) new dog
router.post("/addDog", async (req, res) => {
  try {
    console.log("Inside the add dog function");
    const { name, age, breed, availableUntil } = req.body;

    if (!name || !breed || age === undefined) {
      return res.status(400).json({ error: "Name, breed, and age are required." });
    }

    // availableUntil is now a date/time string from the frontend
    // Validate it's a valid date
    const readyForReviewDate = availableUntil ? new Date(availableUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    if (isNaN(readyForReviewDate.getTime())) {
      return res.status(400).json({ error: "Invalid Ready for Review date/time." });
    }

    const dog = new Dog({
      name,
      age,
      breed,
      availableUntil: readyForReviewDate
    });

    const savedDog = await dog.save();
    res.status(201).json(savedDog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Get all dogs

/*
router.get("/getDogs", async (req, res) => {
  try {
    const dogs = await Dog.find({});

    res.status(200).json(dogs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});*/

// GET /dogs/adopted
router.get("/adopted", async (req, res) => {
  try {
    const adoptedDogs = await AdoptedDog.find()
      .populate("adopter", "name phone email")
      .populate("originalDogId", "name breed age")
      .sort({ adoptedDate: -1 })
      .lean();

    res.json(adoptedDogs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// GET /dogs/getDogs
router.get("/getDogs", async (req, res) => {
  try {
    const { includeAdopted } = req.query;

    const filter = {};
    if (includeAdopted !== "true") {
      filter.status = { $ne: "Adopted" };
    }

    const dogs = await Dog.find(filter).lean();
    res.json(dogs);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
    const { name, breed, age, status, availableUntil } = req.body;

    const updateData = { name, age, breed };
    if (status) updateData.status = status;
    
    // Update availableUntil if provided (now a date/time string)
    if (availableUntil) {
      const readyForReviewDate = new Date(availableUntil);
      if (isNaN(readyForReviewDate.getTime())) {
        return res.status(400).json({ error: "Invalid Ready for Review date/time." });
      }
      updateData.availableUntil = readyForReviewDate;
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
// Also updates application statuses for those dogs to "Pending"
// Removes Pending dogs with no applications
router.post("/checkStatuses", async (req, res) => {
  try {
    const now = new Date();
    
    // 1. Find dogs that need status update (Available -> Pending)
    const dogsToUpdate = await Dog.find({ 
      status: "Available",
      availableUntil: { $lte: now }
    });

    // Update dog statuses to Pending
    const updatePromises = dogsToUpdate.map(dog => 
      Dog.findByIdAndUpdate(dog._id, { status: "Pending" }, { new: true })
    );

    const updated = await Promise.all(updatePromises);

    // Update application statuses for these dogs to "Pending"
    const dogIds = updated.map(dog => dog._id);
    if (dogIds.length > 0) {
      await Application.updateMany(
        { dog: { $in: dogIds } },
        { status: "In Review" }
      );
    }

    // 2. Find Pending dogs with no applications and remove them
    const pendingDogs = await Dog.find({ status: "Pending" });
    const pendingDogIds = pendingDogs.map(dog => dog._id);
    
    // Get all applications for pending dogs
    const applicationsForPendingDogs = await Application.find({
      dog: { $in: pendingDogIds }
    });
    
    // Find which pending dogs have applications
    const pendingDogsWithApplications = new Set(
      applicationsForPendingDogs.map(app => app.dog.toString())
    );
    
    // Find pending dogs with NO applications
    const pendingDogsToRemove = pendingDogs.filter(
      dog => !pendingDogsWithApplications.has(dog._id.toString())
    );
    
    // Delete pending dogs with no applications
    let removedCount = 0;
    if (pendingDogsToRemove.length > 0) {
      const dogsToRemoveIds = pendingDogsToRemove.map(dog => dog._id);
      
      // Also delete any medical records for these dogs
      await MedicalRecords.deleteMany({ dog_id: { $in: dogsToRemoveIds } });
      
      // Delete the dogs
      const deleteResult = await Dog.deleteMany({ _id: { $in: dogsToRemoveIds } });
      removedCount = deleteResult.deletedCount;
    }

    const messages = [];
    if (updated.length > 0) {
      messages.push(`Updated ${updated.length} dog(s) to Pending status and their applications to Pending`);
    }
    if (removedCount > 0) {
      messages.push(`Removed ${removedCount} Pending dog(s) with no applications`);
    }
    if (messages.length === 0) {
      messages.push("No status updates needed");
    }

    res.status(200).json({ 
      message: messages.join(". "),
      updatedCount: updated.length,
      removedCount: removedCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/foundHome/:id", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { applicationId } = req.body;
    const dogId = req.params.id;

    const dog = await Dog.findById(dogId).session(session);
    if (!dog) {
      throw new Error("Dog not found.");
    }

    const approvedApp = await Application.findById(applicationId)
      .populate("adopter")
      .session(session);

    if (!approvedApp) {
      throw new Error("Application not found.");
    }

    // 1️⃣ Approve selected application
    approvedApp.status = "Approved";
    approvedApp.name = dog.name;
    approvedApp.breed = dog.breed;
    await approvedApp.save({ session });

    // 2️⃣ Reject all other applications for this dog
    await Application.updateMany(
      {
        dog: dogId,
        _id: { $ne: applicationId }
      },
      {
        $set: { status: "Rejected" }
      },
      { session }
    );

    // 3️⃣ Keep ONLY the latest 25 applications
    const appsToKeep = await Application.find({ dog: dogId })
      .sort({ submittedAt: -1 }) // newest first
      .limit(25)
      .select("_id")
      .session(session);

    const keepIds = appsToKeep.map(app => app._id);

    await Application.deleteMany(
      {
        dog: dogId,
        _id: { $nin: keepIds }
      },
      { session }
    );

    // 4️⃣ Create adopted dog record
    const adoptedDog = new AdoptedDog({
      name: dog.name,
      age: dog.age,
      breed: dog.breed,
      intakeDate: dog.intakeDate,
      adoptedDate: new Date(),
      adopter: approvedApp.adopter._id,
      applicationId,
      originalDogId: dogId
    });

    await adoptedDog.save({ session });

    // 5️⃣ Remove dog from active dogs
    await Dog.findByIdAndDelete(dogId).session(session);

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: "Dog adopted. Applications preserved (latest 25).",
      adoptedDog
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ error: error.message });
  }
});


// ✅ Delete dog
router.delete("/deleteDog/:id", async (req, res) => {
  try {
    console.log("deleting dog");
    const deletedDog = await Dog.findByIdAndDelete(req.params.id);

    if (!deletedDog) {
      return res.status(404).json({ error: "Dog not found." });
    }

    res.status(200).json({ message: "Dog deleted successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete all applications related to the dog id
// ✅ Delete all applications for a given dog ID
router.delete("/deleteApps/:dog_id", async (req, res) => {
  try {
    console.log("Inside the delete apps route");

    const { dog_id } = req.params;
    console.log(dog_id);
    // Validate dog exists
    const dog = await Dog.findById(dog_id);
    if (!dog) {
      console.log("couldnt find dog");
      return res.status(404).json({ error: "Dog not found." });
    }

    // Delete applications
    const result = await Application.deleteMany({ dog: dog_id });

    res.status(200).json({
      message: "Applications deleted successfully.",
      deletedCount: result.deletedCount
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/deleteRecords/:dog_id", async (req,res) => {
  try {

    console.log("deleting medical record for the dog");
    const {dog_id} = req.params;

    const result = await MedicalRecords.deleteMany({dog_id: dog_id});
    if (result) {
      res.status(200).json({
        message: "Medical record delete successfully",
      });
    } else {
      console.log("error");
    }
  } catch(error) {
    res.status(500).json({error: error.message});
  }
});

// ✅ Get adopted dogs (with optional limit)
router.get("/adopted", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50; // Default to 50, can be changed
    const adoptedDogs = await AdoptedDog.find()
      .populate("adopter")
      .sort({ adoptedDate: -1 }) // Most recent first
      .limit(limit);
    
    res.status(200).json(adoptedDogs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



export default router;
