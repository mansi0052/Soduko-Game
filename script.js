const board = document.getElementById('board');
let puzzle = [], solution = [];
let timerInterval, seconds = 0, paused = false;
let puzzleAlreadySolved = false;


function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function updateTimer() {
  if (!paused) {
    seconds++;
    const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
    const secs = String(seconds % 60).padStart(2, '0');
    document.getElementById('timer').innerText = `Time: ${mins}:${secs}`;
  }
}

function startTimer() {
  clearInterval(timerInterval);
  seconds = 0;
  paused = false;
  timerInterval = setInterval(updateTimer, 1000);
  document.getElementById("pause-btn").innerText = "Pause";
}

function togglePause() {
  paused = !paused;
  document.getElementById("pause-btn").innerText = paused ? "Resume" : "Pause";
}

function isSafe(grid, row, col, num) {
  for (let x = 0; x < 9; x++) {
    if (grid[row][x] === num || grid[x][col] === num ||
      grid[3 * Math.floor(row / 3) + Math.floor(x / 3)]
        [3 * Math.floor(col / 3) + x % 3] === num) {
      return false;
    }
  }
  return true;
}

function solve(grid) {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === 0) {
        const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (let num of nums) {
          if (isSafe(grid, row, col, num)) {
            grid[row][col] = num;
            if (solve(grid)) return true;
            grid[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function maskGrid(grid, holes) {
  const puzzle = grid.map(r => [...r]);
  while (holes > 0) {
    const row = Math.floor(Math.random() * 9);
    const col = Math.floor(Math.random() * 9);
    if (puzzle[row][col] !== 0) {
      puzzle[row][col] = 0;
      holes--;
    }
  }
  return puzzle;
}

function createBoard() {
  board.innerHTML = '';
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const input = document.createElement('input');
      input.classList.add('cell');
      input.setAttribute('data-row', row);
      input.setAttribute('data-col', col);
      input.setAttribute('tabindex', row * 9 + col);
      input.maxLength = 1;

      if (puzzle[row][col] !== 0) {
        input.value = puzzle[row][col];
        input.disabled = true;
        input.classList.add('prefilled');
      } else {
        input.classList.add('editable');
        input.addEventListener('input', () => {
          input.value = input.value.replace(/[^1-9]/g, '');
        });
      }

      // Add thick border between 3x3 squares
      if (col % 3 === 0) input.style.borderLeft = '2px solid black';
      if (row % 3 === 0) input.style.borderTop = '2px solid black';
      if (col === 8) input.style.borderRight = '2px solid black';
      if (row === 8) input.style.borderBottom = '2px solid black';

      board.appendChild(input);
    }
  }
}

function startGame() {
  document.getElementById('start-btn').style.display = 'none';
  document.getElementById('game-buttons').style.display = 'block';
  generateSudoku();
  startTimer();
}

const resetModal = document.getElementById('reset-modal');
const confirmResetBtn = document.getElementById('confirm-reset');
const cancelResetBtn = document.getElementById('cancel-reset');
const resetBtn = document.getElementById('reset-btn');

resetBtn.addEventListener('click', resetBoard);

function resetBoard() {
  resetModal.style.display = 'block';
  puzzleAlreadySolved = false;
}

// Handle Confirm Reset
confirmResetBtn.addEventListener('click', () => {
  resetModal.style.display = 'none';

  // Clear all editable cells
  document.querySelectorAll('.cell').forEach(cell => {
    if (!cell.disabled) {
      cell.value = '';
      cell.classList.remove('invalid');
    }
  });

  // Clear message
  const message = document.getElementById('message');
  if (message) message.innerText = '';

  // Reset timer, hints, etc.
  resetTimer();
  resetHints();

  // Optional: regenerate puzzle or clear additional states
});

// Handle Cancel Reset
cancelResetBtn.addEventListener('click', () => {
  resetModal.style.display = 'none';
});

// Click outside modal to close
resetModal.addEventListener('click', (e) => {
  if (e.target === resetModal) {
    resetModal.style.display = 'none';
  }
});

// Reset timer
function resetTimer() {
  clearInterval(timerInterval);
  seconds = 0;
  paused = false;
  document.getElementById('timer').innerText = 'Time: 00:00';
}

// Reset hints
function resetHints() {
  document.querySelectorAll('.hinted').forEach(cell => cell.classList.remove('hinted'));
}


function markInvalid(row, col) {
  document.querySelectorAll('.cell')[row * 9 + col].classList.add('invalid');
}

function checkSolution() {
  const cells = document.querySelectorAll('#board input');
  let currentBoard = [];
  let isCorrect = true;
  let hasEmptyCells = false;

  // Build current board and clear previous invalid highlights
  for (let row = 0; row < 9; row++) {
    currentBoard[row] = [];
    for (let col = 0; col < 9; col++) {
      const idx = row * 9 + col;
      const val = parseInt(cells[idx].value);
      currentBoard[row][col] = isNaN(val) ? 0 : val;
      cells[idx].classList.remove("invalid");
      if (isNaN(val)) hasEmptyCells = true;
    }
  }

  // Check row, column, and box validity
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const val = currentBoard[row][col];
      if (val === 0) continue;

      // Check row
      for (let c = 0; c < 9; c++) {
        if (c !== col && currentBoard[row][c] === val) {
          markInvalid(row, col); markInvalid(row, c); isCorrect = false;
        }
      }

      // Check column
      for (let r = 0; r < 9; r++) {
        if (r !== row && currentBoard[r][col] === val) {
          markInvalid(row, col); markInvalid(r, col); isCorrect = false;
        }
      }

      // Check 3x3 box
      const startRow = Math.floor(row / 3) * 3;
      const startCol = Math.floor(col / 3) * 3;
      for (let r = startRow; r < startRow + 3; r++) {
        for (let c = startCol; c < startCol + 3; c++) {
          if ((r !== row || c !== col) && currentBoard[r][c] === val) {
            markInvalid(row, col); markInvalid(r, c); isCorrect = false;
          }
        }
      }
    }
  }

  // Final check against the actual solution
  if (isCorrect && !hasEmptyCells) {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (currentBoard[row][col] !== solution[row][col]) {
          markInvalid(row, col);
          isCorrect = false;
        }
      }
    }
  }

  const msg = document.getElementById('message');

  if (isCorrect && !hasEmptyCells) {
  if (!puzzleAlreadySolved) {
    clearInterval(timerInterval);
    msg.classList.remove('error', 'warning');
    msg.classList.add('solved');
    msg.innerText = "🎉 Puzzle Solved!";

    puzzleSolved();  // ✅ Only once
    updateLeaderboard(seconds);

    puzzleAlreadySolved = true;  // ✅ Prevent further increments
  }
} else if (hasEmptyCells) {
  msg.innerText = "⚠️ Please fill all cells before checking.";
  msg.style.color = 'orange';
  msg.classList.remove('solved');
} else {
  msg.innerText = "❌ Errors found! Try again.";
  msg.style.color = 'red';
}

}


