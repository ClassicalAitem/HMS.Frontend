POST
Create Consulation

curl --location '/consultation' \
--data '{
"patientId": "452b51c8-787c-49f9-aea5-2fa91d42fa08",
"visitReason": "for wellness",
"symptoms": "I have been feeling dizzy and tired lately, sore throat",
"diagnosis": "malaria parasite",
"notes": "make sure you also run a pregnancy test"
}'

Example Response
{
"success": true,
"code": 201,
"message": "Consultation created successfully",
"data": {
"patientId": "452b51c8-787c-49f9-aea5-2fa91d42fa08",
"doctorId": "0e875b7e-b0fb-4680-8381-154857a7c9bb",
"visitReason": "for wellness",
"symptoms": "I have been feeling dizzy and tired lately, sore throat",
"diagnosis": "malaria parasite",
"notes": "make sure you also run a pregnancy test",
"dependantId": null,
"id": "519b69be-6bea-4577-9bb6-95d8ada38074",
"createdAt": "2025-09-23T10:27:18.000Z",
"updatedAt": "2025-09-23T10:27:18.000Z"
}
}

=============================================================================================================================================

GET
Get Consultation

curl --location '/consultation/519b69be-6bea-4577-9bb6-95d8ada38074' \
--data ''

Example Response
{
"success": true,
"code": 200,
"message": "Operation Successful",
"data": {
"id": "519b69be-6bea-4577-9bb6-95d8ada38074",
"patientId": "452b51c8-787c-49f9-aea5-2fa91d42fa08",
"dependantId": null,
"doctorId": "0e875b7e-b0fb-4680-8381-154857a7c9bb",
"visitReason": "for wellness",
"symptoms": "I have been feeling dizzy and tired lately, sore throat",
"diagnosis": "malaria parasite",
"notes": "make sure you also run a pregnancy test",
"createdAt": "2025-09-23T10:27:18.000Z",
"updatedAt": "2025-09-23T10:27:18.000Z"
}
}

============================================================================================================================================

GET
Get Consultation

curl --location '/consultation/519b69be-6bea-4577-9bb6-95d8ada38074' \
--data ''

Example Response

{
"success": true,
"code": 200,
"message": "Operation Successful",
"data": {
"id": "519b69be-6bea-4577-9bb6-95d8ada38074",
"patientId": "452b51c8-787c-49f9-aea5-2fa91d42fa08",
"dependantId": null,
"doctorId": "0e875b7e-b0fb-4680-8381-154857a7c9bb",
"visitReason": "for wellness",
"symptoms": "I have been feeling dizzy and tired lately, sore throat",
"diagnosis": "malaria parasite",
"notes": "make sure you also run a pregnancy test",
"createdAt": "2025-09-23T10:27:18.000Z",
"updatedAt": "2025-09-23T10:27:18.000Z"
}
}

==============================================================================================================================================
