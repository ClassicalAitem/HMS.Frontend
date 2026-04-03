POST
Create Prescription

curl --location '/prescription' \
--data '{
    "patientId": "452b51c8-787c-49f9-aea5-2fa91d42fa08",
    "consultationId": "519b69be-6bea-4577-9bb6-95d8ada38074",
    "medications": [{
      "medicationType": "oral",
       "drugCode": "TAB_1003",
       "drugName": "amoxcillian",
       "dosage":  "12",
       "duration": "2 weeks",
       "frequency": "steady",
       "instructions": "hello world"
    }],
    "status": "pending"
}'


Example Response
{
  "success": true,
  "code": 201,
  "message": "Prescription created successfully",
  "data": {
    "patientId": "452b51c8-787c-49f9-aea5-2fa91d42fa08",
    "doctorId": "2492b52f-3457-464b-8814-dc9f4e74bf5f",
    "medications": [
      {
        "drugCode": "TAB_1003",
        "drugName": "amoxcillian",
        "dosage": "12",
        "frequency": "steady",
        "duration": "2 weeks",
        "instructions": "hello world"
      }
    ],
    "status": "pending",
    "_id": "68d959f01ecdd535241128a2",
    "createdAt": "2025-09-28T15:53:20.351Z",
    "updatedAt": "2025-09-28T15:53:20.351Z",
    "__v": 0
  }
}


========================================================================================================================

GET
Get all prescriptions

curl --location '/prescription' \
--data ''


Example Response
{
  "success": true,
  "code": 200,
  "message": "Operation Successful",
  "data": [
    {
      "_id": "696f61d039bfc79bbbb646f2",
      "patientId": "452b51c8-787c-49f9-aea5-2fa91d42fa08",
      "doctorId": "d3d5b2a5-1b0a-45f0-83b1-cbb8909a4d57",
      "medications": [
        {
          "medicationType": "injection",
          "drugCode": "TAB_1003",
          "drugName": "amoxcillian",
          "dosage": "12",
          "frequency": "steady",
          "duration": "2 weeks",
          "instructions": "hello world",
          "dosesGiven": 0
        }
      ],
      "status": "pending",
      "consultationId": "519b69be-6bea-4577-9bb6-95d8ada38074",
      "createdAt": "2026-01-20T11:06:56.634Z",
      "updatedAt": "2026-01-20T11:06:56.634Z",
      "__v": 0
    },
    {
      "_id": "696e375573baa2c7c0ed6ec3",
      "patientId": "fb1e3148-d266-4fd3-a2f4-e15889fd6011",
      "doctorId": "d3d5b2a5-1b0a-45f0-83b1-cbb8909a4d57",
      "medications": [
        {
          "medicationType": "oral",
          "drugName": "LA",
          "dosage": "200mg",
          "frequency": "Twice Daily",
          "duration": "14 Days",
          "dosesGiven": 0
        }
      ],
      "status": "pending",
      "createdAt": "2026-01-19T13:53:25.337Z",
      "updatedAt": "2026-01-19T13:53:25.337Z",
      "__v": 0
    },
    {
      "_id": "68d959f01ecdd535241128a2",
      "patientId": "452b51c8-787c-49f9-aea5-2fa91d42fa08",
      "doctorId": "2492b52f-3457-464b-8814-dc9f4e74bf5f",
      "medications": [
        {
          "medicationType": "injection",
          "dosesGiven": 0,
          "drugCode": "TAB_1003",
          "drugName": "amoxcillian",
          "dosage": "12",
          "frequency": "steady",
          "duration": "2 weeks",
          "instructions": "hello world"
        }
      ],
      "status": "completed",
      "createdAt": "2025-09-28T15:53:20.351Z",
      "updatedAt": "2025-12-14T12:34:06.581Z",
      "__v": 0
    },
    {
      "_id": "68d477b5ae3823efd10f7ccf",
      "patientId": "0119f2a1-f5d3-4bb8-832b-536dfe2ba43e",
      "doctorId": "0e875b7e-b0fb-4680-8381-154857a7c9bb",
      "medications": [
        {
          "medicationType": "injection",
          "dosesGiven": 0,
          "drugCode": "AMOX5000",
          "drugName": "Amoxicillin",
          "dosage": "5000mg",
          "frequency": "2 times daily",
          "duration": "9 days",
          "instructions": "Take after meals"
        }
      ],
      "status": "pending",
      "createdAt": "2025-09-24T22:59:01.974Z",
      "updatedAt": "2025-09-24T22:59:01.974Z",
      "__v": 0
    },
    {
      "_id": "68d4771aae3823efd10f7ccc",
      "patientId": "0119f2a1-f5d3-4bb8-832b-536dfe2ba43e",
      "doctorId": "0e875b7e-b0fb-4680-8381-154857a7c9bb",
      "medications": [
        {
          "medicationType": "oral",
          "drugCode": "AMOX500",
          "drugName": "Amoxicillin",
          "dosage": "500mg",
          "frequency": "3 times daily",
          "duration": "7 days",
          "instructions": "Take after meals",
          "dosesGiven": 3,
          "injectionStatus": "completed"
        }
      ],
      "status": "pending",
      "createdAt": "2025-09-24T22:56:26.042Z",
      "updatedAt": "2026-01-16T15:28:34.740Z",
      "__v": 0
    }
  ]
}


