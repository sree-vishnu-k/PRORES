// ========== QUESTIONS & SETUP ========== //
const questions = [
    { id: "name", text: "What is your full name?", required: true },
    { id: "title", text: "Your professional title or role?", required: true },
    { id: "address", text: "Your address?", required: true },
    { id: "phone", text: "Your phone number?", required: true },
    { id: "email", text: "Your email address?", required: true },
    { id: "linkedin", text: "LinkedIn profile URL?", required: true },
    { id: "github", text: "GitHub profile URL (optional)?", required: false },
    { id: "profilePic", text: "Upload your profile photo (optional)", required: false, type: "image" }, // Changed to required: false
    { id: "summary", text: "Write a short professional summary (3-5 lines, 40+ words).", required: true },
    { id: "educationBlock", text: "Start entering education details", customFlow: "education" },
    { id: "hasExperience", text: "Do you have work experience? (yes/no)", required: true },
    { id: "experienceBlock", text: "Add work experience", customFlow: "experience", dependsOn: "hasExperience", value: "yes" },
    { id: "hasProject", text: "Do you have any projects? (yes/no)", required: true },
    { id: "projectBlock", text: "Add projects", customFlow: "project", dependsOn: "hasProject", value: "yes" },
    { id: "certBlock", text: "Add certifications", customFlow: "cert" },
    { id: "achievementBlock", text: "Add achievements (one per line)", customFlow: "achievement" },
    { id: "skills", text: "List your technical skills (comma-separated, e.g., Python, HTML, CSS)", required: true },
    { id: "hobbies", text: "List your hobbies (comma-separated, e.g., Book Reading, Cycling)", required: false },
    { id: "languages", text: "Languages you speak (comma-separated, e.g., Tamil, English)", required: true },
    { id: "gender", text: "Gender? (e.g., Male, Female, Prefer not to say)", required: true },
    { id: "dob", text: "Date of birth (DD/MM/YYYY)?", required: true },
    { id: "nationality", text: "Nationality?", required: true }
];

let currentQuestionIndex = 0;
let answers = JSON.parse(localStorage.getItem("proresAnswers")) || {};

// Initialize multi-entry lists from loaded answers, ensuring they are arrays
let educationList = Array.isArray(answers.education) ? answers.education : [];
let experienceList = Array.isArray(answers.experiences) ? answers.experiences : [];
let projectList = Array.isArray(answers.projects) ? answers.projects : [];
let certList = Array.isArray(answers.certifications) ? answers.certifications : [];
let achievements = Array.isArray(answers.achievements) ? answers.achievements : [];

// Temporary objects for custom flow steps (scoped to current multi-entry item)
let tempEdu = {};
let tempExp = {};
let tempProj = {};
let tempCert = {};

// DOM Elements
const questionText = document.getElementById("questionText");
const answerInput = document.getElementById("answerInput");
const imageInput = document.getElementById("imageInput");
const progress = document.getElementById("progress");
const nextBtn = document.getElementById("nextBtn");
const backBtn = document.getElementById("backBtn");
const resumeSection = document.getElementById("resumeSection");
const questionBox = document.getElementById("questionBox");

// ======== DARK MODE TOGGLE ======== //
document.getElementById("toggleTheme").addEventListener("click", () => {
    document.body.classList.toggle("dark");
    document.body.classList.toggle("light");
});

// ======== SAVE TO LOCAL STORAGE ======== //
function saveData() {
    localStorage.setItem("proresAnswers", JSON.stringify(answers));
}

