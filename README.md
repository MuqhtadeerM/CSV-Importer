# GrowEasy AI CSV Lead Importer

An AI-powered CSV import application that transforms lead data from different CSV formats into a standardized CRM schema.

The application allows users to upload CSV files with arbitrary column names, preview the raw data, and use AI to intelligently map each row into the GrowEasy CRM lead structure.

## Features

* Upload CSV files through a web interface
* Drag-and-drop file selection
* CSV file validation
* Maximum upload size of 10 MB
* Preview CSV headers and rows before importing
* Supports CSV files with different column names and structures
* AI-powered field mapping using Google Gemini
* Batch processing for large CSV files
* Configurable concurrency for AI requests
* Automatic retry handling for failed AI batches
* Validation and sanitization of AI-generated data
* Skips records without a usable email address or phone number
* Displays imported and skipped records
* Rate limiting for AI-powered import requests
* Centralized backend error handling
* CORS configuration for local and deployed frontends
* Responsive Next.js frontend
* Production-ready deployment architecture

---

## Tech Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* Papa Parse

### Backend

* Node.js
* Express.js
* Multer
* csv-parse
* Google Gemini API
* p-limit
* express-rate-limit
* Helmet
* CORS
* dotenv

### Deployment

* Frontend: Vercel
* Backend: Render

---

## Project Architecture

```text
CSV-Importer/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   └── importController.js
│   │   ├── middleware/
│   │   │   └── errorHandler.js
│   │   ├── routes/
│   │   │   └── importRoutes.js
│   │   ├── services/
│   │   │   ├── aiService.js
│   │   │   └── csvService.js
│   │   ├── utils/
│   │   │   └── batchProcessor.js
│   │   └── server.js
│   ├── .env.example
│   ├── package.json
│   └── package-lock.json
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── favicon.ico
    │   │   ├── globals.css
    │   │   ├── layout.tsx
    │   │   └── page.tsx
    │   ├── components/
    │   │   ├── CsvPreviewTable.tsx
    │   │   ├── FileUpload.tsx
    │   │   ├── ResultsTable.tsx
    │   │   └── StepIndicator.tsx
    │   └── lib/
    │       ├── api.ts
    │       └── types.ts
    ├── next.config.js
    ├── postcss.config.js
    ├── tailwind.config.ts
    ├── tsconfig.json
    └── package.json
```

---

## How the Application Works

The application follows a three-step workflow:

```text
Upload CSV
    ↓
Preview Raw Data
    ↓
Confirm Import
    ↓
AI Field Mapping
    ↓
Validation and Sanitization
    ↓
Imported / Skipped Results
```

### Step 1: Upload

The user selects or drags and drops a CSV file into the application.

The backend uses Multer with in-memory storage to receive the file.

Only CSV files are accepted, and the maximum file size is 10 MB.

### Step 2: Preview

The frontend sends the selected file to:

```text
POST /api/leads/preview
```

The backend parses the CSV and returns:

* Original filename
* Detected headers
* Total number of rows
* Up to 50 preview rows

No AI request is made during preview.

This allows the user to verify the CSV before starting an AI-powered import.

### Step 3: AI Import

After confirmation, the frontend sends the CSV to:

```text
POST /api/leads/import
```

The backend:

1. Parses the CSV.
2. Validates the maximum row count.
3. Assigns a row index to every record.
4. Splits records into batches.
5. Processes batches concurrently.
6. Sends each batch to Google Gemini.
7. Maps arbitrary CSV fields into the CRM schema.
8. Validates and sanitizes the AI response.
9. Separates imported and skipped records.
10. Returns the final import summary.

---

## CRM Target Schema

The AI maps incoming CSV data into the following standardized CRM structure:

```text
created_at
name
email
country_code
mobile_without_country_code
company
city
state
country
lead_owner
crm_status
crm_note
data_source
possession_time
description
```

Example output:

