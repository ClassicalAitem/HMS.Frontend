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
