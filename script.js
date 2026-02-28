// ==========================================
// 1. GAME STATE & MAPPING
// ==========================================
let players = [];
let currentPlayerIndex = 0;
let numPlayers = 4;
let diceValue = 1;
let hasRolled = false;

const colors = ['red', 'green', 'yellow', 'blue'];

const commonPath = [
    [6,1], [6,2], [6,3], [6,4], [6,5],             
    [5,6], [4,6], [3,6], [2,6], [1,6], [0,6],      
    [0,7], [0,8],                                  
    [1,8], [2,8], [3,8], [4,8], [5,8],             
    [6,9], [6,10], [6,11], [6,12], [6,13], [6,14], 
    [7,14], [8,14],                                
    [8,13], [8,12], [8,11], [8,10], [8,9],         
    [9,8], [10,8], [11,8], [12,8], [13,8], [14,8], 
    [14,7], [14,6],                                
    [13,6], [12,6], [11,6], [10,6], [9,6],         
    [8,5], [8,4], [8,3], [8,2], [8,1], [8,0],      
    [7,0], [6,0]                                   
];

const safeZones = [
    '[6,1]', '[1,8]', '[8,13]', '[13,6]',
    '[6,2]', '[2,8]', '[8,12]', '[12,6]'
];

const startIndexes = { red: 0, green: 13, yellow: 26, blue: 39 };

const homePaths = {
    red:    [[7,1], [7,2], [7,3], [7,4], [7,5]],
    blue:   [[13,7], [12,7], [11,7], [10,7], [9,7]],
    yellow: [[7,13], [7,12], [7,11], [7,10], [7,9]],
    green:  [[1,7], [2,7], [3,7], [4,7], [5,7]]
};

// ==========================================
// 2. DOM ELEMENTS
// ==========================================
const setupScreen = document.getElementById('setup-screen');
const gameScreen = document.getElementById('game-screen');
const startBtn = document.getElementById('start-btn');
const boardEl = document.getElementById('board');
const diceEl = document.getElementById('dice');
const rollBtn = document.getElementById('roll-btn');
const restartBtn = document.getElementById('restart-btn');
const diceResultText = document.getElementById('dice-result-text');
const scoreList = document.getElementById('score-list');
const resetScoresBtn = document.getElementById('reset-scores-btn');

const rollSound = new Audio('https://www.soundjay.com/misc/sounds/dice-roll-1.mp3');

// ==========================================
// 3. SCOREBOARD LOGIC
// ==========================================
let scores = JSON.parse(localStorage.getItem('chausarScores')) || {};

