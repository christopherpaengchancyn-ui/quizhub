# TODO: Make Quiz App Multiplayer for Online Play

## Step 1: Create questions.js ✅
- Extract QUESTIONS object from quiz.html and quiz.js into a separate questions.js file for server use.

## Step 2: Update quiz.html for Multiplayer ✅
- Add Socket.IO client script.
- Connect to server on page load.
- Join room based on selected difficulty.
- Display waiting screen until quiz starts.
- Handle startQuiz event to begin quiz.
- Send answers via socket on answer event.
- Listen for matchResult to show multiplayer results.
- Update UI to show player scores and rankings.

## Step 3: Update Server Logic (if needed) ✅
- Ensure server handles solo players or confirm multiplayer only.
- Test server.js with questions.js.

## Step 4: Update Difficulty Selection ✅
- Modify difficulty.html to indicate multiplayer mode.

## Step 5: Test Multiplayer Functionality
- Run server and test with multiple browser tabs/windows.
- Verify quiz starts when 2+ players join, answers are tracked, and results are shown.

## Step 6: Final Adjustments
- Ensure all files are consistent.
- Update any references to single-player logic.