// ======== QUESTION FLOW ======== //
function showQuestion() {
    // If we've passed the last question, show the resume
    if (currentQuestionIndex >= questions.length) {
        showResume(answers);
        return;
    }

    const q = questions[currentQuestionIndex];

    // Handle conditional question skipping (forward only)
    if (q.dependsOn && answers[q.dependsOn]?.toLowerCase() !== q.value?.toLowerCase()) {
        currentQuestionIndex++;
        showQuestion(); // Recurse to check the next question
        return;
    }

    // Handle custom flows
    if (q.customFlow) {
        answerInput.style.display = "none"; // Hide regular input for custom flows
        imageInput.style.display = "none";
        switch (q.customFlow) {
            case "education": return collectEducation();
            case "experience": return collectExperience();
            case "project": return collectProjects();
            case "cert": return collectCerts();
            case "achievement": return collectAchievements();
        }
    } else {
        // Setup UI for regular questions
        questionText.textContent = q.text;
        answerInput.style.display = q.type === "image" ? "none" : "block";
        imageInput.style.display = q.type === "image" ? "block" : "none";
        answerInput.value = answers[q.id] || ""; // Populate with existing answer
        if (q.type === "image") {
            imageInput.value = ""; // Clear file input for new upload
        }
        answerInput.focus(); // Focus on the input field

        // Set general navigation handlers
        nextBtn.onclick = handleNext;
        backBtn.onclick = handleBack;
    }

    backBtn.disabled = currentQuestionIndex === 0;
    updateProgress();
}

function updateProgress() {
    // A simplified progress for now, as exact progress for dynamic flow steps is complex
    progress.style.width = ((currentQuestionIndex / questions.length) * 100) + "%";
}

// Handle Next for regular questions
function handleNext() {
    const q = questions[currentQuestionIndex];

    if (q.type === "image") {
        const file = imageInput.files[0];
        if (file && file.type.startsWith("image")) {
            const reader = new FileReader();
            reader.onload = () => {
                answers[q.id] = reader.result;
                saveData();
                currentQuestionIndex++;
                showQuestion(); // Continue to next question or show resume
            };
            reader.readAsDataURL(file);
        } else if (q.required && !answers[q.id]) { // If required and no existing image
            alert("Please upload a profile image.");
        } else { // If not required or already has an image, proceed
            // If image is optional and not uploaded, simply proceed
            answers[q.id] = answers[q.id] || ''; // Ensure it's not undefined if skipped
            saveData();
            currentQuestionIndex++;
            showQuestion();
        }
        return;
    }

    const val = answerInput.value.trim();
    if (q.required && !val) {
        alert("This field is required.");
        return;
    }
    answers[q.id] = val;
    saveData();
    currentQuestionIndex++;
    showQuestion();
}

// Handle Back for regular questions
function handleBack() {
    // If already at the first question, disable back
    if (currentQuestionIndex === 0) {
        backBtn.disabled = true;
        return;
    }

    // Loop backwards to find the next valid question
    do {
        currentQuestionIndex--;
        if (currentQuestionIndex < 0) { // Safety break
            currentQuestionIndex = 0;
            break;
        }
        const q = questions[currentQuestionIndex];

        // If the question is a conditional one and its dependency was NOT met (i.e., it was skipped forward),
        // then we should also skip it backwards.
        if (q.dependsOn && answers[q.dependsOn]?.toLowerCase() !== q.value?.toLowerCase()) {
            continue; // Continue looping back
        }

        // If it's a custom flow block that has no data (meaning it was skipped/answered 'no'),
        // and it has a dependency that caused it to be skipped, also skip it back.
        if (q.customFlow) {
            const listKey = q.customFlow === 'education' ? 'education' :
                                q.customFlow === 'experience' ? 'experiences' :
                                q.customFlow === 'project' ? 'projects' :
                                q.customFlow === 'cert' ? 'certifications' :
                                q.customFlow === 'achievement' ? 'achievements' : null;

            // If the custom flow block was skipped (e.g., user answered "no" to "hasExperience")
            // OR if no items were added to that list, then we should also skip this block backward too.
            if ((q.dependsOn && answers[q.dependsOn]?.toLowerCase() === 'no') || (listKey && Array.isArray(answers[listKey]) && answers[listKey].length === 0)) {
                continue; // Continue looping back
            }
        }
        // If we reached here, it's a valid question to go back to.
        break;

    } while (currentQuestionIndex > 0); // Keep looping as long as we're not at the first question

    showQuestion();
}

// Handle Clear
document.getElementById("clearBtn").onclick = () => {
    if (confirm("Clear all data? This cannot be undone.")) {
        localStorage.removeItem("proresAnswers");
        location.reload(); // Reload to reset all state
    }
};