function updateScoreboardUI() {
    scoreList.innerHTML = '';
    const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    
    if (sortedScores.length === 0) {
        scoreList.innerHTML = '<li>No wins yet!</li>';
        return;
    }

    sortedScores.forEach(([playerName, wins]) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${playerName}</span> <span>${wins} 🏆</span>`;
        scoreList.appendChild(li);
    });
}

resetScoresBtn.addEventListener('click', () => {
    if(confirm("Are you sure you want to delete all win records?")) {
        scores = {};
        localStorage.removeItem('chausarScores');
        updateScoreboardUI();
    }
});

updateScoreboardUI();

// ==========================================
// 4. INITIALIZATION & UI SETUP
// ==========================================
startBtn.addEventListener('click', () => {
    numPlayers = parseInt(document.getElementById('player-count').value);
    
    for(let i = 0; i < numPlayers; i++) {
        players.push({
            id: i,
            name: document.getElementById(`p${i+1}-name`).value,
            color: colors[i],
            tokens: [
                { id: `${i}-0`, position: -1, state: 'base' },
                { id: `${i}-1`, position: -1, state: 'base' },
                { id: `${i}-2`, position: -1, state: 'base' },
                { id: `${i}-3`, position: -1, state: 'base' }
            ]
        });
        document.getElementById(`name-${i}`).innerText = players[i].name;
    }

    for(let i = numPlayers; i < 4; i++) {
        document.getElementById(`panel-${i}`).style.display = 'none';
    }

    generateBoardUI();
    initializeTokens(); 
    
    setupScreen.classList.remove('active');
    gameScreen.classList.add('active'); 
    
    updateTurnUI();
});

restartBtn.addEventListener('click', () => {
    window.location.reload();
});

function generateBoardUI() {
    boardEl.innerHTML = '';
    for (let r = 0; r < 15; r++) {
        for (let c = 0; c < 15; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.id = `cell-${r}-${c}`;
            
            const isTopArm = r >= 0 && r <= 5 && c >= 6 && c <= 8;
            const isBottomArm = r >= 9 && r <= 14 && c >= 6 && c <= 8;
            const isLeftArm = r >= 6 && r <= 8 && c >= 0 && c <= 5;
            const isRightArm = r >= 6 && r <= 8 && c >= 9 && c <= 14;
            const isCenter = r >= 6 && r <= 8 && c >= 6 && c <= 8;

            if (!isTopArm && !isBottomArm && !isLeftArm && !isRightArm && !isCenter) {
                cell.style.visibility = 'hidden'; 
                cell.style.border = 'none';
                cell.style.backgroundColor = 'transparent';
            } else {
                if(isCenter) cell.style.backgroundColor = '#7f8c8d'; 

                if (r === 7 && c >= 1 && c <= 5) cell.style.backgroundColor = 'rgba(211, 47, 47, 0.4)';
                if (r >= 9 && r <= 13 && c === 7) cell.style.backgroundColor = 'rgba(25, 118, 210, 0.4)'; 
                if (r === 7 && c >= 9 && c <= 13) cell.style.backgroundColor = 'rgba(251, 192, 45, 0.4)';
                if (r >= 1 && r <= 5 && c === 7) cell.style.backgroundColor = 'rgba(56, 142, 60, 0.4)';  

                if (r === 6 && c === 1) { cell.style.backgroundColor = 'rgba(211, 47, 47, 0.6)'; cell.innerHTML = '➡️'; }
                if (r === 1 && c === 8) { cell.style.backgroundColor = 'rgba(56, 142, 60, 0.6)'; cell.innerHTML = '⬇️'; } 
                if (r === 8 && c === 13) { cell.style.backgroundColor = 'rgba(251, 192, 45, 0.6)'; cell.innerHTML = '⬅️'; } 
                if (r === 13 && c === 6) { cell.style.backgroundColor = 'rgba(25, 118, 210, 0.6)'; cell.innerHTML = '⬆️'; }  

                if (safeZones.includes(`[${r},${c}]`)) {
                    cell.style.backgroundColor = 'rgba(255, 215, 0, 0.3)'; 
                    cell.innerHTML = '⭐';
                }
            }

            boardEl.appendChild(cell);
        }
    }
}

function initializeTokens() {
    players.forEach(player => {
        const basePanel = document.getElementById(`panel-${player.id}`);
        player.tokens.forEach(tokenData => {
            const tokenEl = document.createElement('div');
            tokenEl.classList.add('token', player.color);
            tokenEl.id = `token-${tokenData.id}`;
            basePanel.appendChild(tokenEl);

            tokenEl.addEventListener('click', () => {
                if (player.id !== currentPlayerIndex) return console.log("Not your turn!");
                if (!hasRolled) return console.log("Roll the dice first!");
                if (tokenData.state === 'base' && diceValue !== 6) return console.log("Need a 6 to exit base.");
                moveToken(player.color, tokenData.id, diceValue);
            });
        });
    });
}

// ==========================================
// 5. DICE LOGIC
// ==========================================
rollBtn.addEventListener('click', () => {
    if (hasRolled) return;
    
    rollSound.currentTime = 0;
    rollSound.play().catch(e => console.log("Audio play prevented"));

    diceEl.classList.add('rolling');
    rollBtn.disabled = true;

    setTimeout(() => {
        diceValue = Math.floor(Math.random() * 6) + 1;
        diceEl.classList.remove('rolling');
        applyDiceRotation(diceValue);
        
        diceResultText.innerText = `${players[currentPlayerIndex].name} rolled a ${diceValue}!`;
        hasRolled = true;

        handleTurnLogic();
    }, 1000); 
});

function applyDiceRotation(value) {
    let rotX = 0, rotY = 0;
    switch(value) {
        case 1: rotX = 0; rotY = 0; break;
        case 2: rotX = 0; rotY = -90; break;
        case 3: rotX = 0; rotY = -180; break;
        case 4: rotX = 0; rotY = 90; break;
        case 5: rotX = -90; rotY = 0; break;
        case 6: rotX = 90; rotY = 0; break;
    }
    diceEl.style.transform = `translateZ(-40px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
}

// ==========================================
// 6. TURN & MOVEMENT LOGIC
// ==========================================
function handleTurnLogic() {
    const player = players[currentPlayerIndex];
    let canMove = player.tokens.some(t => t.state === 'board' || (t.state === 'base' && diceValue === 6));

    if (!canMove) {
        setTimeout(endTurn, 1500);
    } else {
        diceResultText.innerText += " Select a token to move.";
    }
}

function getCell(row, col) {
    return document.getElementById(`cell-${row}-${col}`);
}

function moveToken(playerColor, tokenId, stepsToMove) {
    const player = players.find(p => p.color === playerColor);
    const token = player.tokens.find(t => t.id === tokenId);
    
    if (token.state === 'base' && diceValue === 6) {
        token.state = 'board';
        token.position = 0;
        const [r, c] = commonPath[startIndexes[playerColor]];
        getCell(r, c).appendChild(document.getElementById(`token-${tokenId}`));
        updateBaseCountUI(player.id);
        endTurn(); 
        return;
    }

    if (token.state === 'board') {
        const newSteps = token.position + stepsToMove;

        if (newSteps > 56) {
            console.log("Need exact roll to enter home!");
            endTurn();
            return;
        }

        token.position = newSteps;
        let targetR, targetC;

        if (newSteps <= 50) {
            let trackIndex = (startIndexes[playerColor] + newSteps) % 52;
            [targetR, targetC] = commonPath[trackIndex];
        } else if (newSteps > 50 && newSteps <= 55) {
            const homeIndex = newSteps - 51; 
            [targetR, targetC] = homePaths[playerColor][homeIndex];
        } else if (newSteps === 56) {
            token.state = 'finished';
            document.getElementById(`token-${tokenId}`).style.display = 'none'; 
            checkWinCondition(player);
            endTurn();
            return;
        }

        const targetCell = getCell(targetR, targetC);
        targetCell.appendChild(document.getElementById(`token-${tokenId}`));

        const didCapture = checkCapture(targetCell, playerColor);

        if (didCapture) {
            diceResultText.innerText = `Token Captured! ${players[currentPlayerIndex].name} gets an extra roll!`;
            hasRolled = false;       
            rollBtn.disabled = false;
            return; 
        }

        endTurn();
    }
}

function endTurn() {
    hasRolled = false;
    rollBtn.disabled = false;
    if (diceValue !== 6) currentPlayerIndex = (currentPlayerIndex + 1) % numPlayers;
    updateTurnUI();
}

function updateTurnUI() {
    document.querySelectorAll('.player-panel').forEach(panel => {
        panel.classList.remove('active');
        panel.style.borderColor = 'transparent';
    });
    const currentPanel = document.getElementById(`panel-${currentPlayerIndex}`);
    currentPanel.classList.add('active');
    currentPanel.style.borderColor = 'white';

    diceResultText.innerText = `${players[currentPlayerIndex].name}'s Turn`;
    diceEl.style.transform = `translateZ(-40px) rotateX(0deg) rotateY(0deg)`; 
}

// ==========================================
// 7. COLLISION, UI UPDATES & WIN CONDITIONS
// ==========================================
function checkCapture(targetCell, movingPlayerColor) {
    const [_, r, c] = targetCell.id.split('-');
    if (safeZones.includes(`[${r},${c}]`)) return false; 

    let captured = false;
    players.forEach(opponent => {
        if (opponent.color === movingPlayerColor) return;
        opponent.tokens.forEach(enemyToken => {
            if (enemyToken.state === 'board') {
                const enemyTokenElement = document.getElementById(`token-${enemyToken.id}`);
                if (targetCell.contains(enemyTokenElement)) {
                    enemyToken.state = 'base';
                    enemyToken.position = -1;
                    document.getElementById(`panel-${opponent.id}`).appendChild(enemyTokenElement);
                    updateBaseCountUI(opponent.id);
                    
                    targetCell.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
                    setTimeout(() => targetCell.style.backgroundColor = '', 300);
                    captured = true;
                }
            }
        });
    });
    return captured;
}

function updateBaseCountUI(playerId) {
    const player = players.find(p => p.id === playerId);
    const tokensInBase = player.tokens.filter(t => t.state === 'base').length;
    document.getElementById(`base-${playerId}`).innerText = tokensInBase;
}

function checkWinCondition(player) {
    const hasWon = player.tokens.every(t => t.state === 'finished');
    if (hasWon) {
        diceResultText.innerText = `🎉 ${player.name} WINS THE GAME! 🎉`;
        diceResultText.style.color = 'gold';
        rollBtn.style.display = 'none'; 
        restartBtn.style.display = 'block'; 
        
        scores[player.name] = (scores[player.name] || 0) + 1;
        localStorage.setItem('chausarScores', JSON.stringify(scores));
        updateScoreboardUI();

        triggerWinCelebration();
    }
}

// ==========================================
// 8. CONFETTI CELEBRATION ANIMATION
// ==========================================
const canvas = document.getElementById('confetti-canvas');
const ctx = canvas.getContext('2d');
let particles = [];
let animationTimer;
const confettiColors = ['#D32F2F', '#388E3C', '#FBC02D', '#1976D2', '#FF9800', '#9C27B0'];

function createConfetti() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    particles = [];
    for (let i = 0; i < 150; i++) {
        particles.push({
            x: canvas.width / 2, 
            y: canvas.height / 2 + 100,
            r: Math.random() * 6 + 4, 
            dx: Math.random() * 15 - 7.5, 
            dy: Math.random() * -15 - 5,  
            color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
            tilt: Math.floor(Math.random() * 10) - 10,
            tiltAngle: 0,
            tiltAngleInc: (Math.random() * 0.07) + 0.05
        });
    }
}

function drawConfetti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p, index) => {
        p.tiltAngle += p.tiltAngleInc;
        p.dy += 0.2; 
        p.y += p.dy;
        p.x += p.dx;
        p.x += Math.sin(p.tiltAngle) * 2;

        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r);
        ctx.stroke();

        if (p.y > canvas.height) particles.splice(index, 1);
    });

    if (particles.length > 0) {
        animationTimer = requestAnimationFrame(drawConfetti);
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

function triggerWinCelebration() {
    createConfetti();
    drawConfetti();
    setTimeout(() => {
        createConfetti();
        drawConfetti();
    }, 500);
}

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});
