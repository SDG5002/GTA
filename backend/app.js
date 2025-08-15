import express from "express";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes.js";
import cors from "cors";
import ProfRoutes from "./routes/ProfRoutes.js";
import StudentRoutes from "./routes/StudentRoute.js";
import { startUserCleanupJob } from "./cronJobs/userCleanupJob.js";



dotenv.config();

const app = express();
const uri = process.env.MONGO_URL;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

mongoose.connect(uri)
  .then(() => console.log("DB Connected"))
  .catch((err) => console.error("DB Connection Error:", err));

app.use(cors({
  origin: process.env.FRONTEND_URL, 
  credentials: true               
}));


startUserCleanupJob();

app.use("/user", userRoutes);
app.use("/professor", ProfRoutes);
app.use("/student", StudentRoutes);

app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({ error: err.message });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
