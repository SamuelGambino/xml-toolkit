import express from "express"
import multer from "multer"
import path from "path"
import { convertController } from "./controllers/convertController"
import configController from "./controllers/configController"

const app = express();
const cors = require('cors');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/")
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.random()
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage: multer.memoryStorage(), 
  limits: { fileSize: 10 * 1024 * 1024 } 
})

// const allowedOrigins = [
//   "http://localhost:5173",
//   "http://localhost:8134"
// ];

// app.use(cors({
//   origin: function (origin, callback) {
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error("Not allowed by CORS"));
//     }
//   }
// }));

app.use(cors());
app.use("/api/config", configController);

app.post(
  "/api/convert",
  upload.single("file"),
  convertController
)

app.get("/api/config", configController);


try {
  app.listen(3000);
  console.log("Сервер запущен на порту 3000");
  console.log("http://localhost:3000/");
} catch (err) {
  console.error(err);
}