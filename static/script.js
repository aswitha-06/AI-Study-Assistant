// ========================================
// AI Smart Study Assistant
// script.js
// ========================================

let originalText = "";
let expanded = false;

// -------------------------------
// Upload PDF
// -------------------------------
function uploadPDF() {

    let file = document.getElementById("pdfFile").files[0];

    if (!file) {
        alert("Please choose a PDF.");
        return;
    }

    // Show Loading Spinner
    document.getElementById("loadingBox").style.display = "block";

    let formData = new FormData();
    formData.append("pdf", file);

    fetch(window.location.origin + "/upload", {
        method: "POST",
        body: formData,
        mode: "same-origin",
        credentials: "same-origin"
    })

    .then(async response => {

        if (!response.ok) {
            const text = await response.text();
            throw new Error(text);
        }

        return response.json();

    })

    .then(data => {

        // Hide Loading Spinner
        document.getElementById("loadingBox").style.display = "none";

        if (!data.success) {
            alert(data.message);
            return;
        }

        // PDF Information
        document.getElementById("fileName").textContent = data.filename;
        document.getElementById("pageCount").textContent = data.pages;
        document.getElementById("wordCount").textContent = data.words;
        document.getElementById("characterCount").textContent = data.characters;

        // Save original text
        originalText = data.text;
        expanded = false;

        if (originalText.length > 500) {

            document.getElementById("pdfText").textContent =
                originalText.substring(0, 500) + "...";

            document.getElementById("toggleBtn").style.display = "inline-block";
            document.getElementById("toggleBtn").textContent = "Show More";

        } else {

            document.getElementById("pdfText").textContent = originalText;
            document.getElementById("toggleBtn").style.display = "none";

        }

    })

    .catch(error => {

        // Hide Loading Spinner
        document.getElementById("loadingBox").style.display = "none";

        console.error("Upload Error:", error);
        alert("Upload Error: " + error);

    });

}

// -------------------------------
// Upload Button
// -------------------------------
document.getElementById("uploadBtn").addEventListener("click", uploadPDF);

// -------------------------------
// Press Enter to Upload
// -------------------------------
document.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {

        event.preventDefault();
        uploadPDF();

    }

});

// -------------------------------
// Search Notes
// -------------------------------
document.getElementById("searchBtn").addEventListener("click", function () {

    let keyword = document.getElementById("searchBox").value.trim();

    if (keyword === "") {

        if (expanded) {

            document.getElementById("pdfText").textContent = originalText;

        } else {

            if (originalText.length > 500) {

                document.getElementById("pdfText").textContent =
                    originalText.substring(0, 500) + "...";

            } else {

                document.getElementById("pdfText").textContent = originalText;

            }

        }

        return;

    }

    let regex = new RegExp(keyword, "gi");

    document.getElementById("pdfText").innerHTML =
        originalText.replace(regex, match => `<mark>${match}</mark>`);

});

// -------------------------------
// Show More / Show Less
// -------------------------------
document.getElementById("toggleBtn").addEventListener("click", function () {

    if (!expanded) {

        document.getElementById("pdfText").textContent = originalText;
        this.textContent = "Show Less";
        expanded = true;

    } else {

        document.getElementById("pdfText").textContent =
            originalText.substring(0, 500) + "...";

        this.textContent = "Show More";
        expanded = false;

    }

});
// -------------------------------
// Generate AI Summary
// -------------------------------
document.getElementById("summaryBtn").addEventListener("click", function () {

    if (originalText.trim() === "") {
        alert("Please upload a PDF first.");
        return;
    }

    document.getElementById("summaryText").innerHTML =
        "<p>Generating summary...</p>";

    fetch("/summary", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            text: originalText
        })

    })

    .then(response => response.json())

    .then(data => {

        document.getElementById("summaryText").innerHTML = `
            <div class="alert alert-success">
                ${data.summary}
            </div>
        `;

    })

    .catch(error => {

        console.error(error);

        document.getElementById("summaryText").innerHTML = `
            <div class="alert alert-danger">
                Failed to generate summary.
            </div>
        `;

    });

});

// -------------------------------
// Generate Quiz
// -------------------------------
document.getElementById("quizBtn").addEventListener("click", function () {

    if (originalText.trim() === "") {

        alert("Please upload a PDF first.");
        return;

    }

    document.getElementById("quizArea").innerHTML =
        "<p>Generating Quiz...</p>";

    fetch("/quiz", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            text: originalText
        })

    })

    .then(response => response.json())

    .then(data => {

        let html = "";

        data.quiz.forEach((q, index) => {

            html += `

                <div class="card mb-3 shadow-sm">

                    <div class="card-body">

                        <h5 class="mb-3">Question ${index + 1}</h5>

                        <p><strong>${q.question}</strong></p>

                        <ul class="list-group">

                            <li class="list-group-item">A. ${q.options[0]}</li>
                            <li class="list-group-item">B. ${q.options[1]}</li>
                            <li class="list-group-item">C. ${q.options[2]}</li>
                            <li class="list-group-item">D. ${q.options[3]}</li>

                        </ul>

                        <div class="alert alert-success mt-3 mb-0">

                            <strong>Answer:</strong> ${q.answer}

                        </div>

                    </div>

                </div>

            `;

        });

        document.getElementById("quizArea").innerHTML = html;

    })

    .catch(error => {

        console.error(error);

        document.getElementById("quizArea").innerHTML =
            "<div class='alert alert-danger'>Failed to generate quiz.</div>";

    });

});
// ===============================
// Dark Mode
// ===============================

document.getElementById("darkModeBtn").addEventListener("click", function () {

    document.body.classList.toggle("dark-mode");

    if (document.body.classList.contains("dark-mode")) {

        localStorage.setItem("theme", "dark");
        this.innerHTML = "☀️ Light";

    } else {

        localStorage.setItem("theme", "light");
        this.innerHTML = "🌙 Dark";

    }

});

window.onload = function () {

    if (localStorage.getItem("theme") === "dark") {

        document.body.classList.add("dark-mode");

        document.getElementById("darkModeBtn").innerHTML = "☀️ Light";

    }

};
// ===============================
// Copy Extracted Notes
// ===============================

document.getElementById("copyBtn").addEventListener("click", function () {

    const text = document.getElementById("pdfText").innerText;

    if (!text.trim()) {
        alert("Please upload a PDF first.");
        return;
    }

    navigator.clipboard.writeText(text)
        .then(() => {
            alert("✅ Notes copied to clipboard!");
        })
        .catch(err => {
            console.error(err);
            alert("❌ Failed to copy notes.");
        });

});
// ===============================
// Read Aloud
// ===============================

document.getElementById("readBtn").addEventListener("click", function () {

    const text = document.getElementById("pdfText").innerText.trim();

    if (!text) {
        alert("Please upload a PDF first.");
        return;
    }

    speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);

    speech.lang = "en-US";
    speech.rate = 1;
    speech.pitch = 1;
    speech.volume = 1;

    speechSynthesis.speak(speech);

});
// ===============================
// Stop Reading
// ===============================

document.getElementById("stopBtn").addEventListener("click", function () {

    speechSynthesis.cancel();

});
// ===============================
// Download Summary
// ===============================

document.getElementById("downloadSummaryBtn").addEventListener("click", function () {

    const summary = document.getElementById("summaryText").innerText.trim();

    if (!summary) {

        alert("Please generate a summary first.");
        return;

    }

    const blob = new Blob([summary], { type: "text/plain" });

    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);

    link.download = "AI_Summary.txt";

    link.click();

});
function scrollToSection(sectionId) {
    document.getElementById(sectionId).scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}