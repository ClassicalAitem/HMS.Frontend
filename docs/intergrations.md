**Scope**

- Targets dashboards: `frontdesk`, `admin`, `superadmin`, `nurse`, `doctor`, `cashier`, plus lab/pharmacy modules where applicable.
- Aligns with backend docs at `https://documenter.getpostman.com/view/12343161/2sB3HnKKjB` and current frontend structure under `src/pages`, `src/store/slices`, and `src/services`.

**Frontdesk**

- Current Integrations
  - Patients list and details: active via Redux thunks (`fetchPatients`, `fetchPatientById`) using backend; on-demand fetch on navigation; no polling.
  - PatientDetails loading guard: active with skeleton overlays and route-transition guard to prevent stale flashes.
  - Registration: partially integrated; submits and navigates back but needs confirmed POST wiring to backend.
  - Limitations/issues:
    - Base URL env likely missing; endpoints use relative paths.
    - Role mapping mismatch (`frontdesk` vs backend `front-desk`) handled in routes but may be inconsistent elsewhere.
    - Search, pagination, and filters are local; need server integration.
- Proposed Future Integrations
  - Patients list: `GET /patients`, `GET /patients?q=&page=&limit=`; server-side filters, pagination, and sorting.
  - Patient details: `GET /patients/:id`; add dependants, vitals, appointments, billing history sections with respective endpoints.
  - Registration: `POST /patients`; support dependants and HMO payload; validation errors surfaced from `message`.
  - Appointments: `GET /appointments`, `POST /appointments`, `PATCH /appointments/:id`; frontdesk booking and check-in.
  - Expected benefits: accurate patient registry, faster triage, fewer manual steps, consistent status flows.
  - Technical requirements: axios client with interceptors, update patients slice, search/pagination UI, error normalization.
  - Dependencies: backend endpoints for patients and appointments; JWT auth.
  - Timeline:
    - Week 1: Service layer and login; wire patients list/details.
    - Week 2: Registration payload, server search/pagination; appointments create/list.

**Admin**

- Current Integrations
  - Dashboards: static placeholders; not wired to metrics.
  - Users management pages exist; creation/reset flows not wired.
- Proposed Future Integrations
  - Metrics cards: `GET /metrics` for ops counts.
  - Staff overview: `GET /metrics/getOverallStaff`.
  - User management: `POST /user/createAdmin`, `POST /user/createStaff`, `PATCH /user/resetPassword`, `GET /user/list` (confirm exact listing endpoint).
  - Expected benefits: centralized HR/admin operations, audit-ready user lifecycle.
  - Technical requirements: role-based protected actions, forms with validation, pagination.
  - Dependencies: admin privileges; consistent role strings; staff listing endpoint.
  - Timeline:
    - Week 1: Metrics cards.
    - Week 2: User create/reset; list with filters.

**SuperAdmin**

- Current Integrations
  - Dashboard counters: static values; no backend sync.
- Proposed Future Integrations
  - Organization-wide metrics: `GET /metrics`, `GET /metrics/getOverallStaff`.
  - Advanced admin: audit logs, system settings (endpoints TBD).
  - Expected benefits: live oversight, staffing distribution, governance.
  - Technical requirements: caching/polling strategy, skeletons, error toasts.
  - Dependencies: super-admin permissions; metrics endpoints.
  - Timeline:
    - Week 1: Wire metrics and staff counts.
    - Week 2: Add trend charts and optional polling.

**Nurse**

- Current Integrations
  - Dashboard scaffolding; appointments/tasks pages present; uses mock data.
- Proposed Future Integrations
  - Vitals: `POST /patients/:id/vitals`, `GET /patients/:id/vitals`.
  - Tasks: `GET /tasks?assignee=nurse`, `PATCH /tasks/:id`.
  - Appointments: `GET /appointments?assignee=nurse`.
  - Expected benefits: streamlined bedside workflows and task tracking.
  - Technical requirements: forms with validation, optimistic updates for tasks, pagination.
  - Dependencies: endpoints for vitals and tasks; nurse role authorization.
  - Timeline:
    - Week 3: Appointments/tasks list.
    - Week 4: Vitals capture and history.

**Doctor**

- Current Integrations
  - Appointments view uses local `data`; lab results page exists but not integrated.
- Proposed Future Integrations
  - Appointments: `GET /appointments?doctorId=...`, `PATCH /appointments/:id`.
  - Lab results: `GET /lab/results?patientId=...`, `POST /lab/requests`, `PATCH /lab/requests/:id`.
  - Prescriptions: `POST /prescriptions`, `GET /prescriptions?patientId=...`.
  - Expected benefits: clinical continuity, quicker diagnostics, prescription workflows.
  - Technical requirements: secure write endpoints, status transitions, attachments handling for lab results.
  - Dependencies: lab and pharmacy endpoints; doctor role permissions.
  - Timeline:
    - Week 3: Appointments, basic lab requests.
    - Week 4: Lab results and prescriptions.

**Cashier**

- Current Integrations
  - Incoming and patients pages use `cashierData.json` mock; no backend wire.
- Proposed Future Integrations
  - Billing: `GET /billing/receipts?status=pending`, `POST /billing/receipts`, `PATCH /billing/receipts/:id`.
  - Patients for cashier: `GET /patients?pendingReceipt=true`.
  - Metrics: `GET /metrics` (use `totalPendingReceipt`).
  - Expected benefits: faster payment processing, reduced manual reconciliation.
  - Technical requirements: amount calculations, receipt generation, printable views.
  - Dependencies: billing endpoints; cashier role authorization.
  - Timeline:
    - Week 4: Pending receipts list and payment flow.
    - Week 5: Reporting and exports.

