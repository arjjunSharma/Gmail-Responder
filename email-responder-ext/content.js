console.log("Content script loaded ");

function getEmailContent() {
  const selectors = [".h7", ".a3s", ".gmail-quote", 'role = "presentation"'];
  for (const selector of selectors) {
    const content = document.querySelector(selector);
    if (content) {
      // Trim whitespace and return the captured text
      return content.innerText.trim();
    }
  }
  // Return empty string if no content is found
  return "";
}

/**
 * Function to find the Gmail compose toolbar.
 * This is where the AI Reply button will be injected.
 */
function findComposeToolbar() {
  const selectors = [".btC", ".aDh", '[role="toolbar"]'];
  for (const selector of selectors) {
    const toolbar = document.querySelector(selector);
    if (toolbar) return toolbar;
  }
  return null;
}

/**
 * Function to create and inject the AI Reply button into the compose toolbar.
 */
function injectButton() {
  // Remove existing button if present to avoid duplicates
  const existingButton = document.querySelector("ai-reply-button");
  if (existingButton) {
    existingButton.remove();
  }

  // Find the compose toolbar in the Gmail DOM
  const toolbar = findComposeToolbar();
  if (!toolbar) {
    console.log("Compose toolbar not found");
    return;
  }
  console.log("Compose toolbar found:");

  // Create AI Reply button
  const button = createAiButton();
  button.classList.add("ai-reply-button");

  // Attach click event listener to the AI Reply button
  button.addEventListener("click", async () => {
    try {
      console.log("AI Reply button clicked");

      // Disable the button and indicate processing
      button.innerHTML = "Generating...";
      button.disabled = true;

      // Capture the email content from the opened email
      const emailContent = getEmailContent();
      console.log("Captured Email Content:", emailContent);

      if (!emailContent) {
        console.warn(
          "No email content captured! Check selectors in getEmailContent()"
        );
        return;
      }

      // Send the captured email content to the backend API for generating reply
      console.log("Sending request to backend...");
      const response = await fetch("http://localhost:8080/api/email/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailContent: emailContent,
          tone: "professional",
        }),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }

      // Retrieve the AI-generated reply from backend
      const generatedReply = await response.text();
      console.log("Generated Reply:", generatedReply);

      // Find the Gmail compose box to insert the AI reply
      const composeBox =
        document.querySelector('[role="textbox"][g_editable="true"]') ||
        document.querySelector('[aria-label="Message Body"]');

      if (composeBox) {
        composeBox.focus();

        // Insert the generated reply text directly into the compose box
        composeBox.innerText = generatedReply;

        // Dispatch an input event so Gmail recognizes the text change
        composeBox.dispatchEvent(new Event("input", { bubbles: true }));

        console.log("Reply inserted into compose box successfully");
      } else {
        console.error("Compose box not found!");
      }
    } catch (error) {
      // Catch and log any errors during fetch or insertion
      console.error("Error generating reply:", error);
    } finally {
      // Restore button state
      button.innerHTML = "AI Reply";
      button.disabled = false;
    }
  });

  // Insert the AI Reply button at the start of the toolbar
  toolbar.insertBefore(button, toolbar.firstChild);
}

/**
 * Function to create a styled AI Reply button
 * Returns the button element
 */
function createAiButton() {
  const button = document.createElement("div");
  button.className = "ai-reply-button T-I J-J5-Ji aoO v7 T-I-atl L3";
  button.setAttribute("role", "button");

  // Styling the button to look consistent with Gmail UI
  button.style.marginRight = "10px";
  button.style.backgroundColor = "#1961bfff";
  button.style.borderRadius = "25px";
  button.style.width = "40px";
  button.style.border = "2px solid #1961bfff";
  button.style.marginLeft = "8px";
  button.innerHTML = "AI Reply";

  // Tooltip for user guidance
  button.setAttribute("data-tooltip", " Generate AI Reply");

  return button;
}

/**
 * MutationObserver to detect changes in Gmail DOM
 * Specifically listens for newly opened compose windows to inject button
 */
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    const addedNodes = Array.from(mutation.addedNodes);
    const hasComposedElements = addedNodes.some(
      (node) =>
        node.nodeType === Node.ELEMENT_NODE &&
        (node.matches('.aDh, .btC,[role="dialog"]') ||
          node.querySelector(".aDh, .btC"))
    );

    if (hasComposedElements) {
      console.log("Detected Gmail compose window");
      // Delay injection slightly to ensure DOM is fully loaded
      setTimeout(injectButton, 500);
    }
  }
});

// Start observing the document body for added nodes
observer.observe(document.body, { childList: true, subtree: true });
