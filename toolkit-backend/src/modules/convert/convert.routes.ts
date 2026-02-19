/**
 * Convert routes
 */

import { Router } from 'express';
import { ConvertController } from './convert.controller';

const router = Router();
const convertController = new ConvertController();

// GET /api/config/convert - Get supported column types
router.get('/config/convert', convertController.getConfig);

// POST /api/config/convert - Convert file with mappings
router.post(
  '/config/convert',
  convertController.uploadMiddleware,
  convertController.convert
);

export default router;
