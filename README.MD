# LeetSync

Automatically saves accepted LeetCode solutions to GitHub.

## Features

- Detects Accepted submissions
- Saves solution code to GitHub
- Supports multiple languages
- Generates README for each problem
- Uses Gemini AI for approach generation
- Automatic folder organization

## Setup

### Step 1: Clone Repository

```bash
git clone https://github.com/yourusername/LeetSync.git
```

### Step 2: Load Extension

1. Open Chrome
2. Go to chrome://extensions
3. Enable Developer Mode
4. Click Load Unpacked
5. Select LeetSync folder

### Step 3: Create GitHub Token

1. Go to GitHub Settings
2. Developer Settings
3. Personal Access Tokens
4. Generate Token

Required Permission:

- Contents: Read and Write

### Step 4: Get Gemini API Key(not necessray is u dont have, generate default readme)

1. Visit Google AI Studio
2. Create API Key

### Step 5: Configure Extension

if popup doesnt open pin the extension and then click on its icon 

Enter:

- GitHub Username
- Repository Name
- GitHub Token
- Gemini API Key

Press Save.

## Usage

1. Solve a LeetCode problem.
2. Submit solution.
3. When Accepted appears:
   - Solution is pushed to GitHub
   - README is generated
   - Problem folder is created automatically

## Folder Structure

```text
two-sum/
├── Solution.java
└── README.md
```

## Example

```java
class Solution {
    public int[] twoSum(int[] nums, int target) {
        ...
    }
}
```

## Tech Stack

- JavaScript
- Chrome Extension Manifest V3
- GitHub REST API
- Gemini API

## License

MIT