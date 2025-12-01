POST: Register Super Admin

curl --location '/user/defaultAdmin' \
--data-raw '{
"firstName": "Oluwaseun",
"lastName": "Omoleye",
"role": "admin",
"email": "oshindeinde@gmail.com",
"password": "test1234"
}'

Example Response
{
"success": false,
"code": 400,
"message": "Only super admin can be created"
}

=========================================================================================================================

POST: Register Admin

curl --location '/user/createAdmin' \
--data-raw '{
"firstName": "Oluwaseun",
"lastName": "Omoleye",
"role": "super-admin",
"email": "test@gmail.com",
"password": "test1234"
}'

Example Response
{
"success": false,
"code": 400,
"message": "Only admin or HR can be created"
}

=========================================================================================================================

POST: Register Staff

curl --location '/user/createStaff' \
--data-raw '{
"firstName": "Oluwaseun",
"lastName": "yusuf",
"role": "admin",
"email": "test12@gmail.com",
"password": "test1234"
}'

Example Response
{
"success": false,
"code": 403,
"message": "Access denied. Insufficient permission."
}

=========================================================================================================================

PATCH: Reset Password

curl --location --request PATCH '/user/reset-password' \
--data '{
"id": "0e1b9703-e73d-4cf9-b057-2eefdff264c1",
"password": "test12345"
}'

Example Response
{
"success": false,
"code": 403,
"message": "You cannot reset a super admin password"
}

=========================================================================================================================

PATCH: Change Password

curl --location --request PATCH '/user/changePassword' \
--data '{
"oldPassword": "test123456",
"newPassword": "test1234"
}'

Example Response
{
"success": false,
"code": 401,
"message": "Incorrect old password"
}

=========================================================================================================================

for getting users and user detail refer to superadmin and how the backend has been done
