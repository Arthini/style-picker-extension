const pickBtn = document.getElementById("pick");
// const copyBtn = document.getElementById("copy");
// const output = document.getElementById("output");

pickBtn.onclick = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.tabs.sendMessage(tab.id, { action: "pick" });

  // ✅ CLOSE THE POPUP
  window.close(); 
};


