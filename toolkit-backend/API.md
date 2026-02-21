# Convert API Documentation

## Overview

Backend supports conversion through a universal object model.

Supported scenarios:
- Table (`csv/xlsx/xls`) + column mapping -> universal object (JSON).
- XML (`yml`, `delivery_club`, `google_feed`) -> universal object -> target format file.
- Table + column mapping -> universal object -> target format file.

## Endpoints

### GET `/api/config/convert`

Returns:
- `supportedColumnTypes` for table mapping.
- `supportedOutputFormats` for target format selection.

Supported output formats:
- `table` (CSV)
- `yml`
- `delivery_club`
- `google_feed`

### POST `/api/config/convert`

`multipart/form-data`:
- `file`: source file
- `sourceType`: `table | yml | delivery_club | google_feed` (optional, default `table`)
- `targetType`: `table | yml | delivery_club | google_feed` (optional)
- `mappings`: required for `sourceType=table`

#### Behavior

1. If `targetType` is omitted -> response is JSON universal object (`{ success, data }`).
2. If `targetType` is provided -> response is generated file (`Content-Disposition: attachment`).

## Universal Object

Root fields:
- `categories`
- `modifierGroups`

`ProductParameter` includes extended product fields:
- `weight`, `weightUnit`
- `price`, `oldPrice`, `priceUnit`
- `proteins`, `fats`, `carbohydrates`, `calories`, `energyValue`