function generateSudoku() {
  const difficulty = parseInt(document.getElementById('difficulty').value);
  const grid = Array.from({ length: 9 }, () => Array(9).fill(0));
  solve(grid);
  solution = grid.map(r => [...r]);
  puzzle = maskGrid(grid, difficulty);
  createBoard();
  startTimer();
}

function toggleTheme() {
  const html = document.documentElement;
  const newTheme = html.getAttribute("data-theme") === "dark" ? "light" : "dark";
  html.setAttribute("data-theme", newTheme);
}

// Assuming this already exists somewhere:
let puzzlesCompleted = 0;

if (localStorage.getItem('puzzlesCompleted')) {
  puzzlesCompleted = parseInt(localStorage.getItem('puzzlesCompleted'));
  updatePuzzleCounter();
}

function updatePuzzleCounter() {
  document.getElementById('puzzle-counter').innerText = `Puzzles Completed: ${puzzlesCompleted}`;
}

// On successful puzzle completion:
function puzzleSolved() {
  puzzlesCompleted++;
  localStorage.setItem('puzzlesCompleted', puzzlesCompleted);
  updatePuzzleCounter();
}

// Reset modal logic (ensure this is already present):
document.getElementById('reset-btn').addEventListener('click', () => {
  document.getElementById('reset-modal').style.display = 'block';
});

