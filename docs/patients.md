for update: curl --location --request PATCH '/patient/0119f2a1-f5d3-4bb8-832b-536dfe2ba43e' \
--data-raw '{
"email": "motunrayo2@gmail.com"
}'

for create a patiendt we have POST: curl --location '/patient' \
--data-raw '{
"firstName": "Afeez",
"lastName": "Eleshi",
"dob": "1994-06-06",
"gender": "male",
"phone": "09167370389",
"email": "oshindeinde3@gmail.com",
"address": "23, first gate ikorodu lagos",
"middleName": "fatai",
"nextOfKin": {
"name": "fatimot Eleshi",
"phone": "09050459812",
"relationship": "wife"
},
"hmo": [
{
"plan": "Diamond",
"memberId": "34758H90938",
"provider": "Bastion",
"expiresAt": "2025-12-16"
}
]

}'

=======================================================================================================

GET
Get Patient

curl --location '/patient/0119f2a1-f5d3-4bb8-832b-536dfe2ba43e' \
--data ''

Example Response

{
"success": true,
"code": 200,
"message": "Patient retrieved successfully",
"data": {
"id": "0119f2a1-f5d3-4bb8-832b-536dfe2ba43e",
"hospitalId": "KOLAK-100057",
"firstName": "Motunrayo",
"lastName": "Ogunsanwo",
"middleName": "Toyin",
"dob": null,
"gender": "female",
"phone": "09167300358",
"email": "motunrayo@gmail.com",
"address": "1, shotayo street off first gate ikorodu lagos",
"nextOfKin": {
"name": "Deji Ogunsanwo",
"phone": "09087837479",
"relationship": "husband"
},
"status": "registered",
"createdAt": "2025-09-16T09:16:08.242Z",
"updatedAt": "2025-09-16T09:16:08.242Z",
"hmo": [
{
"id": "2b8a3b82-1f0c-4f4f-9f64-084f54a4044b",
"plan": "Diamond",
"memberId": "34758346789",
"provider": "Axa Mansard",
"expiresAt": "2026-10-18T23:00:00.000Z",
"patientId": "0119f2a1-f5d3-4bb8-832b-536dfe2ba43e",
"createdAt": "2025-09-16T09:16:10.143Z",
"updatedAt": "2025-09-16T09:16:10.143Z"
},
{
"id": "c2d4b87e-d20c-40b4-8e07-76e0dba576b8",
"plan": "Diamond",
"memberId": "34758H90938",
"provider": "Bastion",
"expiresAt": "2025-12-15T23:00:00.000Z",
"patientId": "0119f2a1-f5d3-4bb8-832b-536dfe2ba43e",
"createdAt": "2025-09-16T09:16:09.710Z",
"updatedAt": "2025-09-16T09:16:09.710Z"
},
{
"id": "ce69e0fa-a913-4eef-aa34-fec1ba0393de",
"plan": "Diamond",
"memberId": "34758346789",
"provider": "Axa Mansard",
"expiresAt": "2026-10-18T23:00:00.000Z",
"patientId": "0119f2a1-f5d3-4bb8-832b-536dfe2ba43e",
"createdAt": "2025-09-16T09:16:09.031Z",
"updatedAt": "2025-09-16T09:16:09.031Z"
},
{
"id": "e66727eb-78a7-4515-8aa3-9f90d6670859",
"plan": "Diamond",
"memberId": "34758H90938",
"provider": "Bastion",
"expiresAt": "2025-12-15T23:00:00.000Z",
"patientId": "0119f2a1-f5d3-4bb8-832b-536dfe2ba43e",
"createdAt": "2025-09-16T09:16:08.735Z",
"updatedAt": "2025-09-16T09:16:08.735Z"
}
],
"dependants": []
}
}

===============================================================================================================

POST
Create Patient

curl --location '/patient' \
--data-raw '{
"firstName": "Femi",
"lastName": "Falani",
"dob": "1991-08-02",
"gender": "female",
"phone": "09167300358",
"email": "femifalani@gmail.com",
"address": "1, shotayo street off first gate ikorodu lagos",
"middleName": "Kingsley",
"nextOfKin": {
"name": "Omotunde Falani",
"phone": "09087837479",
"relationship": "wife"
},
"hmos": [
{
"plan": "Diamond",
"memberId": "34758H90938",
"provider": "Bastion",
"expiresAt": "2025-12-16"
},
{
"plan": "Diamond",
"memberId": "34758346789",
"provider": "Axa Mansard",
"expiresAt": "2026-10-19"
}
],
"dependants": [
{
"firstName": "Kehinde",
"lastName": "Falani",
"dob": "2005-08-09",
"gender": "male",
"relationshipType": "child",
"middleName": "Ola"
}
]

}'
