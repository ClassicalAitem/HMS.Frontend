okay twe will have to hit three endpoints for each section of the nurses dashboard.

firstly we have the section that says:::
Tasks Assigned
10
See Your Tasks

that number we will get it by hitting metrix endpoint.: /metrics
in the response we will use: {
"success": true,
"code": 200,
"message": "Operation Successful",
"data": {
"totalTodayVital": 0,
}
}

the second section:
incoming
incoming: Cameron Williamson sent by front desk 09:00 AM
incoming: Cameron Williamson sent by Doctor 09:00 AM
incoming: Cameron Williamson sent by front desk 09:00 AM
incoming: Cameron Williamson sent by front desk 09:00 AM

to get the data for incoming we will hit the endpoint: /patient

then we will filter the results to only have those that have status awaiting_injection, awaiting_sampling, awaiting_vitals

for this section show the latest 5 results

the last part: Recent Activity

here we will hit the endpoint: /vital?nurseId={nurseId} (in this case the nurse id is the user id yes)

during loading each section should have a skeleton loader
