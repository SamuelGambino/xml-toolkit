/**
 * Validation middleware
 */

import { Request, Response, NextFunction } from 'express';
import { ConvertRequestDto } from '../../modules/convert/convert.dto';

/**
 * Validates convert request body
 */
export function validateConvertRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const body = req.body as ConvertRequestDto;

  if (!body.mappings || !Array.isArray(body.mappings.columns)) {
    res.status(400).json({
      success: false,
      error: 'Invalid mappings: columns must be an array',
    });
    return;
  }


  if (body.mappings.characteristic && !Array.isArray(body.mappings.characteristic)) {
    res.status(400).json({
      success: false,
      error: 'Invalid mappings: characteristic must be an array',
    });
    return;
  }

  // Validate each mapping
  for (const mapping of body.mappings.columns) {
    if (
      typeof mapping.columnIndex !== 'number' ||
      typeof mapping.columnName !== 'string' ||
      typeof mapping.columnType !== 'string'
    ) {
      res.status(400).json({
        success: false,
        error: 'Invalid mapping: must have columnIndex (number), columnName (string), and columnType (string)',
      });
      return;
    }
  }

  next();
}
