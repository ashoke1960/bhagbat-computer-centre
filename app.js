/* ==========================================================================
   GLOBAL STATE & INITIALIZATION
   ========================================================================== */
const STORAGE_KEYS = {
    STUDENTS: 'sms_students_data',
    TEACHERS: 'sms_teachers_data',
    MARKS: 'sms_marks_data',
    SUBJECTS: 'sms_subjects_data',
    SETTINGS: 'sms_settings_data'
};

// Default Initial Data Structures
let appState = {
    students: JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS)) || [
        { id: 1, roll: 101, name: "Aarav Sharma", class: "Class IX", section: "A", pass: "stud101", photo: "" },
        { id: 2, roll: 102, name: "Ananya Roy", class: "Class IX", section: "A", pass: "stud102", photo: "" }
    ],
    teachers: JSON.parse(localStorage.getItem(STORAGE_KEYS.TEACHERS)) || [
        { id: 1, name: "S. K. Ganguly", class: "Class IX", section: "A", subject: "Information Technology", pass: "teach123" }
    ],
    subjects: JSON.parse(localStorage.getItem(STORAGE_KEYS.SUBJECTS)) || [
        "English", "Mathematics", "Science", "Social Science", "Information Technology"
    ],
    marks: JSON.parse(localStorage.getItem(STORAGE_KEYS.MARKS)) || {},
    settings: JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || {
        classTeacherSig: "",
        principalSig: "",
        schoolLogo: "",
        schoolBanner: ""
    }
};

const CLASSES = ["Class I", "Class II", "Class III", "Class IV", "Class V", "Class VI", "Class VII", "Class VIII", "Class IX", "Class X"];
const SECTIONS = ["A", "B", "C"];

document.addEventListener("DOMContentLoaded", () => {
    initDropdowns();
    refreshDashboard();
    populateStudentRegistryTable();
    populateTeacherTable();
    loadSignaturesAndBranding();
    
    // Default Tab Setup
    switchTab('dashboardTab');
});

function saveData(key) {
    localStorage.setItem(STORAGE_KEYS[key.toUpperCase()], JSON.stringify(appState[key]));
}

/* ==========================================================================
   NAVIGATION & TAB MANAGEMENT
   ========================================================================== */
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    const targetTab = document.getElementById(tabId);
    if (targetTab) targetTab.classList.remove('hidden');

    if (tabId === 'dashboardTab') refreshDashboard();
    if (tabId === 'marksTab') loadStudentMarksEntry();
}

/* ==========================================================================
   DROPDOWN CONTROLLERS & DATA LINKING
   ========================================================================== */
function initDropdowns() {
    const fillSelect = (id, options) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerHTML = options.map(opt => `<option value="${opt}">${opt}</option>`).join('');
    };

    // Populate Filters & Selects
    fillSelect('studentFilterClass', ['All Classes', ...CLASSES]);
    fillSelect('studentFilterSection', ['All Sections', ...SECTIONS]);
    fillSelect('marksClass', CLASSES);
    fillSelect('marksSection', SECTIONS);
    fillSelect('reportClass', CLASSES);
    fillSelect('reportSection', SECTIONS);
    fillSelect('marksSubject', appState.subjects);

    // Initial load for linked dropdowns
    onReportDropdownLinkChange();
}

function onReportDropdownLinkChange() {
    const selectedClass = document.getElementById('reportClass')?.value;
    const selectedSec = document.getElementById('reportSection')?.value;

    const filteredStudents = appState.students.filter(
        s => s.class === selectedClass && s.section === selectedSec
    );

    const studentSelect = document.getElementById('reportStudent');
    if (studentSelect) {
        studentSelect.innerHTML = filteredStudents.length
            ? filteredStudents.map(s => `<option value="${s.id}">Roll ${s.roll} - ${s.name}</option>`).join('')
            : `<option value="">No Students Found</option>`;
    }

    const examSelect = document.getElementById('reportExamSelect');
    if (examSelect && examSelect.children.length === 0) {
        const exams = ["Periodic Test-1", "Half Yearly Exam", "Periodic Test-2", "Annual Exam"];
        examSelect.innerHTML = exams.map(e => `<option value="${e}">${e}</option>`).join('');
    }
}

