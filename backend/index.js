import express from "express";
import { mongoDBURL, PORT } from "./config.js";
import mongoose from "mongoose";
import booksRoute from './routes/booksRoute.js';
import dogRoute from './routes/dogRoute.js';
import adopterRoute from './routes/adopterRoute.js';
import applicationRoute from './routes/applicationRoute.js';
import medicalRoutes from './routes/medicalRoute.js';
import filterRoutes from './routes/filterRoutes.js';
const app = express();

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
app.get('/', (req,res) => {
    console.log(req);
    return res.status(234).send('Welcome tutorial')
});

app.use('/books', booksRoute);
app.use('/dogs',dogRoute);
app.use('/adopters',adopterRoute);
app.use('/applications', applicationRoute);
app.use('/records', medicalRoutes);
app.use('/filters', filterRoutes);

mongoose    
    .connect(mongoDBURL)
    .then(() => {
        console.log(`App is connected to database`);
        app.listen(PORT, () => {
            console.log(`App is listening to port: ${PORT}`);
        })
    }).catch((error) => {
        console.log(error);
    })