```json
{
  "created_at": "2026-07-10",
  "name": "Rahul Sharma",
  "email": "rahul@example.com",
  "country_code": "+91",
  "mobile_without_country_code": "9876543210",
  "company": "TechNova",
  "city": "Bengaluru",
  "state": "Karnataka",
  "country": "India",
  "lead_owner": "",
  "crm_status": "GOOD_LEAD_FOLLOW_UP",
  "crm_note": "",
  "data_source": "",
  "possession_time": "",
  "description": ""
}
```

---

## Supported CRM Status Values

The AI can only return one of the following values:

```text
GOOD_LEAD_FOLLOW_UP
DID_NOT_CONNECT
BAD_LEAD
SALE_DONE
```

If the source data does not provide enough information to determine the status, the value is returned as an empty string.

---

## Supported Data Source Values

The application currently supports the following predefined data-source values:

```text
leads_on_demand
meridian_tower
eden_park
varah_swamy
sarjapur_plots
```

If the source cannot be determined confidently, the value is returned as an empty string.

---

## Intelligent CSV Mapping

The application does not require fixed CSV column names.

For example, all of the following headers may represent a phone number:

```text
Phone
Mobile
Mobile Number
Contact No
Contact Number
WhatsApp Number
```

Similarly, these fields may represent a person's name:

```text
Name
Full Name
Lead Name
Customer
Customer Name
```

The AI analyzes the column names and record values to map the source data into the standardized CRM schema.

---

## Record Skip Rule

A record is skipped only when it contains neither:

* A usable email address
* A usable phone number

This rule is enforced by the backend even if the AI returns an incorrect skip decision.

Example skipped result:

```json
{
  "row_index": 4,
  "reason": "No email or mobile number found in record.",
  "raw": {
    "Name": "Example Lead",
    "Company": "Example Company"
  }
}
```

---

# Backend Setup

## Prerequisites

Make sure the following are installed:

* Node.js
* npm
* Git

Check your versions:

```bash
node --version
npm --version
git --version
```

---

## Install Backend Dependencies

Navigate to the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

---

## Backend Environment Variables

Create a `.env` file inside the `backend` directory.

Example:

```env
PORT=8080

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=your_supported_gemini_model

AI_BATCH_SIZE=20
AI_BATCH_CONCURRENCY=3
AI_BATCH_MAX_RETRIES=2

MAX_CSV_ROWS=5000

FRONTEND_URL=http://localhost:3000
```

Do not commit the real `.env` file to GitHub.

Add it to `.gitignore`:

```text
.env
node_modules/
```

A safe `.env.example` can be committed:

```env
PORT=8080

GEMINI_API_KEY=
GEMINI_MODEL=

AI_BATCH_SIZE=20
AI_BATCH_CONCURRENCY=3
AI_BATCH_MAX_RETRIES=2

MAX_CSV_ROWS=5000

FRONTEND_URL=http://localhost:3000
```

---

## Run the Backend

Development mode:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

The backend runs locally at:

```text
http://localhost:8080
```

---

# API Endpoints

## Health Check

### Request

```text
GET /api/health
```

Local URL:

```text
http://localhost:8080/api/health
```

### Example Response

```json
{
  "status": "ok",
  "message": "GrowEasy backend is running"
}
```

---

## Preview CSV

### Request

```text
POST /api/leads/preview
```

Local URL:

```text
http://localhost:8080/api/leads/preview
```

Request body:

```text
multipart/form-data
```

File field:

```text
file
```

Example configuration:

| Key  | Type | Value     |
| ---- | ---- | --------- |
| file | File | leads.csv |

### Example Response

```json
{
  "filename": "leads.csv",
  "headers": [
    "Name",
    "Email",
    "Phone",
    "Company"
  ],
  "totalRows": 100,
  "preview": [
    {
      "Name": "John Doe",
      "Email": "john@example.com",
      "Phone": "9876543210",
      "Company": "Example Inc"
    }
  ]
}
```

---

## Import CSV

### Request