**Lab/Pharmacy**

- Current Integrations
  - UI placeholders only; not wired.
- Proposed Future Integrations
  - Lab: `POST /lab/requests`, `GET /lab/requests?status=pending`, `GET /lab/results`, `PATCH /lab/requests/:id`.
  - Pharmacy: `GET /medications`, `POST /prescriptions`, `PATCH /prescriptions/:id`, `POST /dispense`.
  - Expected benefits: complete diagnostic and dispensing loop; inventory signals.
  - Technical requirements: attachment handling, barcode/ID support, status transitions.
  - Dependencies: endpoints availability; role permissions (`lab-scientist`, `pharmacist`).
  - Timeline:
    - Week 5–6: Lab then Pharmacy integrations.

**Data Synchronization**

- Frontdesk patients and details: on-demand on navigation; cached in Redux; no background sync or polling.
- Dashboards (currently): static; proposed polling every 60–120 seconds with backoff or manual refresh.
- Write operations: immediate API calls with success toasts and Redux updates; optional optimistic updates where safe (tasks, appointments).

**Known Limitations**

- Role naming: backend uses `front-desk`; frontend sometimes uses `frontdesk`. Map consistently at boundaries.
- Base URL env: `VITE_API_BASE_URL` likely unset; set via `.env` and `src/config/env.js`.
- Many modules use mock data; gaps include metrics, appointments, users, lab, pharmacy, cashier billing.
- Error envelope: backend returns `success`, `code`, `message`; normalize across slices and UIs.

**Security and Authentication**

- Use `Authorization: Bearer <token>` for protected endpoints.
- Store token in Redux + `localStorage` key `kolak_hospital_jwt`; hydrate on app load; clear on logout via `src/utils/logout.js`.
- Enforce change-password lock when `isDefaultPassword` is true; restrict all routes except `/change-password`.
- Protect routes via `ProtectedRoute` with `allowedRoles` aligned to backend roles (`front-desk`, `admin`, `super-admin`, `doctor`, `nurse`, `cashier`).
- Consider token refresh if supported; otherwise, handle expiry with redirect to login.

**Data Transformation**

- Map backend fields to UI models:
  - Users: `accountType` → role; timestamps → local time; flags → booleans in UI.
  - Patients: flatten nested `dependants`, `hmos`, vitals; guard against nulls.
  - Metrics: present only non-null counts; default to 0 in UI.
- Validation: surface backend `message` on form errors; show per-field errors if provided.

**Performance**

- Pagination and server-side filters for lists (`patients`, `users`, `appointments`).
- Virtualize long tables; debounce search inputs.
- Cache metrics per dashboard and optionally poll with ETag/If-None-Match if supported.
- Avoid overfetching; reuse Redux cache on route back/forward.

**Permissions**

- Centralize permission checks:
  - Button-level enable/disable based on `user.role`.
  - Hide routes with `ProtectedRoute` and redirect unauthorized access.
- Display clear 403 messaging and disable actions preemptively when user lacks permissions.

**Error Handling and Monitoring**

- Standardize API error handling:
  - Interceptor extracts `code` and `message`; show toast and inline alerts where appropriate.
  - Retry strategy for transient network errors (up to 2 retries with jitter).
- Logging:
  - Console logs for dev; aggregate error context (endpoint, status).
  - Optional integration with monitoring (e.g., Sentry) for production.
- UX fallbacks:
  - Skeletons during load; empty states with recovery actions; “Try again” buttons.

**Technical Foundation**

- HTTP client: `src/services/api/client.ts` using `axios` with:
  - Base URL from `VITE_API_BASE_URL`.
  - Request interceptor adding `Authorization` when token exists.
  - Response interceptor normalizing envelopes and handling 401/403.
- Redux slices:
  - `authSlice`: login, logout, change-password, hydration.
  - `patientsSlice`: list/detail/register/update.
  - `metricsSlice`: overall and staff metrics.
  - Role-specific slices: appointments, tasks, billing, lab, pharmacy.
- Config:
  - `.env`: `VITE_API_BASE_URL=https://<host>`
  - `src/config/env.js` reads env; provide sensible defaults for dev.

**Phased Timeline**

- Phase 0 (Setup, 1–2 days)
  - Axios client, interceptors, env config, error normalization, token persistence.
- Phase 1 (Week 1)
  - Login flow with `POST /user/login`.
  - Frontdesk patients list/details.
  - SuperAdmin/Admin metrics wiring (`GET /metrics`, `GET /metrics/getOverallStaff`).
- Phase 2 (Week 2)
  - Frontdesk registration `POST /patients`.
  - Server-side search/pagination for patients.
  - Admin user create/reset flows.
- Phase 3 (Week 3)
  - Nurse/Doctor appointments lists and updates.
  - Nurse tasks.
- Phase 4 (Week 4)
  - Doctor lab requests and results.
  - Doctor prescriptions.
- Phase 5 (Week 4–5)
  - Cashier billing: pending receipts, payment flow, print/export.
- Phase 6 (Week 5–6)
  - Pharmacy dispensing and inventory signals.
  - Enhancements: polling, charts, exports, audit logs.

If you’d like, I can start by scaffolding the API client and wiring login plus dashboard metrics, then move sequentially through the frontdesk modules.
