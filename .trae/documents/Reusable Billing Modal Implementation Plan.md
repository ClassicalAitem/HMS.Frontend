Based on your requirements, here is the plan to implement the reusable billing modal:

### **Objective**
Create a reusable "Send to Cashier" modal that allows staff (Doctors, Nurses, Front Desk, etc.) to attach a bill to a patient before sending them to the next stage (e.g., sending to a doctor requires paying a consultation fee first).

### **Workflow Understanding**
1.  **Staff Action**: A staff member (e.g., Front Desk) wants to send a patient to a Doctor.
2.  **Billing Interception**: Before the patient "moves," the system prompts the staff to create a bill (e.g., "Consultation Fee").
3.  **Bill Creation**: The staff adds items (Code, Description, Price) and submits.
4.  **Backend Action**: The app hits `POST /billing/create/{patientId}` with the item details.
5.  **Result**: A bill is created. The Cashier sees this, accepts payment, and *then* the patient is cleared to see the doctor (the "send to doctor" part might be a separate status update, but today we focus on the billing part).

### **Proposed Implementation Plan**

#### **1. Create Reusable Component: `CreateBillModal.jsx`**
*   **Location**: `src/components/modals/CreateBillModal.jsx`
*   **Props**:
    *   `isOpen`: Boolean to control visibility.
    *   `onClose`: Function to close the modal.
    *   `patientId`: ID of the patient being billed.
    *   `onSuccess`: Callback function to run after the bill is successfully created (e.g., close modal, show toast, trigger next workflow step).
    *   `defaultItems`: (Optional) Array of items to pre-fill the bill (e.g., pass `[{ code: 'consult', price: 5000 }]` if we know it's a consultation).
*   **State/Form**:
    *   Use `react-hook-form` + `useFieldArray` to allow adding multiple line items dynamically.
    *   Fields: `code` (e.g., "consult", "lab"), `description`, `quantity`, `price`.
    *   Calculated `total` (quantity * price).
    *   Grand Total display.
*   **API Integration**:
    *   It will call `createBill` from `billingAPI.js`.

#### **2. Update API Service (`billingAPI.js`)**
*   Ensure `createBill` correctly handles the payload structure defined in your documentation:
    ```json
    {
      "itemDetail": [ { "code": "...", "description": "...", "quantity": "...", "price": "...", "total": "..." } ]
    }
    ```
*   Verify the endpoint URL `/billing/create/{patientId}` is correctly constructed.

#### **3. Integration Example (Front Desk / Incoming Page)**
*   I will demonstrate how to use this modal. For example, on the **Patient Details** or **Incoming** page, we can add a "Send to Doctor" button.
*   Clicking this button opens `CreateBillModal`.
*   Upon success, we can show a message: "Bill created. Patient sent to Cashier queue."

### **Key Questions/Corrections**
*   **"Send to Cashier" vs. "Send to Doctor"**: You mentioned "when they pay at cashier, cashier will then send them to the doctor".
    *   *Clarification*: This modal essentially **pauses** the patient's journey. The Front Desk generates the bill. The patient goes to the Cashier. The *Cashier* (after payment) will be the one to actually "Send to Doctor" (change status).
    *   *My Plan*: This modal will **only** handle the `POST /billing/create` part. It won't change the patient's status to "Doctor" yet, because they haven't paid. It effectively puts them in a "Awaiting Payment" state (conceptually).

Does this align with your vision? Please correct me if I missed any nuance before I start coding.