```text
POST /api/leads/import
```

Local URL:

```text
http://localhost:8080/api/leads/import
```

Request body:

```text
multipart/form-data
```

File field:

```text
file
```

### Example Response

```json
{
  "sourceHeaders": [
    "Name",
    "Email",
    "Phone"
  ],
  "totalRows": 100,
  "totalImported": 95,
  "totalSkipped": 5,
  "failedBatches": 0,
  "imported": [],
  "skipped": []
}
```

---

# Frontend Setup

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

---

## Frontend Environment Variables

Create:

```text
frontend/.env.local
```

Add:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

Do not place the Gemini API key in the frontend.

The Gemini API key must remain private and should only exist in the backend environment.

---

## Run the Frontend

```bash
npm run dev
```

The frontend runs at:

```text
http://localhost:3000
```

---

## Production Build

Before deployment, run:

```bash
npm run lint
npm run build
```

Start the production build locally:

```bash
npm start
```

---

# Local Development

Run the backend in one terminal:

```bash
cd backend
npm run dev
```

Run the frontend in another terminal:

```bash
cd frontend
npm run dev
```

Local architecture:

```text
Browser
   │
   ▼
Next.js Frontend
http://localhost:3000
   │
   ▼
Express Backend
http://localhost:8080
   │
   ▼
Google Gemini API
```

---

# Testing with Postman

## Preview Endpoint

Method:

```text
POST
```

URL:

```text
http://localhost:8080/api/leads/preview
```

Go to:

```text
Body → form-data
```

Add:

| Key  | Type | Value     |
| ---- | ---- | --------- |
| file | File | leads.csv |

Do not manually set the `Content-Type` header.

Postman automatically generates the correct multipart boundary.

---

## Import Endpoint

Method:

```text
POST
```

URL:

```text
http://localhost:8080/api/leads/import
```

Body:

```text
form-data
```

Add:

| Key  | Type | Value     |
| ---- | ---- | --------- |
| file | File | leads.csv |

The field name must be exactly:

```text
file
```

Otherwise, Multer may return:

```text
Unexpected field
```

---

# Security Features

The backend includes several safeguards.

## Helmet

Helmet adds security-related HTTP headers.

## CORS

The backend restricts browser access to approved frontend origins.

For local development:

```text
http://localhost:3000
```

For production:

```text
https://your-frontend.vercel.app
```

## Rate Limiting

The AI import endpoint is rate-limited to protect against excessive API usage.

Default configuration:

```text
30 requests per IP every 15 minutes
```

## File Size Limit

Maximum CSV upload size:

```text
10 MB
```

## Maximum CSV Rows

Default maximum:

```text
5000 rows
```

This can be changed using:

```env
MAX_CSV_ROWS=5000
```

## AI Output Validation

AI-generated records are validated before being returned to the client.

The backend:

* Ensures all CRM fields exist
* Converts invalid values to empty strings
* Rejects invalid CRM status values
* Rejects invalid data-source values
* Removes internal newlines
* Validates dates
* Enforces the email-or-phone skip rule

---

# Batch Processing

Large CSV files are divided into smaller batches before being sent to the AI provider.

Default configuration:

```env
AI_BATCH_SIZE=20
AI_BATCH_CONCURRENCY=3
AI_BATCH_MAX_RETRIES=2
```

This means:

* 20 records per AI batch
* Up to 3 AI batches processed concurrently
* Failed batches retried up to 2 times

The implementation uses `p-limit` to control concurrency.

---

# Error Handling

The backend uses centralized error handling.

Examples include:

* Invalid CSV file
* Missing uploaded file
* Unsupported file type
* File too large
* Too many CSV rows
* AI provider errors
* Invalid AI JSON responses
* Rate-limit errors
* Unknown routes

Example error response:

```json
{
  "error": "No CSV file was uploaded."
}
```

---

# Deployment

## Backend Deployment on Render

Deploy the `backend` directory as a Node.js web service.

Recommended configuration:

