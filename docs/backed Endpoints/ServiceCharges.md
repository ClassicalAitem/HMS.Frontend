POST
Create Service Charge

curl --location '/serviceCharge' \
--data '{
"service": "General consultation",
"category": "consultation",
"amount": "15000"
}'

Example Response
{
"success": true,
"code": 201,
"message": "Service charge created successfully",
"data": {
"service": "General consultation",
"category": "consultation",
"amount": 15000,
"id": "6b7dc8c8-6bc2-4819-9687-4072d1f34b7a",
"status": "active",
"createdAt": "2025-11-03T12:15:48.000Z",
"updatedAt": "2025-11-03T12:15:48.000Z"
}
}

======================================================================================================================

GET
Get All Service Charge

curl --location '/serviceCharge' \
--data ''

Example Response
{
"success": true,
"code": 200,
"message": "Operation Successful",
"data": [
{
"id": "6b7dc8c8-6bc2-4819-9687-4072d1f34b7a",
"service": "General consultation",
"category": "consultation",
"amount": 15000,
"status": "active",
"createdAt": "2025-11-03T12:15:48.000Z",
"updatedAt": "2025-11-03T12:15:48.000Z"
}
]
}

=====================================================================================================================

GET
Get Service Charge

curl --location '/serviceCharge/6b7dc8c8-6bc2-4819-9687-4072d1f34b7a' \
--data ''

Example Response
{
"success": true,
"code": 200,
"message": "Service charge retrieved successfully",
"data": {
"id": "6b7dc8c8-6bc2-4819-9687-4072d1f34b7a",
"service": "General consultation",
"category": "consultation",
"amount": 15000,
"status": "active",
"createdAt": "2025-11-03T12:15:48.000Z",
"updatedAt": "2025-11-03T12:15:48.000Z"
}
}

======================================================================================================================

PATCH
Update Service Charge

curl --location --request PATCH '/serviceCharge/6b7dc8c8-6bc2-4819-9687-4072d1f34b7a' \
--data '{
"amount": "20000"
}'

Example Response

{
"success": true,
"code": 200,
"message": "Service Charge updated successfully",
"data": {
"id": "6b7dc8c8-6bc2-4819-9687-4072d1f34b7a",
"service": "General consultation",
"category": "consultation",
"amount": "20000",
"status": "active",
"createdAt": "2025-11-03T12:15:48.000Z",
"updatedAt": "2025-11-03T12:15:48.000Z"
}
}
