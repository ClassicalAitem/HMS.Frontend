POST
Create Lab result

curl --location '/labResult/f2832d74-521f-47a8-a03a-7cd212b73ecf' \
--form 'patientId="452b51c8-787c-49f9-aea5-2fa91d42fa08"' \
--form 'tests="{ code: LAB-SURGERY, value: Eye, unit: hello world, range: wide, flag: H }"' \
--form 'remarks=" 20"' \
--form 'upload=@"/C:/Users/HP/Pictures/deeneed.png"' \
--form 'upload=@"/C:/Users/HP/Pictures/1.jpg"'

Example Response
{
"success": true,
"code": 201,
"message": "Lab result created successfully",
"data": {
"patientId": "452b51c8-787c-49f9-aea5-2fa91d42fa08",
"investigationRequestId": "f2832d74-521f-47a8-a03a-7cd212b73ecf",
"labTechnicianId": "2492b52f-3457-464b-8814-dc9f4e74bf5f",
"remarks": " 20",
"attachedFiles": [
"68d540c794f5db3abaae17ee",
"68d540c794f5db3abaae17f0"
],
"\_id": "68d540c894f5db3abaae17f2",
"result": [],
"createdAt": "2025-09-25T13:16:56.758Z",
"updatedAt": "2025-09-25T13:16:56.758Z",
"\_\_v": 0
}
}

==================================================================================================================================

GET
Get Lab result

curl --location --request GET '/labResult/68d540c894f5db3abaae17f2' \
--form 'patientId="452b51c8-787c-49f9-aea5-2fa91d42fa08"' \
--form 'tests="{ code: LAB-SURGERY, value: Eye, unit: hello world, range: wide, flag: H }"' \
--form 'remarks=" 20"' \
--form 'upload=@"/C:/Users/HP/Pictures/deeneed.png"' \
--form 'upload=@"/C:/Users/HP/Pictures/1.jpg"'

Example Response
{
"success": true,
"code": 200,
"message": "Lab Result retrieved successfully",
"data": {
"\_id": "68d540c894f5db3abaae17f2",
"patientId": "452b51c8-787c-49f9-aea5-2fa91d42fa08",
"investigationRequestId": "f2832d74-521f-47a8-a03a-7cd212b73ecf",
"labTechnicianId": "2492b52f-3457-464b-8814-dc9f4e74bf5f",
"remarks": " 20",
"attachedFiles": [
{
"\_id": "68d540c794f5db3abaae17ee",
"name": "deeneed.webp",
"mimetype": "image/png",
"data": {
"type": "Buffer",
"data": [
82,
73,
70,
70,
224,
17,
0,
0,
87,
69,
66,
80,
these numbers can go up to 20, 000 lines so i just cut them here
0,
0,
0,
0
]
},
"uploadedAt": "2025-09-25T13:16:55.804Z",
"**v": 0
}
],
"result": [],
"createdAt": "2025-09-25T13:16:56.758Z",
"updatedAt": "2025-09-25T13:16:56.758Z",
"**v": 0
}
}

===============================================================================================================================

GET
Get all lab result

normal endpoint is curl --location --request GET '/labResult' \
but can also
curl --location --request GET '/labResult?\_id=68d540c894f5db3abaae17f2' \
--form 'patientId="452b51c8-787c-49f9-aea5-2fa91d42fa08"' \
--form 'tests="{ code: LAB-SURGERY, value: Eye, unit: hello world, range: wide, flag: H }"' \
--form 'remarks=" 20"' \
--form 'upload=@"/C:/Users/HP/Pictures/deeneed.png"' \
--form 'upload=@"/C:/Users/HP/Pictures/1.jpg"'

Example Response
{
"success": true,
"code": 200,
"message": "Lab Results retrieved successfully",
"data": [
{
"\_id": "68d540c894f5db3abaae17f2",
"patientId": "452b51c8-787c-49f9-aea5-2fa91d42fa08",
"investigationRequestId": "f2832d74-521f-47a8-a03a-7cd212b73ecf",
"labTechnicianId": "2492b52f-3457-464b-8814-dc9f4e74bf5f",
"remarks": " 20",
"attachedFiles": [
{
"\_id": "68d540c794f5db3abaae17ee",
"name": "deeneed.webp",
"mimetype": "image/png",
"data": {
"type": "Buffer",
"data": [
82,
73,
70,
70,
224,
17,
0,
0,
87,
69,
these numbers can go up to 20, 000 lines so i just cut them here
188,
135,
52,
0,
0,
0,
0
]
},
"uploadedAt": "2025-09-25T13:16:55.804Z",
"**v": 0
}
],
"result": [],
"createdAt": "2025-09-25T13:16:56.758Z",
"updatedAt": "2025-09-25T13:16:56.758Z",
"**v": 0
}
]
}

=================================================================================================================================

PATCH
Update lab result

curl --location --request PATCH '/labResult/68d540c894f5db3abaae17f2' \
--data '{
"result": [
{ "code": "LAB-SURGERY", "value": "Eye", "unit": "hello world", "range": "wide", "flag": "H" }
]
}'

{
"success": true,
"code": 200,
"message": "Lab Result updated successfully",
"data": {
"\_id": "68d540c894f5db3abaae17f2",
"patientId": "452b51c8-787c-49f9-aea5-2fa91d42fa08",
"investigationRequestId": "f2832d74-521f-47a8-a03a-7cd212b73ecf",
"labTechnicianId": "2492b52f-3457-464b-8814-dc9f4e74bf5f",
"remarks": " 20",
"attachedFiles": [
"68d540c794f5db3abaae17ee",
"68d540c794f5db3abaae17f0"
],
"result": [
{
"code": "LAB-SURGERY",
"value": "Eye",
"unit": "hello world",
"range": "wide",
"flag": "H"
}
],
"createdAt": "2025-09-25T13:16:56.758Z",
"updatedAt": "2025-09-26T12:54:49.971Z",
"\_\_v": 0
}
}