```text
Root Directory: backend
Build Command: npm install
Start Command: npm start
```

Add the required environment variables in the Render dashboard:

```env
GEMINI_API_KEY=your_production_api_key
GEMINI_MODEL=your_supported_model

AI_BATCH_SIZE=20
AI_BATCH_CONCURRENCY=3
AI_BATCH_MAX_RETRIES=2

MAX_CSV_ROWS=5000

FRONTEND_URL=https://your-frontend.vercel.app
```

Render provides the `PORT` environment variable automatically.

The Express server should listen using:

```js
const PORT = process.env.PORT || 8080;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on port ${PORT}`);
});
```

After deployment, test:

```text
https://your-backend.onrender.com/api/health
```

---

## Frontend Deployment on Vercel

Import the GitHub repository into Vercel.

If the frontend and backend are in the same repository, set:

```text
Root Directory: frontend
```

Add:

```env
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

Then deploy.

After the Vercel deployment is complete, add the final Vercel URL to the backend's allowed CORS origins.

Example:

```env
FRONTEND_URL=https://your-project.vercel.app
```

Redeploy or restart the Render backend after changing environment variables.

---

# Production Architecture

```text
User
  │
  ▼
Next.js Frontend
Vercel
  │
  │ HTTPS API Requests
  ▼
Node.js + Express Backend
Render
  │
  │ AI Mapping Requests
  ▼
Google Gemini API
```

---

# Troubleshooting

## CORS Error

Example:

```text
No 'Access-Control-Allow-Origin' header is present
```

Make sure the backend allows the frontend origin.

For local development:

```text
http://localhost:3000
```

For production:

```text
https://your-project.vercel.app
```

After changing Render environment variables, redeploy or restart the backend.

---

## Multer: Unexpected Field

Make sure the multipart file field is exactly:

```text
file
```

The backend expects:

```js
upload.single("file")
```

---

## Field Name Missing

Make sure the request uses:

```text
multipart/form-data
```

Do not manually set the multipart `Content-Type` header when using `FormData`.

The browser or Postman should generate the multipart boundary automatically.

---

## CSV File Not Found

Make sure the global stylesheet filename and imports match exactly:

```text
src/app/globals.css
```

and:

```ts
import "./globals.css";
```

---

## Gemini Model Error

If the configured Gemini model is unavailable:

1. Verify the model identifier supported by the Google Gemini API.
2. Update the `GEMINI_MODEL` environment variable.
3. Restart the local backend or redeploy the Render service.

Do not hardcode API keys in source code.

---

# Example CSV

```csv
Name,Email,Phone,Company,City,Country
John Doe,john@example.com,+1-555-123-4567,Acme Inc,New York,USA
Rahul Sharma,rahul@example.com,+91-9876543210,TechNova,Bengaluru,India
Priya Reddy,priya@example.com,+91-9988776655,CloudSoft,Hyderabad,India
```

The application can also process CSV files with different header names because the AI mapping layer interprets the source structure dynamically.

---

# Important Notes

* The preview endpoint does not call the AI provider.
* The import endpoint calls the AI provider and may incur API usage or quota consumption.
* AI output is validated by the backend before being returned.
* The current implementation transforms and returns CRM-ready records.
* Database persistence can be added as a future enhancement if required.
* Never expose `GEMINI_API_KEY` through a `NEXT_PUBLIC_` environment variable.

---

# Future Improvements

Possible future enhancements include:

* Database persistence
* User authentication
* Import history
* CSV export of transformed records
* Manual field-mapping override
* Import progress tracking
* Background job processing
* Duplicate lead detection
* CRM API integration
* WebSocket or Server-Sent Events progress updates
* Advanced validation rules
* Multi-tenant support

---

# License

This project is intended for educational, demonstration, and development purposes.

---

## Author - Muqhtadeer
Developed as a full-stack AI-powered CSV-to-CRM lead import solution using Next.js, Node.js, Express, and Google Gemini.
