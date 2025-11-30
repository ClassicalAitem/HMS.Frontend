POST: Create appointment

curl --location '/appointment' \
--data '{
"patientId": "5defe45f-2c8a-4352-b56b-726284a3d38d",
"appointmentDate": "1991-08-02",
"appointmentTime": "12:30",
"department": "doctor",
"notes": "Hello worlds"

}'

Example Response
{
"success": true,
"code": 201,
"message": "Appointment created successfully",
"data": {
"patientId": "5defe45f-2c8a-4352-b56b-726284a3d38d",
"frontDeskId": "09312d0b-b072-4f08-8c8f-7ffd116f2394",
"appointmentDate": "1991-08-02",
"appointmentTime": "12:30",
"department": "doctor",
"notes": "Hello worlds",
"id": "ffd4c122-e28e-465d-a183-29c1aa1e3a26",
"status": "scheduled",
"createdAt": "2025-10-09T12:48:44.000Z",
"updatedAt": "2025-10-09T12:48:44.000Z"
}
}

=========================================================================================================================

GET: Get All Appointment

curl --location '/appointment' \
--data ''

Example Response
{
"success": true,
"code": 200,
"message": "Appointments retrieved successfully",
"data": [
{
"id": "ffd4c122-e28e-465d-a183-29c1aa1e3a26",
"patientId": "5defe45f-2c8a-4352-b56b-726284a3d38d",
"frontDeskId": "09312d0b-b072-4f08-8c8f-7ffd116f2394",
"appointmentDate": "1991-08-02",
"appointmentTime": "12:30:00",
"department": "doctor",
"notes": "Hello worlds",
"status": "scheduled",
"createdAt": "2025-10-09T12:48:44.000Z",
"updatedAt": "2025-10-09T12:48:44.000Z"
}
]
}

=========================================================================================================================

GET: Get Appointment

curl --location '/appointment/ffd4c122-e28e-465d-a183-29c1aa1e3a26' \
--data ''

Example Response
{
"success": true,
"code": 200,
"message": "Appointment retrieved successfully",
"data": {
"id": "ffd4c122-e28e-465d-a183-29c1aa1e3a26",
"patientId": "5defe45f-2c8a-4352-b56b-726284a3d38d",
"frontDeskId": "09312d0b-b072-4f08-8c8f-7ffd116f2394",
"appointmentDate": "1991-08-02",
"appointmentTime": "12:30:00",
"department": "doctor",
"notes": "Hello worlds",
"status": "scheduled",
"createdAt": "2025-10-09T12:48:44.000Z",
"updatedAt": "2025-10-09T12:48:44.000Z"
}
}

=========================================================================================================================

PATCH: Update Appointment

curl --location --request PATCH '/appointment/ffd4c122-e28e-465d-a183-29c1aa1e3a26' \
--data '{
"status": "completed"
}'

Example Response
{
"success": true,
"code": 200,
"message": "Appointment updated successfully",
"data": {
"id": "ffd4c122-e28e-465d-a183-29c1aa1e3a26",
"patientId": "5defe45f-2c8a-4352-b56b-726284a3d38d",
"frontDeskId": "09312d0b-b072-4f08-8c8f-7ffd116f2394",
"appointmentDate": "1991-08-02",
"appointmentTime": "12:30:00",
"department": "doctor",
"notes": "Hello worlds",
"status": "completed",
"createdAt": "2025-10-09T12:48:44.000Z",
"updatedAt": "2025-10-09T12:48:44.000Z"
}
}
