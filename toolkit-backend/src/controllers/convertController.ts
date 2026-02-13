import { Request, Response } from "express"
import { convertService } from "../services/convert/convertService"

export const convertController = async (req: Request, res: Response) => {
  try {
    const file = req.file
    const configRaw = req.body.config

    if (!file || !configRaw) {
      return res.status(400).json({ error: `${ file ? "" : "File required "}${ configRaw ? "" : "Config required "}` })
    }

    const config = JSON.parse(configRaw)

    const resultBuffer = await convertService(file, config)

    res.setHeader("Content-Disposition", "attachment; filename=result.xml")
    res.setHeader("Content-Type", "application/xml")

    res.send(resultBuffer)

  } catch (error) {
    res.status(500).json({ error: "Conversion failed" })
  }
}
