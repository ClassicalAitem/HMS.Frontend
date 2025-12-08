POST: Create A Inventory

curl --location '/inventory' \
--data '{
"name": "Cefuroxime 500mg Tablet",
"form": "Tablet",
"strength": "500mg",
"costPrice": "200",
"sellingPrice": "300",
"quantity": "1000",
"unitPrice": "15.5",
"batchNumber": "CFX2025B",
"expiryDate": "2026-03-31",
"supplier": "HealthPlus Pharmacy"
}'

Example Response
{
"success": true,
"code": 201,
"message": "Inventory created successfully",
"data": {
"name": "Cefuroxime 500mg Tablet",
"form": "Tablet",
"strength": "500mg",
"stock": 0,
"reorderLevel": 0,
"costPrice": 200,
"sellingPrice": 300,
"supplier": "HealthPlus Pharmacy",
"pharmacistId": "2492b52f-3457-464b-8814-dc9f4e74bf5f",
"\_id": "68e918a106ead03e6259ab21",
"createdAt": "2025-10-10T14:30:57.576Z",
"updatedAt": "2025-10-10T14:30:57.576Z",
"\_\_v": 0
}
}

=========================================================================================================================

PATCH: Restock Inventory

curl --location --request PATCH '/inventory/restockInventory/68e918a106ead03e6259ab21' \
--data '{
"quantity": "200",
"batchNumber": "CFX2025B"

}'

Example Response
{
"success": true,
"code": 200,
"message": "Restock inventory updated successfully",
"data": {
"\_id": "68e918a106ead03e6259ab21",
"name": "Cefuroxime 500mg Tablet",
"form": "Tablet",
"strength": "500mg",
"stock": 1165,
"reorderLevel": 0,
"costPrice": 200,
"sellingPrice": 300,
"supplier": "HealthPlus Pharmacy",
"pharmacistId": "2492b52f-3457-464b-8814-dc9f4e74bf5f",
"createdAt": "2025-10-10T14:30:57.576Z",
"updatedAt": "2025-10-14T13:36:37.505Z",
"\_\_v": 0
}
}

=========================================================================================================================

PATCH: Update Inventory

curl --location --request PATCH '/inventory/68e918a106ead03e6259ab21' \
--data '{
"sellingPrice": "400"
}'

Example Response
{
"success": true,
"code": 200,
"message": "Inventory updated successfully",
"data": {
"\_id": "68e918a106ead03e6259ab21",
"name": "Cefuroxime 500mg Tablet",
"form": "Tablet",
"strength": "500mg",
"stock": 1185,
"reorderLevel": 0,
"costPrice": 200,
"sellingPrice": 400,
"supplier": "HealthPlus Pharmacy",
"pharmacistId": "2492b52f-3457-464b-8814-dc9f4e74bf5f",
"createdAt": "2025-10-10T14:30:57.576Z",
"updatedAt": "2025-10-14T15:06:27.126Z",
"\_\_v": 0
}
}

========================================================================================================================

GET: Get Inventory

curl --location '/inventory/68e918a106ead03e6259ab21' \
--data ''

Example Response
{
"success": true,
"code": 200,
"message": "Operation Successful",
"data": {
"\_id": "68e918a106ead03e6259ab21",
"name": "Cefuroxime 500mg Tablet",
"form": "Tablet",
"strength": "500mg",
"stock": 1185,
"reorderLevel": 0,
"costPrice": 200,
"sellingPrice": 300,
"supplier": "HealthPlus Pharmacy",
"pharmacistId": "2492b52f-3457-464b-8814-dc9f4e74bf5f",
"createdAt": "2025-10-10T14:30:57.576Z",
"updatedAt": "2025-10-14T13:42:03.331Z",
"\_\_v": 0
}
}

========================================================================================================================

GET: Get All Inventory Transactions

curl --location '/inventory/InventoryTransaction/transactions' \
--data ''

