# CSV Exporter Tests

## Overview

The CSV Exporter module has comprehensive test coverage with 29 test assertions covering all functionality.

## Running Tests

Due to Jest environment issues in the current setup, the exporter tests are run using a custom test runner:

```bash
npm run test:exporter
```

## Test Coverage

### 1. Basic CSV Creation
- Creates new CSV file with headers
- Properly writes data rows
- Maintains UTF-8 encoding for Hebrew text

### 2. Multiple Messages
- Exports multiple messages correctly
- Maintains proper row structure
- Preserves all message data

### 3. Link Handling
- Extracts and formats links correctly
- Handles multiple links per message
- Properly separates links with commas

### 4. Append Mode
- Appends to existing CSV without duplicate headers
- Maintains data integrity across append operations
- Creates new file if append mode used on non-existent file

### 5. Multi-line Content
- Properly escapes multi-line messages
- Preserves line breaks in CSV format
- Maintains content integrity

### 6. Special Characters
- Handles quotes in content
- Handles commas in content
- Maintains proper CSV escaping

### 7. Empty Content
- Handles empty message content gracefully
- Handles empty messages array
- Creates proper CSV structure even with no data

### 8. UTF-8 Encoding
- Maintains Hebrew character encoding
- Preserves special characters
- Ensures proper file encoding (UTF-8)

### 9. Error Handling
- Throws error for invalid file paths
- Handles edge cases gracefully

## Test Results

All 29 test assertions pass:
- ✓ File creation and structure
- ✓ Hebrew text preservation
- ✓ Multi-line content handling
- ✓ Append mode functionality
- ✓ Link formatting
- ✓ Special character escaping
- ✓ Error handling

## CSV Output Format

```csv
Date,Time,Sender,Reporter,Message,Has_Media,Links
15/01/2024,14:32:00,+972501234567,בן גולדפריינד,חדשות חשובות,false,""
```

## Implementation Details

- **Library**: csv-writer (v1.6.0)
- **Encoding**: UTF-8 (explicit)
- **Format**: Standard CSV with proper escaping
- **Append Mode**: Supported without header duplication
- **Multi-line**: Properly quoted and escaped