// ======== MULTI-ENTRY FLOW LOGIC ========= //

/**
 * Handles the step-by-step collection for multi-entry sections.
 * @param {Array} steps - Array of objects, each representing a step (e.g., {id: 'degree', label: 'Degree?'}).
 * @param {Object} tempObj - Temporary object to store current entry's data (e.g., tempEdu).
 * @param {Array} dataList - The main array where completed entries are stored (e.g., educationList).
 * @param {string} blockName - A human-readable name for the block (e.g., "education", "experience").
 * @param {string} answersKey - The key in the `answers` object where the list will be stored (e.g., "education", "experiences").
 */
function collectStepFlow(steps, tempObj, dataList, blockName, answersKey) {
    answerInput.style.display = "block"; // Ensure input is visible for steps
    imageInput.style.display = "none"; // Ensure image input is hidden

    // Determine the current step index within the temporary object
    // Initialize to 0 if not set, or if an item was popped for re-editing, it might be steps.length - 1
    tempObj.step = tempObj.step ?? 0;

    // If all steps for the current entry are completed
    if (tempObj.step >= steps.length) {
        // Add the completed temporary entry to the main list
        dataList.push({ ...tempObj });
        answers[answersKey] = dataList; // Update main answers object immediately
        saveData();

        // Clear temporary data for the next entry
        for (let k in tempObj) delete tempObj[k];
        tempObj.step = 0; // Reset step for the next potential entry

        // Ask user if they want to add another item
        questionText.textContent = `Do you want to add another ${blockName}? (yes/no)`;
        answerInput.value = ""; // Clear input for yes/no question
        answerInput.focus();

        nextBtn.onclick = () => {
            const val = answerInput.value.trim().toLowerCase();
            if (val === "yes") {
                collectStepFlow(steps, tempObj, dataList, blockName, answersKey); // Start collecting a new entry
            } else if (val === "no") {
                currentQuestionIndex++; // Move to the next main question
                showQuestion();
            } else {
                alert("Please answer 'yes' or 'no'.");
            }
        };

        backBtn.onclick = () => {
            if (dataList.length > 0) {
                // If there are items, go back to editing the last one
                const lastItem = dataList.pop(); // Remove it from the list
                Object.assign(tempObj, lastItem); // Load last item back into tempObj
                tempObj.step = steps.length - 1; // Set step to the last step to allow re-editing
                // Also remove the current dataList from answers and save
                answers[answersKey] = dataList;
                saveData();
                collectStepFlow(steps, tempObj, dataList, blockName, answersKey); // Restart flow for that item
            } else {
                // If no items were added yet, go back to the previous main question (before this block)
                currentQuestionIndex--;
                showQuestion();
            }
        };
        return; // Exit as the state is handled by next/back click for yes/no
    }

    // Display the current step's question
    const currentStep = steps[tempObj.step];
    questionText.textContent = currentStep.label;
    answerInput.value = tempObj[currentStep.id] || ""; // Populate with existing temporary answer
    answerInput.focus();

    nextBtn.onclick = () => {
        const val = answerInput.value.trim();
        if (currentStep.required && !val) { // Use 'required' property from step definition
            return alert("This field is required.");
        }
        tempObj[currentStep.id] = val; // Store the input value directly
        tempObj.step++;
        collectStepFlow(steps, tempObj, dataList, blockName, answersKey); // Move to next step or completion check
    };

    backBtn.onclick = () => {
        if (tempObj.step > 0) {
            tempObj.step--;
            collectStepFlow(steps, tempObj, dataList, blockName, answersKey); // Go back one step
        } else {
            // If at the very first step of a new entry (tempObj.step is 0)
            if (dataList.length > 0) {
                // If items already exist, go back to the "Add another?" prompt
                questionText.textContent = `Do you want to add another ${blockName}? (yes/no)`;
                answerInput.value = "no"; // Default to 'no' when going back
                answerInput.focus();

                nextBtn.onclick = () => {
                    const val = answerInput.value.trim().toLowerCase();
                    if (val === "yes") {
                        collectStepFlow(steps, tempObj, dataList, blockName, answersKey);
                    } else if (val === "no") {
                        answers[answersKey] = dataList; // Save final state
                        saveData();
                        currentQuestionIndex++;
                        showQuestion();
                    } else {
                        alert("Please answer 'yes' or 'no'.");
                    }
                };
                backBtn.onclick = () => { // If user hits back again from yes/no prompt
                    currentQuestionIndex--; // Go back to the main question before this block
                    showQuestion();
                };
            } else {
                // If no items have been added yet, go back to the previous main question
                currentQuestionIndex--;
                showQuestion();
            }
        }
    };
}

