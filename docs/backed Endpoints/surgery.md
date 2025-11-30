POST
Create Surgery

curl --location '/surgery/68d3c7e1bd25d6bf7b7f79ac' \
--data '{
    "procedureName": "kidney replacement",
    "procedureCode": "HBB23KID",
    "scheduledDate": "2025-11-02",
    "operationRoom": "OPRT406"
}'

Example Response
{
  "success": true,
  "code": 201,
  "message": "Surgery created successfully",
  "data": {
    "patientId": "0119f2a1-f5d3-4bb8-832b-536dfe2ba43e",
    "surgeonId": "2492b52f-3457-464b-8814-dc9f4e74bf5f",
    "investigationRequestId": "68d3c7e1bd25d6bf7b7f79ac",
    "procedureName": "kidney replacement",
    "procedureCode": "HBB23KID",
    "scheduledDate": "2025-11-02T00:00:00.000Z",
    "operationRoom": "OPRT406",
    "status": "scheduled",
    "_id": "68ff8056c9401ac4767033ce",
    "createdAt": "2025-10-27T14:23:18.159Z",
    "updatedAt": "2025-10-27T14:23:18.159Z",
    "__v": 0
  }
}

========================================================================================================

GET
Get All Surgery

curl --location '/surgery'

Example Response

{
  "success": true,
  "code": 200,
  "message": "Operation Successful",
  "data": [
    {
      "_id": "68ff8056c9401ac4767033ce",
      "patientId": "0119f2a1-f5d3-4bb8-832b-536dfe2ba43e",
      "surgeonId": "2492b52f-3457-464b-8814-dc9f4e74bf5f",
      "investigationRequestId": "68d3c7e1bd25d6bf7b7f79ac",
      "procedureName": "kidney replacement",
      "procedureCode": "HBB23KID",
      "scheduledDate": "2025-11-02T00:00:00.000Z",
      "operationRoom": "OPRT406",
      "status": "scheduled",
      "createdAt": "2025-10-27T14:23:18.159Z",
      "updatedAt": "2025-10-27T14:23:18.159Z",
      "__v": 0
    }
  ]
}

========================================================================================================

GET
Get A Surgery

curl --location '/surgery/68ff8056c9401ac4767033ce'

Example Response
{
  "success": true,
  "code": 200,
  "message": "Operation Successful",
  "data": {
    "_id": "68ff8056c9401ac4767033ce",
    "patientId": "0119f2a1-f5d3-4bb8-832b-536dfe2ba43e",
    "surgeonId": "2492b52f-3457-464b-8814-dc9f4e74bf5f",
    "investigationRequestId": "68d3c7e1bd25d6bf7b7f79ac",
    "procedureName": "kidney replacement",
    "procedureCode": "HBB23KID",
    "scheduledDate": "2025-11-02T00:00:00.000Z",
    "operationRoom": "OPRT406",
    "status": "scheduled",
    "createdAt": "2025-10-27T14:23:18.159Z",
    "updatedAt": "2025-10-27T14:23:18.159Z",
    "__v": 0
  }
}

========================================================================================================

PATCH
Update Surgery

curl --location --request PATCH '/surgery/68ff8056c9401ac4767033ce' \
--data '{
    "startTime": "12:30",
    "notes": "This is a stage two"

}'


Example Response

{
  "success": true,
  "code": 200,
  "message": "Operation Successful",
  "data": {
    "_id": "68ff8056c9401ac4767033ce",
    "patientId": "0119f2a1-f5d3-4bb8-832b-536dfe2ba43e",
    "surgeonId": "2492b52f-3457-464b-8814-dc9f4e74bf5f",
    "investigationRequestId": "68d3c7e1bd25d6bf7b7f79ac",
    "procedureName": "kidney replacement",
    "procedureCode": "HBB23KID",
    "scheduledDate": "2025-11-02T00:00:00.000Z",
    "operationRoom": "OPRT406",
    "status": "scheduled",
    "createdAt": "2025-10-27T14:23:18.159Z",
    "updatedAt": "2025-10-27T14:33:54.297Z",
    "__v": 0,
    "notes": "This is a stage two",
    "startTime": "12:30"
  }
}

=======================================================================================================

PATCH
Update Surgery Status

curl --location --request PATCH '/surgery/surgeryStatus/68ff8056c9401ac4767033ce' \
--data '{
    "status": "in_progress"

}'


Example Response

{
  "success": true,
  "code": 200,
  "message": "Operation Successful",
  "data": {
    "_id": "68ff8056c9401ac4767033ce",
    "patientId": "0119f2a1-f5d3-4bb8-832b-536dfe2ba43e",
    "surgeonId": "2492b52f-3457-464b-8814-dc9f4e74bf5f",
    "investigationRequestId": "68d3c7e1bd25d6bf7b7f79ac",
    "procedureName": "kidney replacement",
    "procedureCode": "HBB23KID",
    "scheduledDate": "2025-11-02T00:00:00.000Z",
    "operationRoom": "OPRT406",
    "status": "in_progress",
    "createdAt": "2025-10-27T14:23:18.159Z",
    "updatedAt": "2025-10-27T14:37:29.932Z",
    "__v": 0,
    "notes": "This is a stage two",
    "startTime": "12:30"
  }
}