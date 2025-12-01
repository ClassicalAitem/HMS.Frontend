okay in the case of "isDefaultPassword": true,
he login response will be : {
"success": false,
"code": 403,
"message": {
"data": "ce68faeb-bf9c-4148-82e6-b660c3baa202",
"message": "Please change your default password to proceed."
}
}

in this case open he chamge password route and now use
curl --location --request PATCH '/user/changePassword' \
--data '{
"oldPassword": "test123456",
"newPassword": "test1234"
}'

ofcourse the route now takes id at the end like: /user/changePassword/09312d0b-b072-4f08-8c8f-7ffd116f2394
