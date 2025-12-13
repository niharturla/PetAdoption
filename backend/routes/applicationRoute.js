import express from "express";
import { Application } from "../models/ApplicationModel.js";
import { Dog } from "../models/DogModel.js";
import { Adopter } from "../models/adopterModel.js";

const router = express.Router();

// ✅ Create a new application
router.post("/add", async (req, res) => {
  try {
    const { dog_id, adopter_id, status } = req.body;

    if (!dog_id || !adopter_id) {
      return res.status(400).json({ error: "dog_id and adopter_id are required." });
    }

    // Verify dog and adopter exist
    const dog = await Dog.findById(dog_id);
    const adopter = await Adopter.findById(adopter_id);

    // check if adopter already has same application for same dog

    // if they do then return/reject the app
    const existingApplication = await Application.findOne({
      dog: dog_id,
      adopter: adopter_id
    });

    if (existingApplication) {
      return res.status(409).json({
        error: "Adopter has already applied for this dog."
      });
    }

    if (!dog) return res.status(404).json({ error: "Dog not found." });
    if (!adopter) return res.status(404).json({ error: "Adopter not found." });

    await Dog.findByIdAndUpdate(
      dog_id,
      { $inc: { totalApps: 1 } },
      { new: true }
    );
    
    const application = new Application({
      dog: dog_id,

      dogName: dog.name,
      dogBreed: dog.breed,
      adopter: adopter_id,
      status: status || "Submitted"
    });

    

    const savedApplication = await application.save();
    res.status(201).json(savedApplication);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ✅ Get all applications for a specific dog
router.get("/dog/:dogId", async (req, res) => {
  try {
    const { dogId } = req.params;
    const { status } = req.query;

    // Validate dog exists
    const dog = await Dog.findById(dogId);
    if (!dog) {
      return res.status(404).json({ error: "Dog not found." });
    }

    // Build filter
    const filter = { dog: dogId };
    if (status) filter.status = status;

    const applications = await Application.find(filter)
      .populate("dog")
      .populate("adopter")
      .sort({ submittedAt: -1 });

    res.status(200).json({
      dog: {
        _id: dog._id,
        name: dog.name
      },
      totalApplications: applications.length,
      applications
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ✅ Approve an application and reject all others for the same dog
router.put("/:id/approve", async (req, res) => {
  try {
    const approvedAppId = req.params.id;

    // Find the approved application
    const approvedApp = await Application.findById(approvedAppId);
    if (!approvedApp) {
      return res.status(404).json({ error: "Application not found." });
    }

    const dogId = approvedApp.dog;

    // 1️⃣ Approve the selected application
    approvedApp.status = "Approved";
    await approvedApp.save();

    // 2️⃣ Reject all other applications for the same dog
    await Application.updateMany(
      {
        dog: dogId,
        _id: { $ne: approvedAppId }
      },
      {
        $set: { status: "Rejected" }
      }
    );

    res.status(200).json({
      message: "Application approved. All other applications rejected.",
      approvedApplicationId: approvedAppId,
      dogId
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});




// ✅ Get all applications (excludes dogs that have been adopted)
router.get("/", async (req, res) => {
  try {
    const { AdoptedDog } = await import("../models/AdoptedDogModel.js");
    const { status, dog_id, adopter_id, startDate, endDate, includeAvailableDogs } = req.query;

    // Build filter object
    const filter = {};

    if (status) filter.status = status;
    if (dog_id) filter.dog = dog_id;
    if (adopter_id) filter.adopter = adopter_id;

    if (startDate || endDate) {
      filter.submittedAt = {};
      if (startDate) filter.submittedAt.$gte = new Date(startDate);
      if (endDate) filter.submittedAt.$lte = new Date(endDate);
    }

    // Exclude applications for dogs that have been adopted (moved to AdoptedDog collection)
    const adoptedDogs = await AdoptedDog.distinct("originalDogId");
    if (adoptedDogs.length > 0) {
      if (filter.dog) {
        filter.dog = { ...filter.dog, $nin: adoptedDogs };
      } else {
        filter.dog = { $nin: adoptedDogs };
      }
    }

    // Handle "Include Dogs Not Yet Adopted" checkbox
    if (includeAvailableDogs === "true") {
      // Find IDs of dogs that already have an approved application
      const approvedApps = await Application.distinct("dog", { status: "Approved" });
      const approvedButNotAdopted = approvedApps.filter(id => !adoptedDogs.includes(id));
      if (approvedButNotAdopted.length > 0) {
        filter.dog = { ...filter.dog, $nin: approvedButNotAdopted };
      }
    }

    const applications = await Application.find(filter)
      .populate("dog")
      .populate("adopter")
      .sort({ submittedAt: -1 });

    res.status(200).json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Get single application by ID
router.get("/:id", async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate("dog")
      .populate("adopter");

    if (!application) return res.status(404).json({ error: "Application not found." });

    res.status(200).json(application);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Update application
router.put("/:id", async (req, res) => {
  try {
    const { dog_id, adopter_id, status } = req.body;

    // Build update object - only include fields that are provided
    const updateData = {};
    if (dog_id) updateData.dog = dog_id;
    if (adopter_id) updateData.adopter = adopter_id;
    if (status) updateData.status = status;

    const updatedApplication = await Application.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedApplication) return res.status(404).json({ error: "Application not found." });

    res.status(200).json(updatedApplication);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Delete application
router.delete("/:id", async (req, res) => {
  try {
    console.log("Inside delete app func");
    const deletedApplication = await Application.findByIdAndDelete(req.params.id);

    if (!deletedApplication) return res.status(404).json({ error: "Application not found." });

    res.status(200).json({ message: "Application deleted successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// calculate stats
// ✅ Get applications statistics with optional filters
router.get("/stats", async (req, res) => {
  try {
    const { status, dog_id, adopter_id, startDate, endDate, includeAvailableDogs } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (dog_id) filter.dog = dog_id;
    if (adopter_id) filter.adopter = adopter_id;

    if (startDate || endDate) {
      filter.submittedAt = {};
      if (startDate) filter.submittedAt.$gte = new Date(startDate);
      if (endDate) filter.submittedAt.$lte = new Date(endDate);
    }

    if (includeAvailableDogs === "true") {
      const adoptedDogs = await Application.distinct("dog", { status: "Approved" });
      filter.dog = { $nin: adoptedDogs };
    }

    const applications = await Application.find(filter);

    const total = applications.length;

    // Count by status
    const byStatus = applications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {});

    // Average applications per dog
    const uniqueDogs = new Set(applications.map(app => app.dog.toString()));
    const averageApplicationsPerDog = uniqueDogs.size ? total / uniqueDogs.size : 0;

    res.json({
      total,
      byStatus,
      averageApplicationsPerDog
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


export default router;
