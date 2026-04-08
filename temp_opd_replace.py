import pathlib

root = pathlib.Path(r'C:\Users\TechArt\HMS.Frontend')
exts = {'.js', '.jsx', '.ts', '.tsx', '.json', '.md'}
replacements = [
    ('opd patients', 'OPD patients'),
    ('opd patient', 'OPD patient'),
    ('opd Patients', 'OPD Patients'),
    ('opd Patient', 'OPD Patient'),
    ('add-opd', 'add-opd'),
    ('process-opd-payment', 'process-opd-payment'),
    ('opdPatient', 'OpdPatient'),
    ('opdPatient', 'opdPatient'),
    ('opd-patients', 'opd-patients'),
    ('getAllopdPatients', 'getAllOpdPatients'),
    ('getopdPatientById', 'getOpdPatientById'),
    ('createopdPatient', 'createOpdPatient'),
    ('updateopdPatient', 'updateOpdPatient'),
    ('deleteopdPatient', 'deleteOpdPatient'),
    ('getBillingsByopdPatientId', 'getBillingsByOpdPatientId'),
    ('getReceiptsByopdPatientId', 'getReceiptsByOpdPatientId'),
    ('getInvestigationRequestByopdPatientId', 'getInvestigationRequestByOpdPatientId'),
    ('createBillForopd', 'createBillForOpd'),
    ('opdPatientId', 'opdPatientId'),
    ('opdPatientCards', 'opdPatientCards'),
    ('opdPatient', 'opdPatient'),
]

for path in root.rglob('*'):
    if path.suffix.lower() in exts and path.is_file():
        text = path.read_text(encoding='utf-8')
        new_text = text
        for old, new in replacements:
            new_text = new_text.replace(old, new)
        if new_text != text:
            path.write_text(new_text, encoding='utf-8')
            print('updated', path)

# Rename files and directories with 'opd' in the name, deepest first
for path in sorted(root.rglob('*'), key=lambda p: len(str(p)), reverse=True):
    if 'opd' in path.name:
        new_name = path.name.replace('opd', 'opd').replace('opd', 'Opd').replace('opd', 'OPD')
        if new_name != path.name:
            new_path = path.with_name(new_name)
            path.rename(new_path)
            print('renamed', path, '->', new_path)
