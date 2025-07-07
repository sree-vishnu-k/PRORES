// ======= QUESTION SETUP ======= //
const questions = [
  { id: "name", text: "What is your full name?", required: true },
  { id: "title", text: "Your title (e.g., Computer Science Student)?", required: true },
  { id: "address", text: "Your address?", required: true },
  { id: "phone", text: "Your phone number?", required: true },
  { id: "email", text: "Your email address?", required: true },
  { id: "linkedin", text: "Your LinkedIn profile?", required: true },
  { id: "github", text: "Your GitHub profile (optional)?", required: false },
  { id: "profilePic", text: "Upload your profile picture", required: true, type: "image" },

  { id: "education", text: "Your Degree and College (e.g., B.Sc CS, Gobi Arts)?", required: true },
  { id: "eduDuration", text: "Study duration (e.g., 2023–2026)?", required: true },
  { id: "cgpa", text: "Your CGPA or percentage?", required: true },
  { id: "courses", text: "Mention relevant courses (comma-separated)?", required: true },

  { id: "hasExperience", text: "Do you have any work experience? (yes/no)", required: true },
  { id: "experience", text: "Describe your work experience briefly", required: false, dependsOn: "hasExperience", value: "yes" },

  { id: "projects", text: "List any projects (title, tech used, brief desc)", required: false },
  { id: "skills", text: "List your core skills (comma-separated)", required: false },
  { id: "achievements", text: "Any achievements?", required: false },
  { id: "certificates", text: "Certificates or workshops attended?", required: false },
  { id: "hobbies", text: "List your hobbies (comma-separated)", required: true },
  { id: "languages", text: "Languages you speak (comma-separated)", required: false },
  { id: "gender", text: "Your gender?", required: true },
  { id: "dob", text: "Your date of birth (DD/MM/YYYY)?", required: true },
  { id: "nationality", text: "Your nationality?", required: true }
];

// ======= VARIABLES ======= //
let currentQuestion = 0;
let answers = JSON.parse(localStorage.getItem("proresAnswers")) || {};

const questionText = document.getElementById("questionText");
const answerInput = document.getElementById("answerInput");
const imageInput = document.getElementById("imageInput");
const progress = document.getElementById("progress");
const nextBtn = document.getElementById("nextBtn");
const backBtn = document.getElementById("backBtn");

// ======= SHOW QUESTION ======= //
function showQuestion() {
  const q = questions[currentQuestion];

  // Handle conditional questions
  if (q.dependsOn && answers[q.dependsOn]?.toLowerCase() !== q.value.toLowerCase()) {
    currentQuestion++;
    showQuestion();
    return;
  }

  questionText.textContent = q.text;

  if (q.type === "image") {
    answerInput.style.display = "none";
    imageInput.style.display = "block";
  } else {
    answerInput.style.display = "block";
    imageInput.style.display = "none";
    answerInput.value = answers[q.id] || "";
  }

  backBtn.disabled = currentQuestion === 0;
  updateProgress();
}

// ======= NEXT BUTTON ======= //
nextBtn.addEventListener("click", () => {
  const q = questions[currentQuestion];

  if (q.type === "image") {
    const file = imageInput.files[0];
    if (file && file.type.startsWith("image")) {
      const reader = new FileReader();
      reader.onload = () => {
        answers[q.id] = reader.result;
        saveData();
        nextStep();
      };
      reader.readAsDataURL(file);
    } else {
      alert("Please upload a valid image.");
    }
    return;
  }

  const value = answerInput.value.trim();
  if (q.required && !value) {
    alert("This field is required.");
    return;
  }

  answers[q.id] = value;
  saveData();
  nextStep();
});

// ======= BACK BUTTON ======= //
backBtn.addEventListener("click", () => {
  do {
    currentQuestion--;
  } while (currentQuestion > 0 && questions[currentQuestion].dependsOn &&
    answers[questions[currentQuestion].dependsOn]?.toLowerCase() !== questions[currentQuestion].value.toLowerCase()
  );
  showQuestion();
});

// ======= PROGRESS BAR ======= //
function updateProgress() {
  const percent = (currentQuestion / questions.length) * 100;
  progress.style.width = percent + "%";
}

// ======= NEXT STEP ======= //
function nextStep() {
  currentQuestion++;
  if (currentQuestion >= questions.length) {
    showResume(answers);
  } else {
    showQuestion();
  }
}

// ======= LOCAL STORAGE ======= //
function saveData() {
  localStorage.setItem("proresAnswers", JSON.stringify(answers));
}

function clearData() {
  localStorage.removeItem("proresAnswers");
  answers = {};
  currentQuestion = 0;
  location.reload();
}

// ======= THEME TOGGLE ======= //
document.getElementById("toggleTheme").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  document.body.classList.toggle("light");
});

// ======= CLEAR BUTTON ======= //
document.getElementById("clearBtn").addEventListener("click", clearData);

// ======= RESUME PREVIEW ======= //
function renderList(text) {
  if (!text) return '';
  const items = text.split(',').map(item => item.trim()).filter(Boolean);
  return `<ul>${items.map(item => `<li>${item}</li>`).join('')}</ul>`;
}

function showResume(data) {
  document.getElementById("questionBox").style.display = "none";
  document.getElementById("resumeSection").style.display = "block";

  const preview = document.getElementById("resumePreview");

  preview.innerHTML = `
    <div>
      <img src="${data.profilePic}" class="profile-img" alt="Profile Photo" />
      <h1>${data.name}</h1>
      <p><strong>${data.title}</strong></p>
      <p>${data.address} | ${data.phone} | ${data.email}</p>
      <p>LinkedIn: ${data.linkedin} ${data.github ? `| GitHub: ${data.github}` : ''}</p>
    </div>

    ${data.hasExperience?.toLowerCase() === "yes" ? `
      <h2>Summary</h2>
      <p>${data.experience}</p>
    ` : ''}

    <h2>Education</h2>
    <p><strong>${data.education}</strong> (${data.eduDuration})</p>
    <p>CGPA/Percentage: ${data.cgpa}</p>
    <p>Relevant Courses: ${data.courses}</p>

    ${data.hasExperience?.toLowerCase() === "yes" ? `
      <h2>Work Experience</h2>
      <p>${data.experience}</p>
    ` : ''}

    ${data.projects ? `<h2>Projects</h2><p>${data.projects}</p>` : ''}
    ${data.skills ? `<h2>Skills</h2>${renderList(data.skills)}` : ''}
    ${data.achievements ? `<h2>Achievements</h2><p>${data.achievements}</p>` : ''}
    ${data.certificates ? `<h2>Certificates</h2><p>${data.certificates}</p>` : ''}

    <h2>Hobbies</h2>
    ${renderList(data.hobbies)}

    ${data.languages ? `<h2>Languages</h2>${renderList(data.languages)}` : ''}

    <h2>Additional Info</h2>
    <p>Gender: ${data.gender}</p>
    <p>Date of Birth: ${data.dob}</p>
    <p>Nationality: ${data.nationality}</p>
  `;

  // Setup download button
  document.getElementById("downloadBtn").addEventListener("click", () => {
    html2pdf().from(preview).save(`${data.name}_Resume.pdf`);
  });
}

// ======= STARTUP ======= //
if (Object.keys(answers).length && !window.location.href.includes("reset")) {
  currentQuestion = questions.length;
  showResume(answers);
} else {
  showQuestion();
}
