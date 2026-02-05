POST
Create Investigation request

curl --location '/investigation' \
--data '{
    "patientId": "452b51c8-787c-49f9-aea5-2fa91d42fa08",
    "type": "lab",
    "tests": [{
       "code": "LAB-SURGERY",
       "name": "Eye",
       "notes": "hello world"
    }],
    "priority": "urgent",
    "status": "in_progress"
}'

Example Response
{
  "success": true,
  "code": 201,
  "message": "Investigation Request created successfully",
  "data": {
    "patientId": "452b51c8-787c-49f9-aea5-2fa91d42fa08",
    "doctorId": "2492b52f-3457-464b-8814-dc9f4e74bf5f",
    "type": "lab",
    "tests": [
      {
        "code": "LAB-SURGERY",
        "name": "Eye",
        "notes": "hello world"
      }
    ],
    "priority": "urgent",
    "status": "in_progress",
    "_id": "68d952971ecdd5352411289c",
    "createdAt": "2025-09-28T15:21:59.713Z",
    "updatedAt": "2025-09-28T15:21:59.713Z",
    "__v": 0
  }
}

===================================================================================================================================================

GET
Get all Investigation request

curl --location '/investigation' \
--data ''

Example Response
{
  "success": true,
  "code": 200,
  "message": "Operation Successful",
  "data": [
    {
      "_id": "68d952971ecdd5352411289c",
      "patientId": "452b51c8-787c-49f9-aea5-2fa91d42fa08",
      "doctorId": "2492b52f-3457-464b-8814-dc9f4e74bf5f",
      "type": "lab",
      "tests": [
        {
          "code": "LAB-SURGERY",
          "name": "Eye",
          "notes": "hello world"
        }
      ],
      "priority": "urgent",
      "status": "in_progress",
      "createdAt": "2025-09-28T15:21:59.713Z",
      "updatedAt": "2025-09-28T15:21:59.713Z",
      "__v": 0
    },
    {
      "_id": "68d3c7e1bd25d6bf7b7f79ac",
      "patientId": "0119f2a1-f5d3-4bb8-832b-536dfe2ba43e",
      "doctorId": "0e875b7e-b0fb-4680-8381-154857a7c9bb",
      "type": "lab",
      "tests": [
        {
          "code": "CBC",
          "name": "Complete Blood Count",
          "notes": "Check for infection"
        },
        {
          "code": "UA",
          "name": "Urinalysis"
        }
      ],
      "priority": "normal",
      "status": "in_progress",
      "createdAt": "2025-09-24T10:28:49.236Z",
      "updatedAt": "2025-09-24T13:13:23.187Z",
      "__v": 0
    },
    {
      "_id": "68d2afe371e431d94b4b7515",
      "patientId": "452b51c8-787c-49f9-aea5-2fa91d42fa08",
      "doctorId": "0e875b7e-b0fb-4680-8381-154857a7c9bb",
      "type": "lab",
      "tests": [
        {
          "code": "LAB-SURGERY",
          "name": "Eye",
          "notes": "hello world"
        }
      ],
      "priority": "urgent",
      "status": "in_progress",
      "createdAt": "2025-09-23T14:34:11.428Z",
      "updatedAt": "2025-09-23T14:34:11.428Z",
      "__v": 0
    }
  ]
}

===================================================================================================================================================

GET
Get Investigation request

curl --location '/investigation/68d952971ecdd5352411289c' \
--data ''

Example Response
{
  "success": true,
  "code": 200,
  "message": "Operation Successful",
  "data": {
    "_id": "68d952971ecdd5352411289c",
    "patientId": "452b51c8-787c-49f9-aea5-2fa91d42fa08",
    "doctorId": "2492b52f-3457-464b-8814-dc9f4e74bf5f",
    "type": "lab",
    "tests": [
      {
        "code": "LAB-SURGERY",
        "name": "Eye",
        "notes": "hello world"
      }
    ],
    "priority": "urgent",
    "status": "in_progress",
    "createdAt": "2025-09-28T15:21:59.713Z",
    "updatedAt": "2025-09-28T15:21:59.713Z",
    "__v": 0
  }
}

===================================================================================================================================================

GET
Get Investigation Request By PatientID

curl --location '/investigation/getInvestigationRequestByPatientId/452b51c8-787c-49f9-aea5-2fa91d42fa08' \
--data ''

Example Response
{
  "success": true,
  "code": 200,
  "message": "Investigation Request retrieved successfully",
  "data": {
    "_id": "68d2afe371e431d94b4b7515",
    "patientId": "452b51c8-787c-49f9-aea5-2fa91d42fa08",
    "doctorId": "0e875b7e-b0fb-4680-8381-154857a7c9bb",
    "type": "lab",
    "tests": [
      {
        "code": "LAB-SURGERY",
        "name": "Eye",
        "notes": "hello world"
      }
    ],
    "priority": "urgent",
    "status": "in_progress",
    "createdAt": "2025-09-23T14:34:11.428Z",
    "updatedAt": "2025-09-23T14:34:11.428Z",
    "__v": 0
  }
}

===================================================================================================================================================
===================================================================================================================================================

GET
Get Investigation Request By ConsultationID

curl --location '/investigation?consultationId=6c7fe29e-62d9-4f24-afbe-abb5d92e28f5' \
--data ''

Example Response
{
  "success": true,
  "code": 200,
  "message": "Investigation Requests fetched successfully",
  "data": [
    {
      "_id": "6971e1ab0802e9e31897e3d5",
      "patientId": "fb1e3148-d266-4fd3-a2f4-e15889fd6011",
      "doctorId": "d3d5b2a5-1b0a-45f0-83b1-cbb8909a4d57",
      "type": "lab",
      "tests": [
        {
          "code": "LAB-SURGERY001",
          "name": "Blood Test Malaria",
          "notes": "tewttttt"
        }
      ],
      "priority": "urgent",
      "status": "in_progress",
      "consultationId": "6c7fe29e-62d9-4f24-afbe-abb5d92e28f5",
      "createdAt": "2026-01-22T08:37:00.001Z",
      "updatedAt": "2026-01-22T08:37:00.001Z",
      "__v": 0
    }
  ]
}

===================================================================================================================================================
PATCH
Update Investigation Request

curl --location --request PATCH '/investigation/68d952971ecdd5352411289c' \
--data '{
    "status": "completed"
}'

Example Response
{
  "success": true,
  "code": 200,
  "message": "Investigation Request updated successfully",
  "data": {
    "_id": "68d952971ecdd5352411289c",
    "patientId": "452b51c8-787c-49f9-aea5-2fa91d42fa08",
    "doctorId": "2492b52f-3457-464b-8814-dc9f4e74bf5f",
    "type": "lab",
    "tests": [
      {
        "code": "LAB-SURGERY",
        "name": "Eye",
        "notes": "hello world"
      }
    ],
    "priority": "urgent",
    "status": "completed",
    "createdAt": "2025-09-28T15:21:59.713Z",
    "updatedAt": "2025-09-28T15:29:20.288Z",
    "__v": 0
  }
}