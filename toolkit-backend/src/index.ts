import express from "express"
import multer from "multer"
import path from "path"
import { convertController } from "./controllers/convertController"

const app = express()

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

app.post(
  "/api/convert",
  upload.single("file"),
  convertController
)

app.listen(3000)
