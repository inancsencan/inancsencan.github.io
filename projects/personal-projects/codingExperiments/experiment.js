// Get the experiment ID from the URL

const urlParameters = new URLSearchParams(window.location.search);
const experimentId = urlParameters.get("id");

// Elements from experiment.html

const experimentTitle = document.getElementById("experiment-title");
const experimentDescription = document.getElementById("experiment-description");
const sketchFrame = document.getElementById("sketch-frame");
const experimentFrame = document.querySelector(".experiment-frame");
const sourceCode = document.getElementById("source-code");

const tabButtons = document.querySelectorAll(".tab-button");
const sketchPanel = document.getElementById("sketch-panel");
const codePanel = document.getElementById("code-panel");

// Find the selected experiment

const experiment = experiments.find((item) => {
  return item.id === experimentId;
});

if (experiment) {
  experimentTitle.textContent = experiment.title;
  experimentDescription.textContent = experiment.description || "";
  document.title = `${experiment.title} - Coding Experiments`;

  // Load sketch webpage into iframe
  sketchFrame.src = experiment.path + "index.html";

  // Set the dimensions of the experiment frame
  experimentFrame.style.aspectRatio = `${experiment.width} / ${experiment.height}`;

  // Load the source code from sketch.js
  async function loadSourceCode() {
    try {
      const response = await fetch(experiment.path + "sketch.js");

      if (!response.ok) {
        throw new Error("Could not load source code.");
      }

      const code = await response.text();

      sourceCode.textContent = code;

      // Apply syntax highlighting
      Prism.highlightElement(sourceCode);

      // Generate line numbers
      const lineNumbers = document.getElementById("line-numbers");

      const numberOfLines = code.replace(/\n$/, "").split("\n").length;

      lineNumbers.textContent = Array.from(
        { length: numberOfLines },
        (_, i) => i + 1,
      ).join("\n");
    } catch (error) {
      sourceCode.textContent = "Unable to load source code.";
      console.error(error);
    }
  }

  const copyButton = document.getElementById("copy-code");

  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(sourceCode.textContent);

      copyButton.textContent = "Copied!";

      setTimeout(() => {
        copyButton.textContent = "Copy Code";
      }, 2000);
    } catch (error) {
      console.error("Failed to copy code:", error);
    }
  });

  loadSourceCode();
} else {
  experimentTitle.textContent = "Experiment not found";

  sketchFrame.hidden = true;
}

// Switch between Sketch and Code tabs

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selectedTab = button.dataset.tab;

    // Update active button
    tabButtons.forEach((tab) => {
      tab.classList.toggle("active", tab === button);
    });

    // Show selected panel
    sketchPanel.hidden = selectedTab !== "sketch";
    codePanel.hidden = selectedTab !== "code";
  });
});
