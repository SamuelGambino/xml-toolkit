import { Router } from "express"
import fs from "fs/promises"
import path from "path"

const router = Router();

const CONFIG_FILE_PATH = path.join(__dirname, "../services/convert/convertConfig.json");

router.get('/convert', async (req, res) => {
  try {
    const actualConfig = await fs.readFile(CONFIG_FILE_PATH, "utf-8");

    const jsonConfig = JSON.parse(actualConfig);

    res.status(200).json(jsonConfig);
  } catch (error) {
    console.log("Ошибка чтения конфига");

    if((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return res.status(404).json({ error: 'Configuration file not found' });
    }

    if(error instanceof SyntaxError) {
      return res.status(500).json({ error: 'Invalid JSON format in configuration file' });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
