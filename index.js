import Grid from "./grid.js"
import Tile from "./tile.js"

const gameBoard = document.getElementById("game-board")

const grid = new Grid(gameBoard)
grid.randomEmptyCell().tile = new Tile(gameBoard)
grid.randomEmptyCell().tile = new Tile(gameBoard)
setupInput()

function setupInput() {
    // Keyboard input
    window.addEventListener("keydown", handleInput, { once: true });

    // Touch input for swipe gestures
    gameBoard.addEventListener("touchstart", handleTouchStart, { passive: false });
    gameBoard.addEventListener("touchmove", handleTouchMove, { passive: false });
    gameBoard.addEventListener("touchend", handleTouchEnd, { passive: true });
}

// Prevent scrolling during touch gestures
function handleTouchMove(e) {
    e.preventDefault(); // Disable scrolling
}


// Variables for touch start and end positions
let touchStartX = 0
let touchStartY = 0
let touchEndX = 0
let touchEndY = 0

// Handle the start of a touch gesture
function handleTouchStart(e) {
    touchStartX = e.touches[0].clientX
    touchStartY = e.touches[0].clientY
}

// Handle the end of a touch gesture and determine the swipe direction
function handleTouchEnd(e) {
    touchEndX = e.changedTouches[0].clientX
    touchEndY = e.changedTouches[0].clientY
    handleSwipe()
}

// Process the swipe direction
function handleSwipe() {
    const deltaX = touchEndX - touchStartX
    const deltaY = touchEndY - touchStartY

    // Check if the swipe is horizontal or vertical
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 30) {
            handleInput({ key: "ArrowRight" }); // Simulate Right Arrow Key
        } else if (deltaX < -30) {
            handleInput({ key: "ArrowLeft" }); // Simulate Left Arrow Key
        }
    } else {
        // Vertical swipe
        if (deltaY > 30) {
            handleInput({ key: "ArrowDown" }); // Simulate Down Arrow Key
        } else if (deltaY < -30) {
            handleInput({ key: "ArrowUp" }); // Simulate Up Arrow Key
        }
    }
}

// Existing handleInput logic
async function handleInput(e) {
    switch (e.key) {
        case "ArrowUp":
            if (!canMoveUp()) {
                setupInput();
                return;
            }
            await moveUp();
            break;
        case "ArrowDown":
            if (!canMoveDown()) {
                setupInput();
                return;
            }
            await moveDown();
            break;
        case "ArrowLeft":
            if (!canMoveLeft()) {
                setupInput();
                return;
            }
            await moveLeft();
            break;
        case "ArrowRight":
            if (!canMoveRight()) {
                setupInput();
                return;
            }
            await moveRight();
            break;
        default:
            setupInput();
            return;
    }

    grid.cells.forEach(cell => cell.mergeTiles())

    const newTile = new Tile(gameBoard)
    grid.randomEmptyCell().tile = newTile

    if (!canMoveUp() && !canMoveDown() && !canMoveLeft() && !canMoveRight()) {
        newTile.waitForTransition(true).then(() => {
            if (confirm("You lose! Would you like to play again?")) {
                location.reload() // Reload the page to restart the game
            }
        })
        return
    }

    setupInput()
}

function moveUp() {
    return slideTiles(grid.cellsByColumn);
}

function moveDown() {
    return slideTiles(grid.cellsByColumn.map(column => [...column].reverse()));
}

function moveLeft() {
    return slideTiles(grid.cellsByRow);
}

function moveRight() {
    return slideTiles(grid.cellsByRow.map(row => [...row].reverse()));
}

function canMoveUp() {
    return canMove(grid.cellsByColumn)
}

function canMoveDown() {
    return canMove(grid.cellsByColumn.map(column => [...column].reverse()))
}

function canMoveLeft() {
    return canMove(grid.cellsByRow)
}

function canMoveRight() {
    return canMove(grid.cellsByRow.map(row => [...row].reverse()))
}

function canMove(cells) {
    return cells.some(group => {
        return group.some((cell, index) => {
            if(index === 0) return false
            if(cell.tile == null) return false
            const moveToCell = group[index - 1]
            return moveToCell.canAccept(cell.tile)
        })
    })
}

function slideTiles(cells) {
    return Promise.all(
        cells.flatMap(group => {
            const promises = []
            for (let i = 0; i < group.length; i++) {
                const cell = group[i]
                if(cell.tile == null) continue
                let lastValidCell
                for (let j = i - 1; j >= 0; j--) {
                    const moveToCell = group[j]
                    if(!moveToCell.canAccept(cell.tile)) break
                    lastValidCell = moveToCell
                }
                if(lastValidCell != null) {
                    promises.push(cell.tile.waitForTransition())
                    if(lastValidCell.tile != null) {
                        lastValidCell.mergeTile = cell.tile
                    } else {
                        lastValidCell.tile = cell.tile
                    }
                    cell.tile = null
                }
            }
            return promises
        })
    )
}