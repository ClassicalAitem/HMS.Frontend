POST: 
Create Billing

curl --location '/billing/create/884debf2-3506-4e94-b08c-39f6e64299a7' \
--data '{
    "itemDetail": [{
        "code": "registered",
        "description": "form registration",
        "quantity": 1,
        "price": 5000,
        "total": 5000,
        "serviceChargeId": "17d11c1d-329e-48c5-81c5-944deecead90" 
    }]

}'

example response
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

Example Response

{
    "success": true,
    "code": 200,
    "message": "Billing records retrieved successfully",
    "data": [
        {
            "id": "f14c914e-f08b-4c96-89be-78cea3a4d881",
            "itemDetails": [
                {
                    "code": "consult",
                    "price": 15000,
                    "total": 15000,
                    "quantity": 1,
                    "description": "this is for consultation",
                    "serviceChargeId": "6b7dc8c8-6bc2-4819-9687-4072d1f34b7a"
                }
            ],
            "totalAmount": 15000,
            "outstandingBill": 0,
            "patientId": "884debf2-3506-4e94-b08c-39f6e64299a7",
            "cashierId": "4acab93a-46f3-4f11-8e19-a4b6655628df",
            "createdAt": "2025-11-03T15:00:54.000Z",
            "updatedAt": "2025-11-03T15:00:54.000Z"
        },
        {
            "id": "1f1aa4d0-f77c-442c-b37f-8d5fd086071d",
            "itemDetails": [
                {
                    "code": "consult",
                    "price": 15000,
                    "total": 15000,
                    "quantity": 1,
                    "description": "this is for consultation",
                    "serviceChargeId": "6b7dc8c8-6bc2-4819-9687-4072d1f34b7a"
                }
            ],
            "totalAmount": 15000,
            "outstandingBill": 0,
            "patientId": "884debf2-3506-4e94-b08c-39f6e64299a7",
            "cashierId": "4acab93a-46f3-4f11-8e19-a4b6655628df",
            "createdAt": "2025-11-03T14:39:15.000Z",
            "updatedAt": "2025-11-03T14:39:15.000Z"
        },
        {
            "id": "6cbf0473-9d85-4dd8-b7de-1c1985772cc0",
            "itemDetails": [
                {
                    "code": "consult",
                    "price": "10000",
                    "total": "10000",
                    "quantity": "1",
                    "description": "this is for consultation"
                }
            ],
            "totalAmount": 10000,
            "outstandingBill": 0,
            "patientId": "884debf2-3506-4e94-b08c-39f6e64299a7",
            "cashierId": "4acab93a-46f3-4f11-8e19-a4b6655628df",
            "createdAt": "2025-10-22T07:20:55.000Z",
            "updatedAt": "2025-10-22T07:20:55.000Z"
        },
        {
            "id": "0f420c82-d6bc-4b42-9a3b-2aca89b4e024",
            "itemDetails": [
                {
                    "code": "consult",
                    "price": "20000",
                    "total": "20000",
                    "quantity": "1",
                    "description": "this is for consultation"
                }
            ],
            "totalAmount": 20000,
            "outstandingBill": 0,
            "patientId": "452b51c8-787c-49f9-aea5-2fa91d42fa08",
            "cashierId": "09312d0b-b072-4f08-8c8f-7ffd116f2394",
            "createdAt": "2025-09-19T15:36:40.000Z",
            "updatedAt": "2025-09-19T15:36:40.000Z"
        }
    ]
}
