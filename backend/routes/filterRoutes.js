import express from "express";
import { Dog } from "../models/DogModel.js";
import { Adopter } from "../models/adopterModel.js";
import { Application } from "../models/ApplicationModel.js";
import { MedicalRecords } from "../models/recordModel.js";
import { AdoptedDog } from "../models/AdoptedDogModel.js";

const router = express.Router();

/**
 * FILTER DOGS
 * Example: GET /filters/dogs?minAge=1&maxAge=5&breed=Golden Retriever
 */
router.get("/dogs", async (req, res) => {
  try {
    const { minAge, maxAge, breed } = req.query;

    const filter = {};
    if (minAge) filter.age = { ...filter.age, $gte: Number(minAge) };
    if (maxAge) filter.age = { ...filter.age, $lte: Number(maxAge) };
    if (breed) filter.breed = breed;

    const dogs = await Dog.find(filter).lean();
    res.json(dogs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * FILTER ADOPTERS
 * Example: GET /filters/adopters?homeType=Apartment&experience=None
 */
router.get("/adopters", async (req, res) => {
  try {
    const { homeType, experience } = req.query;
    const filter = {};
    if (homeType) filter.homeType = homeType;
    if (experience) filter.experience = experience;

    const adopters = await Adopter.find(filter).lean();
    res.json(adopters);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET ADOPTER FOR A DOG
 * Example: GET /filters/dogs/64f1abc12345/adopter
 */
router.get("/dogs/:dog_id/adopter", async (req, res) => {
  try {
    const { dog_id } = req.params;

    if (!dog_id) {
      return res.status(400).json({ error: "dog_id is required" });
    }

    // Find adopted dog by original dog ID
    const adoptedDog = await AdoptedDog.findOne({
      originalDogId: dog_id,
    })
      .populate("adopter")
      .lean();

    if (!adoptedDog) {
      return res.status(404).json({
        error: "Dog has not been adopted or does not exist",
      });
    }

    if (!adoptedDog.adopter) {
      return res.status(404).json({
        error: "Adopter information not found",
      });
    }

    res.json({
      dogId: dog_id,
      dogName: adoptedDog.name,
      adopter: {
        _id: adoptedDog.adopter._id,
        name: adoptedDog.adopter.name,
        email: adoptedDog.adopter.email,
        phone: adoptedDog.adopter.phone,
        homeType: adoptedDog.adopter.homeType,
        experience: adoptedDog.adopter.experience,
      },
      adoptedDate: adoptedDog.adoptedDate,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/applications", async (req, res) => {
  try {
    const {
      status,
      dog_id,
      adopter_id,
      startDate,
      endDate,
      includeAdopted,
    } = req.query;

    const filter = {};

    // Regular application filters
    if (status) filter.status = status;
    if (dog_id) filter.dog = dog_id;
    if (adopter_id) filter.adopter = adopter_id;

    if (startDate || endDate) {
      filter.submittedAt = {};
      if (startDate) filter.submittedAt.$gte = new Date(startDate);
      if (endDate) filter.submittedAt.$lte = new Date(endDate);
    }

    // Fetch applications (even if dog was later adopted)
    const applications = await Application.find(filter)
      .populate("dog")
      .populate("adopter")
      .lean();

    let results = [...applications];

    // Include adopted dogs as virtual application records
    if (includeAdopted === "true") {
      const adoptedFilter = {};

      // filter by dog
      if (dog_id) adoptedFilter.originalDogId = dog_id;

      // filter by adopter
      if (adopter_id) adoptedFilter.adopter = adopter_id;

      // filter by adoption date
      if (startDate || endDate) {
        adoptedFilter.adoptedDate = {};
        if (startDate) adoptedFilter.adoptedDate.$gte = new Date(startDate);
        if (endDate) adoptedFilter.adoptedDate.$lte = new Date(endDate);
      }

      const adoptedDogs = await AdoptedDog.find(adoptedFilter)
        .populate("adopter")
        .lean();

      // Convert adopted dogs into application-style records
      const adoptedApps = adoptedDogs.map(d => ({
        _id: d._id,
        dog: {
          _id: d.originalDogId,
          name: d.name,
          breed: d.breed,
          age: d.age,
          status: "Adopted"
        },
        adopter: d.adopter,
        status: "Approved",
        submittedAt: d.adoptedDate
      }));

      results = [...results, ...adoptedApps];
    }

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


/**
 * GET APPLICATION STATISTICS
 * Example: GET /filters/applications/stats?status=Submitted&startDate=2025-01-01&endDate=2025-12-31
 */
router.get("/applications/stats", async (req, res) => {
  try {
    const { status, dog_id, adopter_id, startDate, endDate } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (dog_id) filter.dog = dog_id;
    if (adopter_id) filter.adopter = adopter_id;
    if (startDate || endDate) {
      filter.submittedAt = {};
      if (startDate) filter.submittedAt.$gte = new Date(startDate);
      if (endDate) filter.submittedAt.$lte = new Date(endDate);
    }

    const applications = await Application.find(filter)
      .populate("dog")
      .populate("adopter")
      .lean();

    const total = applications.length;
    const byStatus = {
      Submitted: applications.filter((a) => a.status === "Submitted").length,
      Approved: applications.filter((a) => a.status === "Approved").length,
      Rejected: applications.filter((a) => a.status === "Rejected").length,
      "In Review": applications.filter((a) => a.status === "In Review").length,
    };

    // Calculate average processing time (days from submission to now, or to status change)
    const now = new Date();
    const processingTimes = applications
      .map((app) => {
        const submitted = new Date(app.submittedAt);
        return (now - submitted) / (1000 * 60 * 60 * 24); // Convert to days
      })
      .filter((time) => time >= 0);

    const avgProcessingTime =
      processingTimes.length > 0
        ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
        : 0;

    // Acceptance rate (Approved / Total)
    const acceptanceRate = total > 0 ? (byStatus.Approved / total) * 100 : 0;

    // Average applications per dog (if multiple applications for same dog)
    const uniqueDogs = new Set(
      applications.map((a) => a.dog?._id?.toString()).filter(Boolean)
    );
    const avgApplicationsPerDog =
      uniqueDogs.size > 0 ? total / uniqueDogs.size : 0;

    res.json({
      total,
      byStatus,
      averageProcessingTimeDays: Math.round(avgProcessingTime * 100) / 100,
      acceptanceRate: Math.round(acceptanceRate * 100) / 100,
      averageApplicationsPerDog: Math.round(avgApplicationsPerDog * 100) / 100,
      uniqueDogsCount: uniqueDogs.size,
      uniqueAdoptersCount: new Set(
        applications.map((a) => a.adopter?._id?.toString()).filter(Boolean)
      ).size,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * FILTER MEDICAL RECORDS
 * Example: GET /filters/medical?dog_id=690d25d34ac6e0021ac28b14&vet_name=Dr. Smith
 */
router.get("/medical", async (req, res) => {
  try {
    const { dog_id, vet_name, startDate, endDate } = req.query;
    const filter = {};

    if (dog_id) filter.animal_id = dog_id;
    if (vet_name) filter.vet_name = vet_name;
    if (startDate)
      filter.treatment_date = {
        ...filter.treatment_date,
        $gte: new Date(startDate),
      };
    if (endDate)
      filter.treatment_date = {
        ...filter.treatment_date,
        $lte: new Date(endDate),
      };

    const records = await MedicalRecords.find(filter)
      .populate("animal_id")
      .lean();

    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET DOG STATISTICS TABLE
 * Returns latest 25 ADOPTED dogs with their application statistics
 * Example: GET /filters/dogs/stats
 */
router.get("/dogs/stats", async (req, res) => {
  try {
    const adoptedDogs = await AdoptedDog.find()
      .sort({ adoptedDate: -1 })
      .limit(25)
      .lean();

    if (adoptedDogs.length === 0) {
      return res.json([]);
    }

    const originalDogIds = adoptedDogs
      .map(d => d.originalDogId)
      .filter(Boolean);

    const applications = await Application.find({
      dog: { $in: originalDogIds },
    }).lean();

    const appStatsByDog = {};

    applications.forEach(app => {
      const id = app.dog.toString();
      if (!appStatsByDog[id]) {
        appStatsByDog[id] = { total: 0, approved: 0, rejected: 0 };
      }
      appStatsByDog[id].total++;
      if (app.status === "Approved") appStatsByDog[id].approved++;
      if (app.status === "Rejected") appStatsByDog[id].rejected++;
    });

    const dogStats = adoptedDogs.map(adoptedDog => {
      const dogIdStr = adoptedDog.originalDogId?.toString();
      const stats = appStatsByDog[dogIdStr] || {
        total: 0,
        approved: 0,
        rejected: 0,
      };

      return {
        dogId: adoptedDog.originalDogId,
        name: adoptedDog.name,
        breed: adoptedDog.breed,
        status: "Adopted",
        totalApplications: stats.total,
        approvedApplications: stats.approved,
        rejectedApplications: stats.rejected,
        intakeDate: adoptedDog.intakeDate,
        adoptedDate: adoptedDog.adoptedDate,
      };
    });

    res.json(dogStats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


/**
 * GET ADOPTION STATISTICS
 * Returns comprehensive adoption statistics
 * Example: GET /filters/adopted/stats
 */
router.get("/adopted/stats", async (req, res) => {
  try {
    const adoptedDogs = await AdoptedDog.find().populate("adopter").lean();

    if (adoptedDogs.length === 0) {
      return res.json({
        totalAdopted: 0,
        averageDaysInShelter: 0,
        mostAdoptedBreed: null,
        topAdopter: null,
        averageApplicationsPerDog: 0,
        fastestAdoption: null,
        slowestAdoption: null,
      });
    }

    // Total adopted dogs
    const totalAdopted = adoptedDogs.length;

    // Calculate days in shelter for each dog
    const daysInShelter = adoptedDogs.map((dog) => {
      const intake = new Date(dog.intakeDate);
      const adopted = new Date(dog.adoptedDate);
      return Math.floor((adopted - intake) / (1000 * 60 * 60 * 24));
    });

    const averageDaysInShelter =
      daysInShelter.reduce((a, b) => a + b, 0) / daysInShelter.length;

    // Most recent intake date (for display)
    const intakeDates = adoptedDogs.map((dog) => new Date(dog.intakeDate));
    const mostRecentIntakeDate =
      intakeDates.length > 0
        ? new Date(Math.max(...intakeDates.map((d) => d.getTime())))
        : null;

    // Most adopted breed
    const breedCounts = {};
    adoptedDogs.forEach((dog) => {
      breedCounts[dog.breed] = (breedCounts[dog.breed] || 0) + 1;
    });
    const mostAdoptedBreed = Object.entries(breedCounts).sort(
      (a, b) => b[1] - a[1]
    )[0][0];

    // Top adopter (adopter who adopted the most dogs)
    const adopterCounts = {};
    adoptedDogs.forEach((dog) => {
      if (dog.adopter && dog.adopter._id) {
        const adopterId = dog.adopter._id.toString();
        const adopterName = dog.adopter.name || "Unknown";
        if (!adopterCounts[adopterId]) {
          adopterCounts[adopterId] = { name: adopterName, count: 0 };
        }
        adopterCounts[adopterId].count++;
      }
    });
    const topAdopterEntry = Object.entries(adopterCounts).sort(
      (a, b) => b[1].count - a[1].count
    )[0];
    const topAdopter = topAdopterEntry
      ? {
          name: topAdopterEntry[1].name,
          count: topAdopterEntry[1].count,
        }
      : null;

    // Average applications per adopted dog
    // Note: Applications are deleted when dogs are adopted, so we can't get exact historical count
    // We'll use the applicationId field if it exists, or estimate based on current applications
    // for similar dogs (same breed/status)
    const adoptedDogIds = adoptedDogs
      .map((d) => d.originalDogId?.toString())
      .filter(Boolean);

    // Count how many adopted dogs have an applicationId (the one that was approved)
    const adoptedDogsWithApplication = adoptedDogs.filter(
      (d) => d.applicationId
    ).length;

    // For a more accurate count, we could check current applications for similar dogs
    // But for simplicity, we'll use: if applicationId exists, that dog had at least 1 application
    // This is a conservative estimate (actual count was likely higher)
    const averageApplicationsPerDog =
      adoptedDogsWithApplication > 0
        ? adoptedDogsWithApplication / totalAdopted
        : 0;

    // Fastest and slowest adoption
    const fastestIndex = daysInShelter.indexOf(Math.min(...daysInShelter));
    const slowestIndex = daysInShelter.indexOf(Math.max(...daysInShelter));

    const fastestAdoption =
      fastestIndex >= 0
        ? {
            dogName: adoptedDogs[fastestIndex].name,
            days: daysInShelter[fastestIndex],
          }
        : null;

    const slowestAdoption =
      slowestIndex >= 0
        ? {
            dogName: adoptedDogs[slowestIndex].name,
            days: daysInShelter[slowestIndex],
          }
        : null;

    res.json({
      totalAdopted,
      averageDaysInShelter: Math.round(averageDaysInShelter * 100) / 100,
      mostRecentIntakeDate: mostRecentIntakeDate
        ? mostRecentIntakeDate.toISOString()
        : null,
      mostAdoptedBreed,
      topAdopter,
      averageApplicationsPerDog:
        Math.round(averageApplicationsPerDog * 100) / 100,
      fastestAdoption,
      slowestAdoption,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET TOTAL APPLICATION COUNT FOR A DOG
 * Example: GET /filters/dogs/64fabc123/applications/count
 */
router.get("/dogs/:dog_id/applications/count", async (req, res) => {
  try {
    const { dog_id } = req.params;

    if (!dog_id) {
      return res.status(400).json({ error: "dog_id is required" });
    }

    const totalApplications = await Application.countDocuments({
      dog: dog_id,
    });

    res.json({
      dogId: dog_id,
      totalApplications,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
