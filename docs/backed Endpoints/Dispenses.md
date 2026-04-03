GET
Get All Dispenses

curl --location --request GET '/dispense' \
--data '{
    "status": "dispensed"
}'

Example Response

{
  "success": true,
  "code": 200,
  "message": "Operation Successful",
  "data": [
    {
      "_id": "68da68fd49783786a0493d9b",
      "prescription": {
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
      },
      "pharmacistId": "2492b52f-3457-464b-8814-dc9f4e74bf5f",
      "items": [
        {
          "drugName": "amoxicillan",
          "quantity": 20,
          "batch": "5637382b637",
          "expiry": "2027-04-19T00:00:00.000Z"
        }
      ],
      "status": "partial",
      "dispensedAt": "2025-09-29T10:35:39.159Z",
      "createdAt": "2025-09-29T11:09:49.248Z",
      "updatedAt": "2025-09-29T11:12:11.564Z",
      "__v": 0
    },
    {
      "_id": "68da668b49783786a0493d98",
      "prescription": {
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
      },
      "pharmacistId": "2492b52f-3457-464b-8814-dc9f4e74bf5f",
      "items": [
        {
          "drugName": "amoxicillan",
          "quantity": 20,
          "batch": "5637382b637",
          "expiry": "2027-04-19T00:00:00.000Z"
        }
      ],
      "status": "dispensed",
      "dispensedAt": "2025-09-29T10:35:39.159Z",
      "createdAt": "2025-09-29T10:59:23.774Z",
      "updatedAt": "2025-09-29T10:59:23.774Z",
      "__v": 0
    }
  ]
}

=================================================================================================

GET
Get Dispense

curl --location --request GET '/dispense/68da68fd49783786a0493d9b' \
--data '{
    "status": "dispensed"
}'

Example Response

{
  "success": true,
  "code": 200,
  "message": "Operation Successful",
  "data": {
    "_id": "68da68fd49783786a0493d9b",
    "prescription": {
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
    },
    "pharmacistId": "2492b52f-3457-464b-8814-dc9f4e74bf5f",
    "items": [
      {
        "drugName": "amoxicillan",
        "quantity": 20,
        "batch": "5637382b637",
        "expiry": "2027-04-19T00:00:00.000Z"
      }
    ],
    "status": "partial",
    "dispensedAt": "2025-09-29T10:35:39.159Z",
    "createdAt": "2025-09-29T11:09:49.248Z",
    "updatedAt": "2025-09-29T11:12:11.564Z",
    "__v": 0
  }
}

=================================================================================================

POST
Create Dispense

curl --location '/dispense/68d959f01ecdd535241128a2' \
--data '{
    "items": [{
       "quantity": "20",
       "drugName": "amoxicillan",
       "batch": "5637382b637",
       "expiry": "2027-04-19"
    }],
    "status": "dispensed"
}'

Example Response
{
  "success": true,
  "code": 201,
  "message": "Dispense record created successfully",
  "data": {
    "prescription": "68d959f01ecdd535241128a2",
    "pharmacistId": "2492b52f-3457-464b-8814-dc9f4e74bf5f",
    "items": [
      {
        "drugName": "amoxicillan",
        "quantity": 20,
        "batch": "5637382b637",
        "expiry": "2027-04-19T00:00:00.000Z"
      }
    ],
    "status": "dispensed",
    "dispensedAt": "2025-09-29T10:35:39.159Z",
    "_id": "68da668b49783786a0493d98",
    "createdAt": "2025-09-29T10:59:23.774Z",
    "updatedAt": "2025-09-29T10:59:23.774Z",
    "__v": 0
  }
}

=================================================================================================

PATCH
Update Dispense

curl --location --request PATCH '/dispense/68da68fd49783786a0493d9b' \
--data '{
    "status": "dispensed"
}'

Example Response
{
  "success": true,
  "code": 200,
  "message": "Dispense record updated successfully",
  "data": {
    "_id": "68da68fd49783786a0493d9b",
    "prescription": "68d4771aae3823efd10f7ccc",
    "pharmacistId": "2492b52f-3457-464b-8814-dc9f4e74bf5f",
    "items": [
      {
        "drugName": "amoxicillan",
        "quantity": 20,
        "batch": "5637382b637",
        "expiry": "2027-04-19T00:00:00.000Z"
      }
    ],
    "status": "dispensed",
    "dispensedAt": "2025-09-29T10:35:39.159Z",
    "createdAt": "2025-09-29T11:09:49.248Z",
    "updatedAt": "2025-09-29T11:11:33.991Z",
    "__v": 0
  }
}