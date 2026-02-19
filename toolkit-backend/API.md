# Convert API Documentation

## Overview

The Convert API provides endpoints for parsing XML/XLSX/CSV files containing product tables and converting them into a universal object format. The API supports streaming for large files (>500MB).

## Endpoints

### GET `/api/config/convert`

Returns the list of supported column types that can be used for mapping table columns.

**Response:**
```json
{
  "supportedColumnTypes": [
    {
      "value": "Category",
      "label": "Category",
      "description": "Product category name"
    },
    {
      "value": "ProductName",
      "label": "Product Name",
      "description": "Name of the product"
    },
    // ... more column types
  ]
}
```

**Supported Column Types:**
- `Category` - Product category name
- `CategoryParent` - Parent category name (for nested categories)
- `ProductName` - Name of the product
- `ProductDescription` - Description of the product
- `ProductImage` - URL or path to product image
- `ModifierGroupName` - Name of the modifier group
- `ModifierGroupType` - Type of the modifier group
- `ModifierGroupMaxSelect` - Maximum number of modifiers that can be selected
- `ModifierGroupMinSelect` - Minimum number of modifiers that must be selected
- `ModifierName` - Name of the modifier
- `ModifierPrice` - Price of the modifier
- `ProductParameterId` - ID of the product parameter
- `ProductParameterWeight` - Weight value for the product parameter
- `ProductParameterPrice` - Price for the product parameter

### POST `/api/config/convert`

Converts an uploaded file to the universal product format based on column mappings.

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  - `file`: The file to upload (XML/XLSX/XLS/CSV)
  - `mappings`: JSON string containing column mappings

**Mappings Format:**
```json
{
  "mappings": [
    {
      "columnIndex": 0,
      "columnName": "Category",
      "columnType": "Category"
    },
    {
      "columnIndex": 1,
      "columnName": "Product Name",
      "columnType": "ProductName"
    }
    // ... more mappings
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "modifierGroups": [
      {
        "id": "mg_1234567890_abc123_1",
        "name": "Size",
        "type": "single",
        "maxSelect": 1,
        "minSelect": 1,
        "modifiers": [
          {
            "id": "mod_1234567890_xyz789_2",
            "name": "Small",
            "price": 0
          }
        ]
      }
    ],
    "categories": [
      {
        "id": "cat_1234567890_def456_3",
        "name": "Burgers",
        "parentId": undefined
      }
    ],
    "products": [
      {
        "id": "prod_1234567890_ghi789_4",
        "name": "Classic Burger",
        "description": "A classic burger",
        "image": "https://example.com/burger.jpg",
        "modifers": ["mg_1234567890_abc123_1"],
        "parameters": [
          {
            "id": "param1",
            "weight": 200,
            "price": 10.99
          }
        ]
      }
    ]
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message here"
}
```

## Universal Object Format

The API converts input files into a standardized format:

### ModifierGroup
- `id` (string): Unique identifier
- `name` (string): Name of the modifier group
- `type` (string, optional): Type of modifier group
- `maxSelect` (number, optional): Maximum number of modifiers that can be selected
- `minSelect` (number, optional): Minimum number of modifiers that must be selected
- `modifiers` (Modifier[]): Array of modifiers in this group

### Modifier
- `id` (string): Unique identifier
- `name` (string): Name of the modifier
- `price` (number): Price of the modifier

### Category
- `id` (string): Unique identifier
- `name` (string): Name of the category
- `parentId` (string, optional): ID of parent category for nested categories

### Product
- `id` (string): Unique identifier
- `name` (string): Name of the product
- `description` (string, optional): Description of the product
- `image` (string, optional): URL to product image
- `modifers` (string[]): Array of modifier group IDs
- `parameters` (ProductParameter[]): Array of product price parameters

### ProductParameter
- `id` (string): Unique identifier
- `weight` (number): Weight value
- `price` (number): Price value

## File Format Support

- **CSV**: Comma-separated values files
- **XLSX**: Excel files (Office Open XML format)
- **XLS**: Legacy Excel files
- **XML**: XML files (generic structure detection)

## Streaming Support

The API uses streaming for file processing, which allows handling large files (>500MB) efficiently. Files are processed in chunks to minimize memory usage.

## Error Handling

The API returns appropriate HTTP status codes:
- `200`: Success
- `400`: Bad Request (invalid mappings, missing file, etc.)
- `500`: Internal Server Error

All error responses include a JSON body with `success: false` and an `error` field containing the error message.
