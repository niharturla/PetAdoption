import express from "express";
import mongoose from "mongoose";
import dogRoute from './routes/dogRoute.js';
import adopterRoute from './routes/adopterRoute.js';
import applicationRoute from './routes/applicationRoute.js';
import medicalRoutes from './routes/medicalRoute.js';
import filterRoutes from './routes/filterRoutes.js';

const app = express();

// sanitize the inputs to prevent nosql injection

const sanitize = (obj) => {
  if (!obj || typeof obj !== "object") return;
  for (const key in obj) {
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
    } else if (typeof obj[key] === "object") {
      sanitize(obj[key]);
    }
  }
};


// Enable CORS for frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());

app.use((req, res, next) => {
  sanitize(req.body);
  sanitize(req.query);
  sanitize(req.params);
  next();
});

app.get('/', (req,res) => {
    return res.status(234).send('Welcome tutorial')
});

app.use('/dogs',dogRoute);
app.use('/adopters',adopterRoute);
app.use('/applications', applicationRoute);
app.use('/records', medicalRoutes);
app.use('/filters', filterRoutes);

const PORT = process.env.PORT || 5555;

mongoose    
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log(`App is connected to database`);
        app.listen(PORT, () => {
            console.log(`App is listening to port: ${PORT}`);
        })
    }).catch((error) => {
        console.log(error);
    })