// Individual custom flow functions, now calling the generic collectStepFlow
function collectEducation() {
    const steps = [
        { id: "degree", label: "Degree?", required: true },
        { id: "college", label: "College/University?", required: true },
        { id: "start", label: "Start year?", required: true },
        { id: "end", label: "End year?", required: true },
        { id: "cgpa", label: "CGPA or percentage?", required: false },
        { id: "courses", label: "Relevant courses (comma-separated)?", required: false }
    ];
    collectStepFlow(steps, tempEdu, educationList, "education", "education");
}

function collectExperience() {
    const steps = [
        { id: "company", label: "Company?", required: true },
        { id: "title", label: "Role?", required: true },
        { id: "start", label: "Start date (e.g., Jan 2020)?", required: true },
        { id: "end", label: "End date (e.g., Dec 2022 or Present)?", required: true },
        { id: "desc", label: "Brief description of responsibilities/achievements (max 2 lines)?", required: false }
    ];
    collectStepFlow(steps, tempExp, experienceList, "experience", "experiences");
}

function collectProjects() {
    const steps = [
        { id: "title", label: "Project title?", required: true },
        { id: "tech", label: "Technologies used (comma-separated)?", required: true },
        { id: "desc", label: "Brief description (max 2 lines)?", required: false }
    ];
    collectStepFlow(steps, tempProj, projectList, "project", "projects");
}

function collectCerts() {
    const steps = [
        { id: "title", label: "Certificate name?", required: true },
        { id: "org", label: "Issuing Organization?", required: true },
        { id: "date", label: "Date earned (e.g., May 2023)?", required: true }
    ];
    collectStepFlow(steps, tempCert, certList, "certificate", "certifications");
}

// Separate logic for achievements due to its simpler "list of strings" nature
function collectAchievements() {
    answerInput.style.display = "block"; // Ensure input is visible
    imageInput.style.display = "none";

    questionText.textContent = "Enter an achievement (e.g., 'Increased sales by 15% through X strategy'). Leave empty and click next if done.";
    answerInput.value = ""; // Clear for new input
    answerInput.focus();

    nextBtn.onclick = () => {
        const val = answerInput.value.trim();
        if (val) { // Only add if value is not empty
            achievements.push(val);
            answers.achievements = achievements; // Update and save after each achievement
            saveData();
            // Continue collecting more achievements
            collectAchievements();
        } else {
            // If user submits an empty value, it means they are done adding achievements
            currentQuestionIndex++;
            showQuestion(); // Move to the next main question
        }
    };

    backBtn.onclick = () => {
        if (achievements.length > 0 && answerInput.value.trim() === '') {
            // If there are achievements and current input is empty, go back to edit last one
            const lastAchievement = achievements.pop();
            answers.achievements = achievements;
            saveData();
            answerInput.value = lastAchievement; // Put last one back in input for editing
            questionText.textContent = "Edit last achievement:";
            answerInput.focus();
        } else if (achievements.length > 0 && answerInput.value.trim() !== '') {
            // If user was typing and clicked back, clear current input and go back to previous state
            answerInput.value = '';
            questionText.textContent = "Enter an achievement (e.g., 'Increased sales by 15% through X strategy'). Leave empty and click next if done.";
        }
        else {
            // If no achievements entered yet, go back to the previous main question
            currentQuestionIndex--;
            showQuestion();
        }
    };
}


// ======== RESUME RENDERING ======== //

