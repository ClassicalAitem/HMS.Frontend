Get Overall Metrics

curl --location '/metrics' \
--data ''

Example Response:

{
    "success": true,
    "code": 200,
    "message": "Operation Successful",
    "data": {
        "totalPatients": 22,
        "totalDependants": 9,
        "totalAdmittedPatients": 2,
        "totalDischargedPatients": 0,
        "totalPassedPatients": 0,
        "totalPendingReceipt": 0,
        "totalInvestigationRequestsPending": 2,
        "totalInStock": 1,
        "totalLowStock": 0,
        "totalOutOfStock": 0,
        "totalLabResultCritical": 0,
        "totalLabResultHigh": 1,
        "totalLabResultLow": 0,
        "totalLabResultNormal": 0,
        "totalTodayVital": 0,
        "totalPatientsCheckIn": 0,
        "totalRevenueToday": 0,
        "totalMonthlyRevenue": 0,
        "totalTodayAppointment": 0,
        "totalDepartments": 0
    }
}

======================================================================================================================

Get Overall Staff

curl --location '/metrics/getOverallStaff' \
--data ''

Example Response

{
"success": true,
"code": 200,
"message": "Operation Successful",
"data": {
"totalDoctors": 1,
"totalNurses": 2,
"totalPharmacists": 0,
"totalLabScientists": 0,
"totalCashiers": 3,
"totalAdmin": 4,
"totalFrontDesk": 2,
"totalOtherStaff": 0,
"totalHr": 1,
"totalAccountOfficers": 0,
"totalActiveStaff": 13,
"totalDefaultPassword": 3
}
}

======================================================================================================================

Get Monthly admission

curl --location '/metrics/gwtMonthlyAdmissions?month=10&year=2025'

Example Response:
{
"success": true,
"code": 200,
"message": "Operation Successful",
"data": {
"totalAdmittedPatients": 2,
"totalDischargedPatients": 0,
"totalPassedPatients": 0
}
}

======================================================================================================================

Get Monthly admission

curl --location '/metrics/gwtMonthlyAdmissions?month=10&year=2025'

Example Response:
{
"success": true,
"code": 200,
"message": "Operation Successful",
"data": {
"totalAdmissions": 2
}
}
