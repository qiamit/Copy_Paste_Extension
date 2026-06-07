const enableBypass = document.getElementById("enableBypass");
const enableCtrlBypass = document.getElementById("enableCtrlBypass");
const fieldNameInput = document.getElementById("fieldName");
const fieldValueInput = document.getElementById("fieldValue");
const fillButton = document.getElementById("fillButton");
const statusEl = document.getElementById("status");

init();

function init() {
  chrome.runtime.sendMessage({ type: "GET_BYPASS_STATE" }, (response) => {
    if (chrome.runtime.lastError) {
      setStatus("Failed to load extension state.", true);
      return;
    }
    enableBypass.checked = response?.enabled !== false;
    enableCtrlBypass.checked = response?.ctrlKeyEnabled !== false;
  });

  enableBypass.addEventListener("change", () => {
    const enabled = enableBypass.checked;
    chrome.runtime.sendMessage({ type: "SET_BYPASS_STATE", enabled }, (response) => {
      if (chrome.runtime.lastError) {
        setStatus(`Failed to update: ${chrome.runtime.lastError.message}`, true);
        return;
      }
      if (response?.ok === false) {
        setStatus(`Failed to update: ${response.error}`, true);
        return;
      }
      setStatus(enabled ? "Bypass enabled." : "Bypass disabled.", false);
    });
  });

  enableCtrlBypass.addEventListener("change", () => {
    const enabled = enableCtrlBypass.checked;
    chrome.runtime.sendMessage({ type: "SET_CTRL_BYPASS_STATE", enabled }, (response) => {
      if (chrome.runtime.lastError) {
        setStatus(`Failed to update Ctrl option: ${chrome.runtime.lastError.message}`, true);
        return;
      }
      if (response?.ok === false) {
        setStatus(`Failed to update: ${response.error}`, true);
        return;
      }
      setStatus(
        enabled ? "Ctrl key bypass enabled." : "Ctrl key bypass disabled.",
        false
      );
    });
  });

  fillButton.addEventListener("click", () => {
    const fieldName = fieldNameInput.value.trim();
    const value = fieldValueInput.value;
    if (!fieldName) {
      setStatus("Enter a field name.", true);
      return;
    }

    chrome.runtime.sendMessage(
      {
        type: "RUN_BULK_FILL",
        fieldName,
        value
      },
      (response) => {
        if (chrome.runtime.lastError) {
          setStatus(chrome.runtime.lastError.message, true);
          return;
        }
        if (!response || response.ok === false) {
          setStatus(response?.error || "Failed to fill fields.", true);
          return;
        }
        setStatus(`Updated ${response.updatedCount} field(s).`, false);
      }
    );
  });
}

function setStatus(message, isError) {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
}
