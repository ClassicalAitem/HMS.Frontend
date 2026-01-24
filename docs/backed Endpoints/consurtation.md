POST
Create Consulation

curl --location '/consultation' \
--data '{
    "patientId": "452b51c8-787c-49f9-aea5-2fa91d42fa08",
    "visitReason": "for wellness",
    "diagnosis": "malaria parasite",
    "notes": "make sure you also run a pregnancy test",
    "complaint": [{
        "symptom": "headache",
        "durationInDays": "3" 
    }],
    "surgicalHistory": [{
        "procedureName": "kidney transplant",
        "dateOfSurgery": "2022-11-22" 
    }],
    "familyHistory": [{
        "relation": "uncle",
        "condition": "sleeping",
        "value": "2"
    }],
    "socialHistory": [{
        "habit": "alcohol",
        "frequencyPerDay": "3" 
    }],
    "medicalHistory": [{
        "title": "headche",
        "value": "3" 
    }],
    "allergicHistory": [{
        "allergen": "dust",
        "severity": "medium" ,
        "reaction": "sneezing"
    }]
}'


Example Response
{
  "success": true,
  "code": 201,
  "message": "Consultation created successfully",
  "data": {
    "patientId": "452b51c8-787c-49f9-aea5-2fa91d42fa08",
    "doctorId": "d3d5b2a5-1b0a-45f0-83b1-cbb8909a4d57",
    "visitReason": "for wellness",
    "allergicHistory": [
      {
        "allergen": "dust",
        "severity": "medium",
        "reaction": "sneezing"
      }
    ],
    "familyHistory": [
      {
        "relation": "uncle",
        "condition": "sleeping",
        "value": "2"
      }
    ],
    "medicalHistory": [
      {
        "title": "headche",
        "value": "3"
      }
    ],
    "socialHistory": [
      {
        "habit": "alcohol",
        "frequencyPerDay": "3"
      }
    ],
    "surgicalHistory": [
      {
        "procedureName": "kidney transplant",
        "dateOfSurgery": "2022-11-22"
      }
    ],
    "complaint": [
      {
        "symptom": "headache",
        "durationInDays": "3"
      }
    ],
    "diagnosis": "malaria parasite",
    "notes": "make sure you also run a pregnancy test",
    "dependantId": null,
    "id": "41c3a816-d02d-447e-9441-4b2f05871fd5",
    "createdAt": "2026-01-10T04:10:15.000Z",
    "updatedAt": "2026-01-10T04:10:15.000Z"
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
  "message": "Consultation retrieved successfully",
  "data": {
    "id": "41c3a816-d02d-447e-9441-4b2f05871fd5",
    "patientId": "452b51c8-787c-49f9-aea5-2fa91d42fa08",
    "dependantId": null,
    "doctorId": "d3d5b2a5-1b0a-45f0-83b1-cbb8909a4d57",
    "visitReason": "for wellness",
    "allergicHistory": [
      {
        "allergen": "dust",
        "reaction": "sneezing",
        "severity": "medium"
      }
    ],
    "familyHistory": [
      {
        "value": "2",
        "relation": "uncle",
        "condition": "sleeping"
      }
    ],
    "medicalHistory": [
      {
        "title": "headche",
        "value": "3"
      }
    ],
    "socialHistory": [
      {
        "habit": "alcohol",
        "frequencyPerDay": "3"
      }
    ],
    "surgicalHistory": [
      {
        "dateOfSurgery": "2022-11-22",
        "procedureName": "kidney transplant"
      }
    ],
    "complaint": [
      {
        "symptom": "headache",
        "durationInDays": "3"
      }
    ],
    "diagnosis": "malaria parasite",
    "notes": "make sure you also run a pregnancy test",
    "createdAt": "2026-01-10T05:10:15.000Z",
    "updatedAt": "2026-01-10T05:10:15.000Z",
    "patient": {
      "firstName": "Seun",
      "lastName": "updatedSeun",
      "status": "awaiting_consultation"
    },
    "dependant": null,
    "doctor": {
      "firstName": "Sodiq",
      "lastName": "Amusam"
    }
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
PATCH
Update Consultation

curl --location --request PATCH '/consultation/519b69be-6bea-4577-9bb6-95d8ada38074' \
--data '{
    "diagnosis": "malaria parasite"
}'

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