========================================================================================================================

GET
Get Prescription By Patient ID

curl --location '/prescription/getPrescriptionByPatientId/fb1e3148-d266-4fd3-a2f4-e15889fd6011' \
--data ''

Example Response
{
  "success": true,
  "code": 200,
  "message": "Operation Successful",
  "data": {
    "_id": "696e375573baa2c7c0ed6ec3",
    "patientId": "fb1e3148-d266-4fd3-a2f4-e15889fd6011",
    "doctorId": "d3d5b2a5-1b0a-45f0-83b1-cbb8909a4d57",
    "medications": [
      {
        "medicationType": "oral",
        "drugName": "LA",
        "dosage": "200mg",
        "frequency": "Twice Daily",
        "duration": "14 Days",
        "dosesGiven": 0
      }
    ],
    "status": "pending",
    "createdAt": "2026-01-19T13:53:25.337Z",
    "updatedAt": "2026-01-19T13:53:25.337Z",
    "__v": 0
  }
}



========================================================================================================================

GET
Get Prescription

curl --location '/prescription/68d959f01ecdd535241128a2' \
--data ''

Example Response
{
  "success": true,
  "code": 200,
  "message": "Operation Successful",
  "data": {
    "_id": "68d959f01ecdd535241128a2",
    "patientId": "452b51c8-787c-49f9-aea5-2fa91d42fa08",
    "doctorId": "2492b52f-3457-464b-8814-dc9f4e74bf5f",
    "medications": [
      {
        "drugCode": "TAB_1003",
        "drugName": "amoxcillian",
        "dosage": "12",
        "frequency": "steady",
        "duration": "2 weeks",
        "instructions": "hello world"
      }
    ],
    "status": "pending",
    "createdAt": "2025-09-28T15:53:20.351Z",
    "updatedAt": "2025-09-28T15:53:20.351Z",
    "__v": 0
  }
}

========================================================================================================================

PATCH
Update Prescription

curl --location --request PATCH '/prescription/68d959f01ecdd535241128a2' \
--data '{
    "status": "completed"
}'

Example Response
{
  "success": true,
  "code": 200,
  "message": "Prescription updated successfully",
  "data": {
    "_id": "68d959f01ecdd535241128a2",
    "patientId": "452b51c8-787c-49f9-aea5-2fa91d42fa08",
    "doctorId": "2492b52f-3457-464b-8814-dc9f4e74bf5f",
    "medications": [
      {
        "drugCode": "TAB_1003",
        "drugName": "amoxcillian",
        "dosage": "12",
        "frequency": "steady",
        "duration": "2 weeks",
        "instructions": "hello world"
      }
    ],
    "status": "completed",
    "createdAt": "2025-09-28T15:53:20.351Z",
    "updatedAt": "2025-09-29T10:36:40.665Z",
    "__v": 0
  }
}