document.getElementById("save").addEventListener("click", async () => {

  const githubToken =
    document.getElementById("githubToken").value;

  const githubUsername =
    document.getElementById("githubUsername").value;

  const repoName =
    document.getElementById("repoName").value;

  const geminiKey =
    document.getElementById("geminiKey").value;

  await chrome.storage.sync.set({
    githubToken,
    githubUsername,
    repoName,
    geminiKey
  });

  alert("Saved!");
});

document.addEventListener("DOMContentLoaded", async () => {
  const data = await chrome.storage.sync.get([
    "githubToken",
    "githubUsername",
    "repoName",
    "geminiKey"
  ]);

  document.getElementById("githubToken").value =
    data.githubToken || "";

  document.getElementById("githubUsername").value =
    data.githubUsername || "";

  document.getElementById("repoName").value =
    data.repoName || "";

  document.getElementById("geminiKey").value =
    data.geminiKey || "";
});