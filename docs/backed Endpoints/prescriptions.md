POST
Create Prescription

curl --location '/prescription' \
--data '{
    "patientId": "452b51c8-787c-49f9-aea5-2fa91d42fa08",
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
    },
    {
      "_id": "68d477b5ae3823efd10f7ccf",
      "patientId": "0119f2a1-f5d3-4bb8-832b-536dfe2ba43e",
      "doctorId": "0e875b7e-b0fb-4680-8381-154857a7c9bb",
      "medications": [
        {
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
          "drugCode": "AMOX500",
          "drugName": "Amoxicillin",
          "dosage": "500mg",
          "frequency": "3 times daily",
          "duration": "7 days",
          "instructions": "Take after meals"
        }
      ],
      "status": "completed",
      "createdAt": "2025-09-24T22:56:26.042Z",
      "updatedAt": "2025-09-24T23:07:19.916Z",
      "__v": 0
    }
  ]
}


========================================================================================================================

GET
Get Prescription By Patient ID

curl --location '/prescription/getPrescriptionByPatientId/452b51c8-787c-49f9-aea5-2fa91d42fa08' \
--data ''

Example Response
{
  "success": true,
  "code": 200,
  "message": "Operation Successful",
  "data": {
    "_id": "68d4771aae3823efd10f7ccc",
    "patientId": "0119f2a1-f5d3-4bb8-832b-536dfe2ba43e",
    "doctorId": "0e875b7e-b0fb-4680-8381-154857a7c9bb",
    "medications": [
      {
        "medicationType": "injection",
        "dosesGiven": 0,
        "drugCode": "AMOX500",
        "drugName": "Amoxicillin",
        "dosage": "500mg",
        "frequency": "3 times daily",
        "duration": "7 days",
        "instructions": "Take after meals"
      }
    ],
    "status": "completed",
    "createdAt": "2025-09-24T22:56:26.042Z",
    "updatedAt": "2025-09-24T23:07:19.916Z",
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