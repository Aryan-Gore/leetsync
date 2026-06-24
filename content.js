let lastUrl = location.href;

function generateReadme(problemData) {
  return `
# ${problemData.title}

## Problem

${problemData.url}

## Language

${problemData.language}

## Runtime

${problemData.runtime} ms

## Memory

${problemData.memory} bytes

${problemData.explanation}

## Solution File

[Solution.${extension}](./Solution.${extension})
`;
}

setInterval(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    detected = false;

    console.log("Page changed. Reset detector.");
  }
}, 1000);

let detected = false;

function getExtension(lang) {
  const map = {
    java: "java",
    python3: "py",
    python: "py",
    cpp: "cpp",
    c: "c",
    javascript: "js",
    typescript: "ts",
    kotlin: "kt",
    csharp: "cs",
    go: "go",
    rust: "rs",
  };

  return map[lang.toLowerCase()] || "txt";
}

async function getSubmissionDetails(submissionId) {
  const response = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      operationName: "submissionDetails",
      query: `
                query submissionDetails($submissionId: Int!) {
                  submissionDetails(submissionId: $submissionId) {
                    code
                    runtime
                    memory
                    lang {
                      name
                    }
                    question {
                      titleSlug
                    }
                  }
                }
                `,
      variables: {
        submissionId: Number(submissionId),
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("GitHub Push Failed:", data);
    return;
  }

  return data.data.submissionDetails;
}

async function getSettings() {

  return await chrome.storage.sync.get([
    "githubToken",
    "githubUsername",
    "repoName",
    "geminiKey"
  ]);
}



async function pushToGithub(problemData) {

    const {
  githubToken,
  githubUsername,
  repoName
} = await getSettings();

  const extension = getExtension(problemData.language);

  const filePath = `${problemData.title}/Solution.${extension}`;

  console.log("Extension:", extension);
  console.log("File Path:", filePath);

  const content = btoa(unescape(encodeURIComponent(problemData.code)));

  let sha = null;

  // Check if file already exists
  const checkResponse = await fetch(
    `https://api.github.com/repos/${githubUsername}/${repoName}/contents/${filePath}`,
    {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github+json",
      },
    },
  );

  if (checkResponse.ok) {
    const fileData = await checkResponse.json();

    sha = fileData.sha;

    // Decode existing GitHub file
    const existingContent = decodeURIComponent(
      escape(atob(fileData.content.replace(/\n/g, ""))),
    );

    // Skip if code is identical
    if (existingContent.trim() === problemData.code.trim()) {
      console.log("Same solution already exists. Skipping push.");
      return;
    }

    console.log("File exists. Updating...");
  } else if (checkResponse.status === 404) {
    console.log("File does not exist. Creating...");
  } else {
    console.error("GitHub check failed:", checkResponse.status);

    return;
  }

  const body = {
    message: sha ? `Update ${problemData.title}` : `Add ${problemData.title}`,
    content: content,
  };

  // Required when updating
  if (sha) {
    body.sha = sha;
  }

  const response = await fetch(
    `https://api.github.com/repos/${githubUsername}/${repoName}/contents/${filePath}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  const data = await response.json();

  console.log("Status:", response.status);

  console.log("GitHub Response:", data);
}

const observer = new MutationObserver(async () => {
  if (detected) return;

  const pageText = document.body.innerText;

  if (
    pageText.includes("Accepted") &&
    window.location.href.includes("/submissions/")
  ) {
    detected = true;

    try {
      const submissionId =
        window.location.href.match(/submissions\/(\d+)/)?.[1];

      console.log("Submission ID:", submissionId);

      const details = await getSubmissionDetails(submissionId);

      if (!details) {
        console.error("No submission details found");
        return;
      }

      const problemData = {
        title: details.question.titleSlug,
        url: window.location.href.split("/submissions")[0],
        code: details.code,
        language: details.lang.name,
        runtime: details.runtime,
        memory: details.memory,
      };

      const explanation = await generateApproach(
        problemData.code,
        problemData.language,
      );

      problemData.explanation = explanation;

      console.log("Solution Accepted!");

      console.log(problemData);

      await pushToGithub(problemData);
      await pushReadme(problemData);

      chrome.storage.local.set(
        {
          lastSolution: problemData,
        },
        () => {
          console.log("Saved Successfully!");
        },
      );
    } catch (err) {
      console.error("Error:", err);
    }
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

async function tryGemini(code, language) {
  const { geminiKey } =
  await chrome.storage.sync.get("geminiKey");
  if (!geminiKey) throw new Error("No Gemini key");

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 15000); // 15 seconds

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `
Analyze this LeetCode ${language} solution.

Return markdown:

## Approach
(3-5 sentences)

## Algorithm
(step by step)

## Complexity
Time Complexity: O(?)
Space Complexity: O(?)

Code:
${code}
`,
              },
            ],
          },
        ],
      }),
      signal: controller.signal,
    },
  );

  clearTimeout(timeout);
  if (!res.ok) throw new Error("Gemini failed: " + res.status);
  const data = await res.json();

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("No response from Gemini");
  }

  return text;
}

function staticFallback() {
  return `
## Approach

This solution was automatically synced from LeetCode.

## Complexity

Time Complexity: Not Available

Space Complexity: Not Available

Not Genreted by Ai,Sorry for the Inconvinence.......
`;
}
async function generateApproach(code, language) {
  try {
    return await tryGemini(code, language);
  } catch (e) {
    console.warn("Gemini failed, using static fallback:", e);
    return staticFallback();
  }
}

async function pushReadme(problemData) {

    const {
  githubToken,
  githubUsername,
  repoName
} = await getSettings();

if (!githubToken || !githubUsername || !repoName) {
  console.error("GitHub settings not configured.");
  return;
}

  const readmePath = `${problemData.title}/README.md`;

  const readmeContent = generateReadme(problemData);

  const content = btoa(unescape(encodeURIComponent(readmeContent)));

  let sha = null;

  const checkResponse = await fetch(
    `https://api.github.com/repos/${githubUsername}/${repoName}/contents/${readmePath}`,
    {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github+json",
      },
    },
  );

  if (checkResponse.ok) {
    const fileData = await checkResponse.json();

    sha = fileData.sha;
  }

  const body = {
    message: sha
      ? `Update README for ${problemData.title}`
      : `Add README for ${problemData.title}`,
    content,
  };

  if (sha) {
    body.sha = sha;
  }

  const response = await fetch(
    `https://api.github.com/repos/${githubUsername}/${repoName}/contents/${readmePath}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  const data = await response.json();


  console.log("README Response:", data);
  console.log("README Status:", response.status);
}
