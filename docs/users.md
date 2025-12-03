POST
Register Staff

curl --location '/user/createStaff' \
--data-raw '{
"firstName": "Oluwaseun",
"lastName": "yusuf",
"role": "admin",
"email": "test12@gmail.com",
"password": "test1234"
}'
