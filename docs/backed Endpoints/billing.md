POST: Create Billing

curl --location '/billing/create/884debf2-3506-4e94-b08c-39f6e64299a7' \
--data '{
"itemDetail": [{
"code": "consult",
"description": "this is for consultation",
"quantity": "1",
"price": "10000",
"total": "10000"
}]

}'

{
"success": true,
"code": 201,
"message": "Billing record created successfully",
"data": {
"itemDetails": [
{
"code": "consult",
"description": "this is for consultation",
"quantity": "1",
"price": "10000",
"total": "10000"
}
],
"totalAmount": 10000,
"patientId": "884debf2-3506-4e94-b08c-39f6e64299a7",
"cashierId": "4acab93a-46f3-4f11-8e19-a4b6655628df",
"id": "6cbf0473-9d85-4dd8-b7de-1c1985772cc0",
"outstandingBill": 0,
"createdAt": "2025-10-22T06:20:55.000Z",
"updatedAt": "2025-10-22T06:20:55.000Z"
}
}

=========================================================================================================================

GET: Get Billing

curl --location '/billing/82bca8ba-9b7f-4bab-b68d-c62c8e1ba874'

=========================================================================================================================

GET: Get All Billings

curl --location '/billing'