document.getElementById('cancel-reset').addEventListener('click', () => {
  document.getElementById('reset-modal').style.display = 'none';
});

// ✅ Reset confirmation handler
document.getElementById('confirm-reset').addEventListener('click', () => {
  resetBoard(); // Your function to reset the puzzle board

  // ✅ Reset puzzles completed count
  puzzlesCompleted = 0;
  localStorage.setItem('puzzlesCompleted', puzzlesCompleted);
  updatePuzzleCounter();

  // ✅ Hide modal
  document.getElementById('reset-modal').style.display = 'none';
});

// Call this when the puzzle is successfully solved
function puzzleSolved() {
  puzzlesCompleted++;
  localStorage.setItem('puzzlesCompleted', puzzlesCompleted);
  updatePuzzleCounter();
}

function updateLeaderboard(timeInSeconds) {
  const leaderboard = JSON.parse(localStorage.getItem("leaderboard") || "[]");
  leaderboard.push(timeInSeconds);
  leaderboard.sort((a, b) => a - b);
  localStorage.setItem("leaderboard", JSON.stringify(leaderboard.slice(0, 5)));
  displayLeaderboard();
}
function initializeLeaderboard() {
  if (!localStorage.getItem("leaderboard")) {
    // Example default times in seconds: 2 min, 3 min, 5 min
    const defaultTimes = [120, 180, 300];
    localStorage.setItem("leaderboard", JSON.stringify(defaultTimes));
  }
}

function displayLeaderboard() {
  const times = JSON.parse(localStorage.getItem("leaderboard") || "[]");
  const list = document.getElementById("leaderboard");
  list.innerHTML = '';
  times.forEach((time, index) => {
    const mins = String(Math.floor(time / 60)).padStart(2, '0');
    const secs = String(time % 60).padStart(2, '0');
    const li = document.createElement('li');
    li.textContent = `${mins}:${secs}`;
    list.appendChild(li);
  });
}

window.addEventListener("load", () => {
  initializeLeaderboard();
  displayLeaderboard();
});

function giveHint() {
  const cells = document.querySelectorAll('#board input');

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const index = row * 9 + col;
      const cell = cells[index];

      // If cell is editable and empty or incorrect
      if (!cell.disabled && (cell.value === "" || parseInt(cell.value) !== solution[row][col])) {
        cell.value = solution[row][col];
        cell.classList.add("hinted");
        return; // Only fill one cell
      }
    }
  }

  alert("No more hints available. All cells are filled correctly!");
}

function changeFontStyle() {
  const selectedFont = document.getElementById("font-style").value;
  document.querySelectorAll('.cell').forEach(cell => {
    cell.style.fontFamily = selectedFont;
  });
}

function changeFontSize() {
  const selectedSize = document.getElementById("font-size").value + "px";
  document.querySelectorAll('.cell').forEach(cell => {
    cell.style.fontSize = selectedSize;
  });
}

