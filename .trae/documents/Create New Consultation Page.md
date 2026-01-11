I have successfully created the new "Add New Consultation" page by refactoring the existing `AddDiagnosis.jsx` component to match your design.

**Key Changes:**
1.  **Page Layout**: Completely redesigned `AddDiagnosis.jsx` to match the provided screenshot.
    *   **Complaint Section**: Added a table layout with "Complaint Name" and "Duration".
    *   **History Sections**: Added "Past Medical History", "Past Surgical History", and "Past Allergy History" with pill-style tags.
    *   **Family History**: Added a table layout for family members and values.
    *   **Notes**: Added a large notes area.
    *   **Footer**: Added "Save Now" and "Next" buttons.

2.  **New Modals**: Created custom modals to handle adding items to each section:
    *   `AddComplaintModal.jsx`: For adding symptoms and duration.
    *   `AddFamilyHistoryModal.jsx`: For adding family relationships and values.
    *   `AddHistoryModal.jsx`: A generic modal for Medical, Surgical, and Allergy history.

3.  **Integration**:
    *   The "Add New Consultation" button in `MedicalHistoryTable.jsx` now leads to this new page.
    *   The page saves the data as a Consultation, formatting the new history fields into the `notes` and `symptoms` fields for backend compatibility.

**Code References:**
*   [AddDiagnosis.jsx](file:///e:\Documents\GitHub\HMS.Frontend\src\pages\doctor\incoming\AddDiagnosis.jsx) (The new Consultation Page)
*   [AddComplaintModal.jsx](file:///e:\Documents\GitHub\HMS.Frontend\src\pages\doctor\incoming\modals\AddComplaintModal.jsx)
*   [AddFamilyHistoryModal.jsx](file:///e:\Documents\GitHub\HMS.Frontend\src\pages\doctor\incoming\modals\AddFamilyHistoryModal.jsx)
*   [AddHistoryModal.jsx](file:///e:\Documents\GitHub\HMS.Frontend\src\pages\doctor\incoming\modals\AddHistoryModal.jsx)