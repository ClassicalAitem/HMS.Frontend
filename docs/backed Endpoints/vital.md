POST: Create Vital

curl --location '/vital' \
--data '{
"patientId": "452b51c8-787c-49f9-aea5-2fa91d42fa08",
"temperature": "60",
"bp": "130/87",
"weight": "62",
"pulse": "32",
"spo2": "30",
"notes": "just want to share something"
}'

Example Response
{
"success": true,
"code": 201,
"message": "Vitals created successfully",
"data": {
"bp": "130/87",
"temperature": "60",
"weight": "62",
"pulse": "32",
"spo2": "30",
"notes": "just want to share something",
"patientId": "452b51c8-787c-49f9-aea5-2fa91d42fa08",
"nurseId": "82bca8ba-9b7f-4bab-b68d-c62c8e1ba874",
"dependantId": null,
"id": "a734af38-3f2b-4c68-ba13-e549596d4ff2",
"createdAt": "2025-09-23T09:31:32.000Z",
"updatedAt": "2025-09-23T09:31:32.000Z"
}
}

=========================================================================================================================

GET: Get Vital

curl --location '/vital/a734af38-3f2b-4c68-ba13-e549596d4ff2' \
--data ''

Example Response
{
"success": true,
"code": 200,
"message": "Vital retrieved successfully",
"data": {
"vital": {
"id": "a734af38-3f2b-4c68-ba13-e549596d4ff2",
"bp": "130/87",
"temperature": 60,
"weight": 62,
"pulse": 32,
"spo2": 30,
"notes": "just want to share something",
"patientId": "452b51c8-787c-49f9-aea5-2fa91d42fa08",
"dependantId": null,
"nurseId": "82bca8ba-9b7f-4bab-b68d-c62c8e1ba874",
"createdAt": "2025-09-23T09:31:32.000Z",
"updatedAt": "2025-09-23T09:31:32.000Z"
}
}
}

=========================================================================================================================

PATCH: Update Vital

curl --location --request PATCH '/vital/a734af38-3f2b-4c68-ba13-e549596d4ff2' \
--data '{
"temperature": "100"
}'

Example Response
{
"success": true,
"code": 200,
"message": "Vital updated successfully",
"data": {
"id": "a734af38-3f2b-4c68-ba13-e549596d4ff2",
"bp": "130/87",
"temperature": "100",
"weight": 62,
"pulse": 32,
"spo2": 30,
"notes": "just want to share something",
"patientId": "452b51c8-787c-49f9-aea5-2fa91d42fa08",
"dependantId": null,
"nurseId": "82bca8ba-9b7f-4bab-b68d-c62c8e1ba874",
"createdAt": "2025-09-23T09:31:32.000Z",
"updatedAt": "2025-09-23T09:31:32.000Z"
}
}

=====================================================================================================================

Get All Vital

curl --location '/vital' \
--data ''

{
"success": true,
"code": 200,
"message": "Vitals retrieved successfully",
"data": [
{
"id": "a734af38-3f2b-4c68-ba13-e549596d4ff2",
"bp": "130/87",
"temperature": 100,
"weight": 62,
"pulse": 32,
"spo2": 30,
"notes": "just want to share something",
"patientId": "452b51c8-787c-49f9-aea5-2fa91d42fa08",
"dependantId": "",
"nurseId": "82bca8ba-9b7f-4bab-b68d-c62c8e1ba874",
"createdAt": "2025-09-23T09:31:32.000Z",
"updatedAt": "2025-09-23T09:31:32.000Z"
}
]
}