async function solveWithAnimation() {
  const inputs = document.querySelectorAll('#board input');

  // Copy current board state
  let current = [];
  for (let row = 0; row < 9; row++) {
    current[row] = [];
    for (let col = 0; col < 9; col++) {
      const idx = row * 9 + col;
      const val = parseInt(inputs[idx].value);
      current[row][col] = isNaN(val) ? 0 : val;
    }
  }

  // Try solving it
  if (!solve(current)) {
    alert("❌ Cannot solve this puzzle!");
    return;
  }

  // Animate filling
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const idx = row * 9 + col;
      if (!inputs[idx].disabled) {
        inputs[idx].value = current[row][col];
        inputs[idx].classList.add('animated-fill');
        await new Promise(res => setTimeout(res, 120)); // slower step

        inputs[idx].classList.remove('animated-fill');
      }
    }
  }

  clearInterval(timerInterval);
  puzzlesCompleted++;
localStorage.setItem('puzzlesCompleted', puzzlesCompleted);
updatePuzzleCounter();

  updateStats();
  alert("✅ Puzzle Solved!");
}

let selectedCellIndex = -1;

document.addEventListener('keydown', function (e) {
  const focused = document.activeElement;
  if (!focused.classList.contains('cell')) return;

  const row = parseInt(focused.getAttribute('data-row'));
  const col = parseInt(focused.getAttribute('data-col'));

  let nextRow = row;
  let nextCol = col;

  switch (e.key) {
    case 'ArrowUp':
      nextRow = (row - 1 + 9) % 9;
      break;
    case 'ArrowDown':
      nextRow = (row + 1) % 9;
      break;
    case 'ArrowLeft':
      nextCol = (col - 1 + 9) % 9;
      break;
    case 'ArrowRight':
      nextCol = (col + 1) % 9;
      break;
    default:
      return; // Don't block other keys
  }

  e.preventDefault();
  const nextInput = document.querySelector(
    `input[data-row="${nextRow}"][data-col="${nextCol}"]`
  );
  if (nextInput) nextInput.focus();
});

function enableManualInput() {
  clearInterval(timerInterval);
  board.innerHTML = '';
  puzzle = Array.from({ length: 9 }, () => Array(9).fill(0));
  solution = [];

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const input = document.createElement('input');
      input.classList.add('cell', 'editable');
      input.setAttribute('data-row', row);
      input.setAttribute('data-col', col);
      input.setAttribute('tabindex', row * 9 + col);
      input.maxLength = 1;

      input.addEventListener('input', () => {
        input.value = input.value.replace(/[^1-9]/g, '');
      });

      board.appendChild(input);
    }
  }

  document.getElementById('solve-btn').style.display = 'inline-block';
  document.getElementById("pause-btn").style.display = "none";
  document.getElementById('timer').innerText = 'Manual Input Mode';
}

function solveManualPuzzle() {
  const cells = board.querySelectorAll('input');
  const grid = Array.from({ length: 9 }, () => Array(9).fill(0));

  // Read values from board
  for (let i = 0; i < 81; i++) {
    const val = parseInt(cells[i].value);
    const row = Math.floor(i / 9);
    const col = i % 9;
    if (!isNaN(val)) grid[row][col] = val;
  }

  const gridCopy = grid.map(row => [...row]);

  if (solve(gridCopy)) {
    // Update board with solved values
    for (let i = 0; i < 81; i++) {
      const row = Math.floor(i / 9);
      const col = i % 9;
      cells[i].value = gridCopy[row][col];
    }
    alert("✅ Puzzle Solved!");
    document.getElementById('solve-btn').style.display = 'none';
  } else {
    alert("❌ This puzzle has no solution!");
  }
}
// Assuming these variables are defined earlier:
// const confirmResetBtn = document.getElementById('confirm-reset');
// const resetModal = document.getElementById('reset-modal');

document.getElementById('confirm-reset').addEventListener('click', () => {
  // Hide the reset modal
  document.getElementById('reset-modal').style.display = 'none';

  // Clear all cell values and remove invalid classes
  document.querySelectorAll('.cell').forEach(cell => {
    if (!cell.disabled) {
      cell.value = '';
      cell.classList.remove('invalid');
    }
  });

  // Clear message text
  const message = document.getElementById('message');
  if (message) message.innerText = '';

  // Reset the timer and hints
  resetTimer();
  resetHints();
});