/* ==========================================================================
   DASHBOARD & STATS MANAGEMENT
   ========================================================================== */
function refreshDashboard() {
    document.getElementById('dash_student_count').innerText = appState.students.length;
    document.getElementById('dash_teacher_count').innerText = appState.teachers.length;
    document.getElementById('dash_assign_count').innerText = appState.teachers.length;
    
    // Count total unique marks records stored
    let recordCount = 0;
    Object.keys(appState.marks).forEach(key => {
        recordCount += Object.keys(appState.marks[key]).length;
    });
    document.getElementById('dash_marks_count').innerText = recordCount;
}

/* ==========================================================================
   STUDENT & TEACHER REGISTRY RENDERING
   ========================================================================== */
function populateStudentRegistryTable() {
    const tbody = document.getElementById('studentRegistryTableBody');
    if (!tbody) return;

    const filterClass = document.getElementById('studentFilterClass').value;
    const filterSec = document.getElementById('studentFilterSection').value;

    const filtered = appState.students.filter(s => {
        const matchClass = (filterClass === 'All Classes' || s.class === filterClass);
        const matchSec = (filterSec === 'All Sections' || s.section === filterSec);
        return matchClass && matchSec;
    });

    tbody.innerHTML = filtered.map(s => `
        <tr class="hover:bg-slate-50 transition-colors">
            <td class="p-3 text-center">
                <div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs mx-auto overflow-hidden">
                    ${s.photo ? `<img src="${s.photo}" class="w-full h-full object-cover">` : s.name.charAt(0)}
                </div>
            </td>
            <td class="p-3 text-center font-bold text-slate-700">${s.roll}</td>
            <td class="p-3 font-semibold text-slate-800">${s.name}</td>
            <td class="p-3 text-slate-600">${s.class}</td>
            <td class="p-3 text-slate-600">${s.section}</td>
            <td class="p-3 font-mono text-xs text-slate-500">${s.pass}</td>
            <td class="p-3 text-center">
                <button onclick="deleteStudent(${s.id})" class="text-rose-600 hover:text-rose-800 text-xs font-bold">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function deleteStudent(id) {
    if (confirm("Are you sure you want to remove this student?")) {
        appState.students = appState.students.filter(s => s.id !== id);
        saveData('students');
        populateStudentRegistryTable();
        refreshDashboard();
    }
}

function populateTeacherTable() {
    const tbody = document.getElementById('teacherAssignmentTableBody');
    if (!tbody) return;

    tbody.innerHTML = appState.teachers.map(t => `
        <tr class="hover:bg-slate-50 transition-colors">
            <td class="p-4 font-semibold text-slate-800">${t.name}</td>
            <td class="p-4 text-slate-600">${t.class}</td>
            <td class="p-4 text-slate-600">${t.section}</td>
            <td class="p-4 font-bold text-indigo-600">${t.subject}</td>
            <td class="p-4 font-mono text-xs text-slate-500">${t.pass}</td>
            <td class="p-4 text-center">
                <button onclick="deleteTeacher(${t.id})" class="text-rose-600 hover:text-rose-800 text-xs font-bold">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function deleteTeacher(id) {
    if (confirm("Delete this teacher assignment?")) {
        appState.teachers = appState.teachers.filter(t => t.id !== id);
        saveData('teachers');
        populateTeacherTable();
        refreshDashboard();
    }
}

/* ==========================================================================
   MARKS ENTRY & AUTOMATIC EVALUATION SYSTEM
   ========================================================================== */
function applyGlobalMaxLimits() {
    const fmWritten = parseInt(document.getElementById('gFM_Written').value) || 0;
    const fmPractical = parseInt(document.getElementById('gFM_Practical').value) || 0;

    const guideline = document.getElementById('subjectMarksGuideline');
    if (guideline) {
        guideline.innerText = `Theory Max: ${fmWritten} | Practical Max: ${fmPractical}`;
    }

    // Recalculate row scores live on boundary changes
    const rows = document.querySelectorAll('#marksGridTableBody tr');
    rows.forEach(row => calculateRowTotal(row));
}

function loadStudentMarksEntry() {
    const tbody = document.getElementById('marksGridTableBody');
    if (!tbody) return;

    const currentClass = document.getElementById('marksClass').value;
    const currentSec = document.getElementById('marksSection').value;
    const currentSubject = document.getElementById('marksSubject').value;
    const currentExam = document.getElementById('marksExam').value;
    const currentSession = document.getElementById('marksSession').value;

    document.getElementById('selectedSubjectStatus').innerHTML = 
        `<i class="fa-solid fa-circle-info text-indigo-600 mr-1"></i> Active: ${currentSubject} (${currentExam})`;

    const filteredStudents = appState.students.filter(
        s => s.class === currentClass && s.section === currentSec
    );

    const recordKey = `${currentSession}_${currentClass}_${currentSec}_${currentExam}_${currentSubject}`;
    const existingMarks = appState.marks[recordKey] || {};

    if (filteredStudents.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" class="p-6 text-slate-400 italic">No registered students found for this class & section.</td></tr>`;
        return;
    }

    tbody.innerHTML = filteredStudents.map(s => {
        const entry = existingMarks[s.id] || { written: 0, practical: 0, weightage: 0, subEnrich: 0, copySub: 0 };
        return `
            <tr data-student-id="${s.id}" class="divide-x divide-slate-100 hover:bg-slate-50">
                <td class="p-2 font-bold text-slate-700">${s.roll}</td>
                <td class="p-2 text-left font-semibold text-slate-800">${s.name}</td>
                <td class="p-2">
                    <input type="number" min="0" value="${entry.written}" oninput="calculateRowTotal(this.closest('tr'))" class="inp-written w-16 text-center border rounded py-1 font-bold text-indigo-700 focus:ring-1 focus:ring-indigo-500">
                </td>
                <td class="p-2">
                    <input type="number" min="0" value="${entry.practical}" oninput="calculateRowTotal(this.closest('tr'))" class="inp-practical w-16 text-center border rounded py-1 font-bold text-emerald-700 focus:ring-1 focus:ring-emerald-500">
                </td>
                <td class="p-2 col-pt-only">
                    <input type="number" min="0" value="${entry.weightage}" oninput="calculateRowTotal(this.closest('tr'))" class="inp-weightage w-14 text-center border rounded py-1 text-slate-600">
                </td>
                <td class="p-2 col-pt-only">
                    <input type="number" min="0" value="${entry.subEnrich}" oninput="calculateRowTotal(this.closest('tr'))" class="inp-subenrich w-14 text-center border rounded py-1 text-purple-600">
                </td>
                <td class="p-2 col-pt-only">
                    <input type="number" min="0" value="${entry.copySub}" oninput="calculateRowTotal(this.closest('tr'))" class="inp-copysub w-14 text-center border rounded py-1 text-amber-600">
                </td>
                <td class="p-2 font-black text-slate-900 row-total">0</td>
                <td class="p-2 font-bold text-blue-900 row-percentage">0%</td>
                <td class="p-2 font-extrabold row-grade text-indigo-950">-</td>
            </tr>
        `;
    }).join('');

    // Initial total calculations for pre-filled values
    document.querySelectorAll('#marksGridTableBody tr').forEach(row => calculateRowTotal(row));
}

function calculateRowTotal(row) {
    const fmWritten = parseFloat(document.getElementById('gFM_Written').value) || 0;
    const fmPractical = parseFloat(document.getElementById('gFM_Practical').value) || 0;
    const totalFM = fmWritten + fmPractical;

    const written = parseFloat(row.querySelector('.inp-written')?.value) || 0;
    const practical = parseFloat(row.querySelector('.inp-practical')?.value) || 0;
    const weightage = parseFloat(row.querySelector('.inp-weightage')?.value) || 0;
    const subEnrich = parseFloat(row.querySelector('.inp-subenrich')?.value) || 0;
    const copySub = parseFloat(row.querySelector('.inp-copysub')?.value) || 0;

    const totalObtained = written + practical + weightage + subEnrich + copySub;
    const percentage = totalFM > 0 ? ((totalObtained / totalFM) * 100).toFixed(1) : 0;

    row.querySelector('.row-total').innerText = totalObtained;
    row.querySelector('.row-percentage').innerText = `${percentage}%`;
    row.querySelector('.row-grade').innerText = calculateGrade(percentage);
}

function calculateGrade(percentage) {
    if (percentage >= 91) return 'A1';
    if (percentage >= 81) return 'A2';
    if (percentage >= 71) return 'B1';
    if (percentage >= 61) return 'B2';
    if (percentage >= 51) return 'C1';
    if (percentage >= 41) return 'C2';
    if (percentage >= 33) return 'D';
    return 'E (Needs Improvement)';
}

function saveEnteredMarks(showAlert = true) {
    const currentClass = document.getElementById('marksClass').value;
    const currentSec = document.getElementById('marksSection').value;
    const currentSubject = document.getElementById('marksSubject').value;
    const currentExam = document.getElementById('marksExam').value;
    const currentSession = document.getElementById('marksSession').value;

    const recordKey = `${currentSession}_${currentClass}_${currentSec}_${currentExam}_${currentSubject}`;
    appState.marks[recordKey] = appState.marks[recordKey] || {};

    const rows = document.querySelectorAll('#marksGridTableBody tr');
    rows.forEach(row => {
        const studentId = row.getAttribute('data-student-id');
        if (!studentId) return;

        appState.marks[recordKey][studentId] = {
            written: parseFloat(row.querySelector('.inp-written')?.value) || 0,
            practical: parseFloat(row.querySelector('.inp-practical')?.value) || 0,
            weightage: parseFloat(row.querySelector('.inp-weightage')?.value) || 0,
            subEnrich: parseFloat(row.querySelector('.inp-subenrich')?.value) || 0,
            copySub: parseFloat(row.querySelector('.inp-copysub')?.value) || 0,
            total: parseFloat(row.querySelector('.row-total')?.innerText) || 0,
            grade: row.querySelector('.row-grade')?.innerText || '-'
        };
    });

    saveData('marks');
    if (showAlert) alert("Marks entry saved successfully!");
    refreshDashboard();
}

/* ==========================================================================
   OFFICIAL DIGITAL SIGNATURES & BRANDING MEDIA
   ========================================================================== */
let currentSigTarget = "";

function triggerSignatureUpload(target) {
    currentSigTarget = target;
    document.getElementById('signatureFileInput').click();
}

function handleSignatureSelected(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 150 * 1024) {
        alert("File size exceeds limit! Please select an image under 150 KB.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const base64Img = e.target.result;
        if (currentSigTarget === 'ClassTeacher') {
            appState.settings.classTeacherSig = base64Img;
            document.getElementById('previewClassTeacherSig').innerHTML = `<img src="${base64Img}" class="max-h-full max-w-full object-contain">`;
        } else if (currentSigTarget === 'Principal') {
            appState.settings.principalSig = base64Img;
            document.getElementById('previewPrincipalSig').innerHTML = `<img src="${base64Img}" class="max-h-full max-w-full object-contain">`;
        }
        saveData('settings');
    };
    reader.readAsDataURL(file);
}

function loadSignaturesAndBranding() {
    if (appState.settings.classTeacherSig) {
        document.getElementById('previewClassTeacherSig').innerHTML = `<img src="${appState.settings.classTeacherSig}" class="max-h-full max-w-full object-contain">`;
    }
    if (appState.settings.principalSig) {
        document.getElementById('previewPrincipalSig').innerHTML = `<img src="${appState.settings.principalSig}" class="max-h-full max-w-full object-contain">`;
    }
}

function triggerSchoolLogoUpload() { document.getElementById('schoolLogoFileInput').click(); }
function triggerSchoolBannerUpload() { document.getElementById('schoolBannerFileInput').click(); }

function handleSchoolLogoSelected(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
        appState.settings.schoolLogo = evt.target.result;
        saveData('settings');
        alert("School Logo updated!");
    };
    reader.readAsDataURL(file);
}

function handleSchoolBannerSelected(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
        appState.settings.schoolBanner = evt.target.result;
        saveData('settings');
        alert("School Name Banner updated!");
    };
    reader.readAsDataURL(file);
}