// Updated renderList to support inline vs list display
function renderList(text, displayType = 'list') { // Default to 'list' if not specified
    if (!text) return '';
    const items = text.split(',').map(i => i.trim()).filter(i => i); // Ensure no empty items

    if (displayType === 'inline') {
        return `<p>${items.join(', ')}</p>`;
    } else { // 'list'
        return `<ul>${items.map(i => `<li>${i}</li>`).join("")}</ul>`;
    }
}


function showResume(data) {
    questionBox.style.display = "none";
    resumeSection.style.display = "block";

    const preview = document.getElementById("resumePreview");

    // Determine profile picture class
    const profilePicClass = data.profilePicAlign === 'left' ? 'profile-wrap left' : 'profile-wrap right';

    // Build personal info block
    const personalInfoHtml = `
        <h1>${data.name || ''}</h1>
        <p><strong>${data.title || ''}</strong></p>
        <p>${data.address || ''} | ${data.phone || ''} | ${data.email || ''}</p>
        <p>LinkedIn: <a href="${data.linkedin}" target="_blank" rel="noopener noreferrer">${data.linkedin || ''}</a> ${data.github ? `| GitHub: <a href="${data.github}" target="_blank" rel="noopener noreferrer">${data.github || ''}</a>` : ""}</p>
    `;

    // Wrap the entire resume content in a single div for consistent section handling
    preview.innerHTML = `
        <div id="resumeDocumentContent">
            ${data.profilePic ? `<div class="${profilePicClass}"><img src="${data.profilePic}" class="profile-img" alt="Profile" /></div>` : ''}
            ${personalInfoHtml}
            ${data.profilePic ? `<div style="clear: both;"></div>` : ''} ${data.summary ? `<div class="resume-section-block">
                <div class="section-header"><h2>Summary</h2></div><p class="clamp-3">${data.summary}</p>
            </div>` : ""}

            ${data.education?.length ? `<div class="resume-section-block">
                <div class="section-header"><h2>Education</h2></div>
                ${data.education.map(e => `<div class="education-item">
                    <div class="item-header">
                        <h3><strong>${e.degree || ''}</strong>, ${e.college || ''}</h3>
                        <span class="date-location">${e.start || ''} – ${e.end || ''}</span>
                    </div>
                    ${e.cgpa ? `<p>CGPA: ${e.cgpa}</p>` : ''}
                    ${e.courses ? `<p>Courses: ${e.courses}</p>` : ''}
                </div>`).join("")}
            </div>` : ""}

            ${data.experiences?.length ? `<div class="resume-section-block">
                <div class="section-header"><h2>Work Experience</h2></div>
                ${data.experiences.map(e => `<div class="experience-item">
                    <div class="item-header">
                        <h3><strong>${e.title || ''}</strong>, ${e.company || ''}</h3>
                        <span class="date-location">${e.start || ''} – ${e.end || ''}</span>
                    </div>
                    ${e.desc ? `<p class="clamp-2">${e.desc}</p>` : ''}
                </div>`).join("")}
            </div>` : ""}

            ${data.projects?.length ? `<div class="resume-section-block">
                <div class="section-header"><h2>Projects</h2></div>
                ${data.projects.map(p => `<div class="project-item">
                    <div class="item-header">
                        <h3><strong>${p.title || ''}</strong> (${p.tech || ''})</h3>
                        </div>
                    ${p.desc ? `<p class="clamp-2">${p.desc}</p>` : ''}
                </div>`).join("")}
            </div>` : ""}

            ${data.certifications?.length ? `<div class="resume-section-block">
                <div class="section-header"><h2>Certifications</h2></div>
                ${data.certifications.map(c => `<div class="cert-item">
                    <div class="item-header">
                        <p><strong>${c.title || ''}</strong>, ${c.org || ''}</p>
                        <span class="date-location">${c.date || ''}</span>
                    </div>
                </div>`).join("")}
            </div>` : ""}

            ${data.achievements?.length ? `<div class="resume-section-block">
                <div class="section-header"><h2>Achievements</h2></div>
                <ul>${data.achievements.map(a => `<li class="clamp-1">${a || ''}</li>`).join("")}</ul>
            </div>` : ""}

            ${data.skills ? `
                <div class="resume-section-block">
                    <div class="section-header"><h2>Skills</h2></div>
                    <div id="skillsListContainer">
                        ${renderList(data.skills, answers.skillsDisplay || 'list')}
                    </div>
                    <div class="list-display-options">
                        <label><input type="radio" name="skillsDisplay" value="list" ${answers.skillsDisplay !== 'inline' ? 'checked' : ''}> Bullet Points</label>
                        <label><input type="radio" name="skillsDisplay" value="inline" ${answers.skillsDisplay === 'inline' ? 'checked' : ''}> Inline</label>
                    </div>
                </div>
            ` : ""}

            ${data.hobbies ? `
                <div class="resume-section-block">
                    <div class="section-header"><h2>Hobbies</h2></div>
                    <div id="hobbiesListContainer">
                        ${renderList(data.hobbies, answers.hobbiesDisplay || 'list')}
                    </div>
                    <div class="list-display-options">
                        <label><input type="radio" name="hobbiesDisplay" value="list" ${answers.hobbiesDisplay !== 'inline' ? 'checked' : ''}> Bullet Points</label>
                        <label><input type="radio" name="hobbiesDisplay" value="inline" ${answers.hobbiesDisplay === 'inline' ? 'checked' : ''}> Inline</label>
                    </div>
                </div>
            ` : ""}

            ${data.languages ? `
                <div class="resume-section-block">
                    <div class="section-header"><h2>Languages</h2></div>
                    <div id="languagesListContainer">
                        ${renderList(data.languages, answers.languagesDisplay || 'list')}
                    </div>
                    <div class="list-display-options">
                        <label><input type="radio" name="languagesDisplay" value="list" ${answers.languagesDisplay !== 'inline' ? 'checked' : ''}> Bullet Points</label>
                        <label><input type="radio" name="languagesDisplay" value="inline" ${answers.languagesDisplay === 'inline' ? 'checked' : ''}> Inline</label>
                    </div>
                </div>
            ` : ""}

            ${data.gender || data.dob || data.nationality ? `<div class="resume-section-block">
                <div class="section-header"><h2>Additional Info</h2></div>
                <p>Gender: ${data.gender || ''} | DOB: ${data.dob || ''} | Nationality: ${data.nationality || ''}</p>
            </div>` : ""}
        </div>
    `;

    // --- Profile Picture Alignment Controls ---
    const customControlsDiv = document.querySelector('.custom-controls');
    if (customControlsDiv && data.profilePic && !document.getElementById('profilePicAlignmentOptions')) { // Check if controls already exist
        const profilePicAlignmentHtml = `
            <div id="profilePicAlignmentOptions" class="list-display-options">
                <span>Profile Picture Alignment:</span>
                <label><input type="radio" name="profilePicAlign" value="left" ${answers.profilePicAlign !== 'right' ? 'checked' : ''}> Left</label>
                <label><input type="radio" name="profilePicAlign" value="right" ${answers.profilePicAlign === 'right' ? 'checked' : ''}> Right</label>
            </div>
        `;
        customControlsDiv.insertAdjacentHTML('beforeend', profilePicAlignmentHtml);
    }
    // Re-attach event listener for alignment if controls exist (important for re-rendering)
    if (document.getElementById('profilePicAlignmentOptions')) {
        document.querySelectorAll('input[name="profilePicAlign"]').forEach(radio => {
            radio.addEventListener('change', (event) => {
                answers.profilePicAlign = event.target.value;
                saveData();
                const profileWrap = document.querySelector('.profile-wrap');
                if (profileWrap) {
                    profileWrap.classList.remove('left', 'right');
                    profileWrap.classList.add(answers.profilePicAlign);
                }
            });
        });
    }

    // --- Make the resume content directly editable ---
    const resumeContentDiv = document.getElementById("resumeDocumentContent"); // Changed to resumeDocumentContent
    if (resumeContentDiv) {
        resumeContentDiv.contentEditable = "true";
    }

    // --- Dynamic controls for Font Family and Line Height ---
    document.getElementById("fontFamilyControl").onchange = e => {
        preview.style.fontFamily = e.target.value;
    };

    const lineHeightControl = document.getElementById("lineHeightControl");
    const lineHeightValueSpan = document.getElementById("lineHeightValue");

    lineHeightControl.oninput = e => {
        preview.style.lineHeight = e.target.value;
        lineHeightValueSpan.textContent = e.target.value;
    };
    // Initialize spacing value to current state or a default if not set
    preview.style.lineHeight = lineHeightControl.value;
    lineHeightValueSpan.textContent = lineHeightControl.value;

    // --- Event Listeners for List Display Options ---
    // Skill Display Options
    document.querySelectorAll('input[name="skillsDisplay"]').forEach(radio => {
        radio.addEventListener('change', (event) => {
            answers.skillsDisplay = event.target.value;
            saveData();
            // Re-render only the skills section for efficiency
            document.getElementById("skillsListContainer").innerHTML = renderList(data.skills, answers.skillsDisplay);
        });
    });

    // Hobbies Display Options
    document.querySelectorAll('input[name="hobbiesDisplay"]').forEach(radio => {
        radio.addEventListener('change', (event) => {
            answers.hobbiesDisplay = event.target.value;
            saveData();
            document.getElementById("hobbiesListContainer").innerHTML = renderList(data.hobbies, answers.hobbiesDisplay);
        });
    });

    // Languages Display Options
    document.querySelectorAll('input[name="languagesDisplay"]').forEach(radio => {
        radio.addEventListener('change', (event) => {
            answers.languagesDisplay = event.target.value;
            saveData();
            document.getElementById("languagesListContainer").innerHTML = renderList(data.languages, answers.languagesDisplay);
        });
    });


    // --- Action Buttons ---
    document.getElementById("openNewTab").onclick = () => exportToWindow(answers, "view"); // Pass 'answers' not 'data'
    document.getElementById("mobilePrint").onclick = () => exportToWindow(answers, "print"); // Pass 'answers' not 'data'
    document.getElementById("editResumeBtn").onclick = editResume; // New edit button
}