Example Response
{
"success": true,
"code": 200,
"message": "Operation Successful",
"data": [
{
"_id": "68ee532b4315ad2ad204bca8",
"inventoryId": "68e918a106ead03e6259ab21",
"type": "in",
"quantity": 10,
"unitPrice": 20,
"batchNumber": "CFX2025B",
"description": "Restock added to inventory",
"createdAt": "2025-10-14T13:42:03.455Z",
"updatedAt": "2025-10-14T13:42:03.455Z",
"__v": 0
},
{
"_id": "68ee52ea4315ad2ad204bca3",
"inventoryId": "68e918a106ead03e6259ab21",
"type": "in",
"quantity": 10,
"batchNumber": "CFX2025B",
"description": "Restock added to inventory",
"createdAt": "2025-10-14T13:40:58.070Z",
"updatedAt": "2025-10-14T13:40:58.070Z",
"__v": 0
},
{
"_id": "68ee51e50a2582df601d3ba9",
"inventoryId": "68e918a106ead03e6259ab21",
"type": "in",
"quantity": 200,
"batchNumber": "CFX2025B",
"description": "Restock added to inventory",
"createdAt": "2025-10-14T13:36:37.629Z",
"updatedAt": "2025-10-14T13:36:37.629Z",
"__v": 0
},
{
"_id": "68ee4945c7e2f7bdc2ebad3a",
"dispensedId": "68ee4944c7e2f7bdc2ebad38",
"type": "out",
"quantity": 5,
"batchNumber": "CFX2025B",
"referenceId": "68d959f01ecdd535241128a2",
"description": "Drug dispensed from inventory",
"createdAt": "2025-10-14T12:59:49.097Z",
"updatedAt": "2025-10-14T12:59:49.097Z",
"__v": 0
},
{
"_id": "68ee48de06fce37071ee1ca1",
"type": "out",
"quantity": 5,
"batchNumber": "CFX2025B",
"referenceId": "68d959f01ecdd535241128a2",
"description": "Drug dispensed from inventory",
"createdAt": "2025-10-14T12:58:06.742Z",
"updatedAt": "2025-10-14T12:58:06.742Z",
"__v": 0
},
{
"_id": "68ee47eb3f8bf3ac0a2bd5cb",
"type": "out",
"quantity": 5,
"batchNumber": "CFX2025B",
"referenceId": "68d959f01ecdd535241128a2",
"description": "Drug dispensed from inventory",
"createdAt": "2025-10-14T12:54:03.318Z",
"updatedAt": "2025-10-14T12:54:03.318Z",
"__v": 0
},
{
"_id": "68ee3ee0aaaa08abf5e162de",
"type": "out",
"quantity": 20,
"batchNumber": "CFX2025B",
"referenceId": "68d959f01ecdd535241128a2",
"description": "Drug dispensed from inventory",
"createdAt": "2025-10-14T12:15:28.477Z",
"updatedAt": "2025-10-14T12:15:28.477Z",
"__v": 0
},
{
"_id": "68e918a106ead03e6259ab23",
"inventoryId": "68e918a106ead03e6259ab21",
"type": "in",
"quantity": 1000,
"unitPrice": 15.5,
"batchNumber": "CFX2025B",
"expiryDate": "2026-03-31T00:00:00.000Z",
"description": "New drug added to inventory",
"createdAt": "2025-10-10T14:30:57.858Z",
"updatedAt": "2025-10-10T14:30:57.858Z",
"__v": 0
}
]
}

========================================================================================================================

GET: Get A Inventor Transaction

curl --location '/inventory/InventoryTransaction/transaction/68e918a106ead03e6259ab23' \
--data ''

Example Response
{
"success": true,
"code": 200,
"message": "Operation Successful",
"data": {
"\_id": "68e918a106ead03e6259ab23",
"inventoryId": "68e918a106ead03e6259ab21",
"type": "in",
"quantity": 1000,
"unitPrice": 15.5,
"batchNumber": "CFX2025B",
"expiryDate": "2026-03-31T00:00:00.000Z",
"description": "New drug added to inventory",
"createdAt": "2025-10-10T14:30:57.858Z",
"updatedAt": "2025-10-10T14:30:57.858Z",
"\_\_v": 0
}
}