function resetToDefaultLogo() {
    appState.settings.schoolLogo = "";
    saveData('settings');
    alert("Logo reset to default.");
}

function resetToDefaultBanner() {
    appState.settings.schoolBanner = "";
    saveData('settings');
    alert("Banner reset to default.");
}

/* ==========================================================================
   REPORT GENERATION & COMPILATION
   ========================================================================== */
let reportMode = 'single';

function toggleReportMode(mode) {
    reportMode = mode;
    const singleBtn = document.getElementById('printModeSingle');
    const bulkBtn = document.getElementById('printModeBulk');
    const studentWrapper = document.getElementById('studentSelectWrapper');

    if (mode === 'single') {
        singleBtn.className = "bg-white text-indigo-950 font-bold text-xs px-3 py-2 rounded-lg shadow-sm";
        bulkBtn.className = "text-slate-600 hover:bg-slate-50 font-semibold text-xs px-3 py-2 rounded-lg";
        studentWrapper.classList.remove('hidden');
    } else {
        bulkBtn.className = "bg-white text-indigo-950 font-bold text-xs px-3 py-2 rounded-lg shadow-sm";
        singleBtn.className = "text-slate-600 hover:bg-slate-50 font-semibold text-xs px-3 py-2 rounded-lg";
        studentWrapper.classList.add('hidden');
    }
}

