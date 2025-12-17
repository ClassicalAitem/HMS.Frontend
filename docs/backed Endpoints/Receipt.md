POST: Create Receipt
curl --location '/receipt/create/6cbf0473-9d85-4dd8-b7de-1c1985772cc0' \
--data '{
"amountPaid": "10000",
"paidBy": "self",
"paymentMethod": "cash"
}'

{
"success": true,
"code": 201,
"message": "Receipt created successfully",
"data": {
"status": "paid",
"paymentMethod": "cash",
"amountPaid": "10000",
"paidBy": "self",
"cashierId": "4acab93a-46f3-4f11-8e19-a4b6655628df",
"billingId": "6cbf0473-9d85-4dd8-b7de-1c1985772cc0",
"reference": "Kolak-171792",
"hmoId": null,
"id": "efa72630-2b4c-4bad-9c16-f9914a437619",
"paidAt": "2025-10-22T06:27:32.000Z",
"createdAt": "2025-10-22T06:27:32.000Z",
"updatedAt": "2025-10-22T06:27:32.000Z"
}
}

=========================================================================================================================
GET: Get Receipt
curl --location '/receipt/f6da4981-3a02-4ce8-b4cc-31cacc858eb2' \
--data ''

{
"success": true,
"code": 200,
"message": "Operation Successful",
"data": {
"id": "f6da4981-3a02-4ce8-b4cc-31cacc858eb2",
"status": "pending",
"paymentMethod": "hmo",
"amountPaid": "5000.00",
"paidBy": "hmo",
"cashierId": "0e875b7e-b0fb-4680-8381-154857a7c9bb",
"billingId": "0f420c82-d6bc-4b42-9a3b-2aca89b4e024",
"hmoId": "41ce6978-1bf2-4829-8ce2-905d14fa1460",
"reference": "Kolak-774468",
"paidAt": "2025-09-19T15:34:01.000Z",
"createdAt": "2025-09-19T15:34:01.000Z",
"updatedAt": "2025-09-19T15:34:01.000Z"
}
}

=========================================================================================================================

GET: Get All Receipt
curl --location '/receipt' \
--data ''

{
"success": true,
"code": 200,
"message": "Operation Successful",
"data": [
{
"id": "f6da4981-3a02-4ce8-b4cc-31cacc858eb2",
"status": "pending",
"paymentMethod": "hmo",
"amountPaid": "5000.00",
"paidBy": "hmo",
"cashierId": "0e875b7e-b0fb-4680-8381-154857a7c9bb",
"billingId": "0f420c82-d6bc-4b42-9a3b-2aca89b4e024",
"hmoId": "41ce6978-1bf2-4829-8ce2-905d14fa1460",
"reference": "Kolak-774468",
"paidAt": "2025-09-19T15:34:01.000Z",
"createdAt": "2025-09-19T15:34:01.000Z",
"updatedAt": "2025-09-19T15:34:01.000Z"
},
{
"id": "2c362585-6cae-455b-b7c7-116cb1d4a9da",
"status": "paid",
"paymentMethod": "cash",
"amountPaid": "10000.00",
"paidBy": "self",
"cashierId": "0e875b7e-b0fb-4680-8381-154857a7c9bb",
"billingId": "0f420c82-d6bc-4b42-9a3b-2aca89b4e024",
"hmoId": null,
"reference": "Kolak-893910",
"paidAt": "2025-09-19T15:14:59.000Z",
"createdAt": "2025-09-19T15:14:59.000Z",
"updatedAt": "2025-09-19T15:14:59.000Z"
}
]
}

=========================================================================================================================

PATCH: Update Receipt Status
curl --location --request PATCH '/receipt/f6da4981-3a02-4ce8-b4cc-31cacc858eb2' \
--data '{
"status": "paid"
}'

{
"success": true,
"code": 200,
"message": "Receipt updated successfully",
"data": {
"id": "f6da4981-3a02-4ce8-b4cc-31cacc858eb2",
"status": "paid",
"paymentMethod": "hmo",
"amountPaid": "5000.00",
"paidBy": "hmo",
"cashierId": "0e875b7e-b0fb-4680-8381-154857a7c9bb",
"billingId": "0f420c82-d6bc-4b42-9a3b-2aca89b4e024",
"hmoId": "41ce6978-1bf2-4829-8ce2-905d14fa1460",
"reference": "Kolak-774468",
"paidAt": "2025-09-19T15:34:01.000Z",
"createdAt": "2025-09-19T15:34:01.000Z",
"updatedAt": "2025-09-19T15:34:01.000Z"
}
}