// Function to handle editing from the review page
function editResume() {
    questionBox.style.display = "block";
    resumeSection.style.display = "none";
    currentQuestionIndex = 0; // Reset to the first question to allow full navigation
    showQuestion();
}

function exportToWindow(data, mode) {
    // Ensure the resume content is fully rendered and up-to-date
    // Call showResume to re-render the content based on the latest 'data'
    // This is important if you want contentEditable changes to be implicitly saved or refreshed.
    // However, if the intent is to capture live contentEditable changes *without* saving them back
    // to 'answers' first, then you would skip this line and directly get .outerHTML.
    // For now, `showResume` ensures that `resumeContentDiv` reflects the `data` object.
    showResume(data);

    // Get the *live* HTML content from the DOM after potential edits
    const resumeContentDiv = document.getElementById("resumeDocumentContent"); // Changed to resumeDocumentContent
    const content = resumeContentDiv ? resumeContentDiv.outerHTML : ''; // Ensure element exists

    const resumePreviewElement = document.getElementById("resumePreview");
    const previewStyle = window.getComputedStyle(resumePreviewElement);
    const font = previewStyle.fontFamily;
    const spacing = previewStyle.lineHeight;

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Resume Preview</title>
            <style>
                /* Font Imports - crucial for consistent look in new window */
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Roboto&family=Lato:wght@400;700&family=Georgia&family=Times+New_Roman&family=Calibri&display=swap');

                body {
                    font-family: ${font};
                    line-height: ${spacing};
                    padding: 40px; /* Standard A4 padding */
                    width: 794px; /* A4 width in pixels at 96 DPI */
                    min-height: 1122px; /* A4 height in pixels at 96 DPI */
                    color: #111;
                    margin: auto; /* Center the resume content */
                    box-sizing: border-box; /* Include padding in width/height */
                }
                /* Basic styling for the exported resume */
                h1, h2, h3 { color: #333; margin-bottom: 5px; }
                p { margin-bottom: 5px; }
                a { color: #007bff; text-decoration: none; }
                a:hover { text-decoration: underline; }
                ul { list-style-type: disc; padding-left: 20px; margin-bottom: 5px; }
                li { margin-bottom: 2px; }

                .section-header {
                    border-bottom: 1px dashed #ccc; /* Kept for title underline */
                    padding-bottom: 5px;
                    margin-top: 15px;
                    margin-bottom: 10px;
                }
                .section-header h2 {
                    margin: 0;
                    font-size: 1.2em;
                }
                .education-item, .experience-item, .project-item, .cert-item {
                    margin-bottom: 10px;
                }
                .item-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: baseline;
                    flex-wrap: wrap;
                }
                .item-header h3 {
                    margin: 0;
                    font-size: 1.1em;
                }
                .date-location {
                    font-size: 0.9em;
                    color: #555;
                }
                /* Ensure clamp properties work in exported HTML */
                .clamp-1, .clamp-2, .clamp-3 {
                    display: -webkit-box;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .clamp-1 { -webkit-line-clamp: 1; }
                .clamp-2 { -webkit-line-clamp: 2; }
                .clamp-3 { -webkit-line-clamp: 3; }

                .profile-wrap {
                    float: left; /* Default for export if not specified */
                    margin-right: 15px;
                    margin-bottom: 10px;
                    width: 100px; /* Adjusted passport size width */
                    height: 125px; /* Adjusted passport size height */
                }
                .profile-wrap.right {
                    float: right;
                    margin-left: 15px;
                    margin-right: 0;
                }
                .profile-img {
                    width: 100%; /* Make image fill its container */
                    height: 100%; /* Make image fill its container */
                    object-fit: cover; /* Cover the area while maintaining aspect ratio */
                    object-position: center; /* Center the image within the frame */
                    /* Removed border-radius for rectangular shape */
                }

                /* New styles for section blocks */
                .resume-section-block {
                    padding-bottom: 15px; /* Add padding before the line */
                    margin-bottom: 15px;  /* Add margin after the line */
                    border-bottom: 1px dashed #cccccc; /* Dashed line for section separation */
                }

                /* Remove border for the very last resume section block */
                #resumeDocumentContent > .resume-section-block:last-of-type {
                    border-bottom: none;
                    padding-bottom: 0;
                    margin-bottom: 0;
                }

                /* Hide list display options and profile pic alignment options in exported/print view */
                .list-display-options,
                #profilePicAlignmentOptions {
                    display: none !important;
                }

                /* Print-specific styles */
                @media print {
                    body {
                        font-size: 10pt; /* Adjust for print legibility */
                        padding: 0;
                        width: auto;
                        min-height: auto;
                        margin: 0;
                        color: #000;
                    }
                    /* Hide elements not meant for print */
                    .no-print { display: none; }
                    /* Adjust margins for sections to optimize page breaks */
                    .resume-section-block {
                        margin-top: 5px;
                        margin-bottom: 5px;
                        padding-bottom: 5px;
                        border-bottom: 1px dashed #ccc !important; /* Ensure border is visible in print */
                    }
                    #resumeDocumentContent > .resume-section-block:last-of-type {
                        border-bottom: none !important;
                    }
                    .section-header, .education-item, .experience-item, .project-item, .cert-item, ul, p {
                        margin-top: 5px;
                        margin-bottom: 5px;
                    }
                }
            </style>
        </head>
        <body>
            ${content}
        </body>
        </html>
    `;

    // Try to open the new window
    const newWindow = window.open("", "_blank"); // Use "" for URL and "_blank" for new tab/window
    if (newWindow) {
        newWindow.document.write(html);
        newWindow.document.close(); // Close the document stream to ensure content is fully written

        // IMPORTANT: Wait for the new window's content to load before printing
        if (mode === "print") {
            newWindow.onload = () => {
                // Introduce a small delay for rendering, especially on slower machines
                setTimeout(() => {
                    newWindow.print();
                    // Optionally, close the window after printing if it's for print only
                    // newWindow.close();
                }, 200); // 200ms delay should be sufficient
            };
        }
    } else {
        // This block will be executed if the pop-up was blocked
        alert("Pop-up blocked! Please allow pop-ups for this site to view/print your resume.");
    }
}

// Initial call to show the first question or resume if data exists
showQuestion();