function compileStudentReportCard() {
    const container = document.getElementById('bulkReportContainer');
    const targetClass = document.getElementById('reportClass').value;
    const targetSection = document.getElementById('reportSection').value;
    const targetExam = document.getElementById('reportExamSelect').value;
    const targetSession = document.getElementById('reportSession').value;

    let studentsToCompile = [];
    if (reportMode === 'single') {
        const studentId = document.getElementById('reportStudent').value;
        const student = appState.students.find(s => s.id == studentId);
        if (student) studentsToCompile.push(student);
    } else {
        studentsToCompile = appState.students.filter(s => s.class === targetClass && s.section === targetSection);
    }

    if (studentsToCompile.length === 0) {
        container.innerHTML = `<p class="text-center text-rose-500 py-12 font-bold">No student records found to compile.</p>`;
        return;
    }

    container.innerHTML = studentsToCompile.map(student => renderReportCardHTML(student, targetExam, targetSession)).join('<div class="my-8 border-b-2 border-dashed border-slate-300"></div>');
}

function renderReportCardHTML(student, exam, session) {
    // Generate marks table rows for each subject dynamically
    const subjectRows = appState.subjects.map(sub => {
        const key = `${session}_${student.class}_${student.section}_${exam}_${sub}`;
        const record = (appState.marks[key] && appState.marks[key][student.id]) ? appState.marks[key][student.id] : { written: '-', practical: '-', total: '-', grade: '-' };
        return `
            <tr class="border-b text-xs text-center">
                <td class="p-2 text-left font-semibold">${sub}</td>
                <td class="p-2">${record.written}</td>
                <td class="p-2">${record.practical}</td>
                <td class="p-2 font-bold">${record.total}</td>
                <td class="p-2 font-bold text-indigo-900">${record.grade}</td>
            </tr>
        `;
    }).join('');

    return `
        <div class="bg-white p-8 border rounded-xl shadow-sm text-slate-800 max-w-3xl mx-auto font-sans">
            <!-- Header Banner -->
            <div class="flex justify-between items-center border-b pb-4 mb-4">
                <div>
                    ${appState.settings.schoolLogo ? `<img src="${appState.settings.schoolLogo}" class="h-16">` : `<div class="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl">S</div>`}
                </div>
                <div class="text-center flex-1 px-4">
                    <h2 class="text-2xl font-black text-indigo-950 uppercase">Snehalata Public School</h2>
                    <p class="text-xs text-slate-500 font-medium">Academic Progress Report Card (${session})</p>
                </div>
                <div class="w-12"></div>
            </div>

            <!-- Student Info Matrix -->
            <div class="grid grid-cols-2 text-xs gap-2 mb-6 bg-slate-50 p-3 rounded-lg border">
                <div><strong>Student Name:</strong> ${student.name}</div>
                <div><strong>Class & Section:</strong> ${student.class} - ${student.section}</div>
                <div><strong>Roll No:</strong> ${student.roll}</div>
                <div><strong>Assessment Term:</strong> ${exam}</div>
            </div>

            <!-- Marks Details Table -->
            <table class="w-full text-left border-collapse border mb-6">
                <thead>
                    <tr class="bg-slate-100 text-slate-700 text-xs uppercase font-bold border-b">
                        <th class="p-2">Subject</th>
                        <th class="p-2 text-center">Theory</th>
                        <th class="p-2 text-center">Practical</th>
                        <th class="p-2 text-center">Total</th>
                        <th class="p-2 text-center">Grade</th>
                    </tr>
                </thead>
                <tbody>
                    ${subjectRows}
                </tbody>
            </table>

            <!-- Digital Signatures Authorization Block -->
            <div class="grid grid-cols-2 gap-8 mt-12 pt-4 border-t text-center text-xs">
                <div>
                    <div class="h-12 flex items-center justify-center">
                        ${appState.settings.classTeacherSig ? `<img src="${appState.settings.classTeacherSig}" class="max-h-full">` : `<span class="text-slate-300 italic">Pending Signature</span>`}
                    </div>
                    <p class="font-bold border-t pt-1 mt-1 text-slate-600">Class Teacher's Signature</p>
                </div>
                <div>
                    <div class="h-12 flex items-center justify-center">
                        ${appState.settings.principalSig ? `<img src="${appState.settings.principalSig}" class="max-h-full">` : `<span class="text-slate-300 italic">Pending Signature</span>`}
                    </div>
                    <p class="font-bold border-t pt-1 mt-1 text-slate-600">Principal's Signature</p>
                </div>
            </div>
        </div>
    `;
}

function launchA4PrintDialog() {
    const content = document.getElementById('bulkReportContainer').innerHTML;
    if (!content || content.includes('Click "Compile Report"')) {
        alert("Please compile the report card preview before printing.");
        return;
    }

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Print Report Cards</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    @media print {
                        body { padding: 0; background: #fff; }
                        .page-break { page-break-after: always; }
                    }
                </style>
            </head>
            <body class="bg-white p-6" onload="window.print(); window.close();">
                ${content}
            </body>
        </html>
    `);
    printWindow.document.close();
}

/* ==========================================================================
   BACKUP & RESTORE MODULE (JSON)
   ========================================================================== */
function downloadLocalBackup() {
    const backupData = JSON.stringify(appState, null, 2);
    const blob = new Blob([backupData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `SMS_Backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}