// Main application logic
let game = null;
let gameRunning = false;
let whiteModel = null;
let blackModel = null;
let apiKeys = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    game = new ChessGame();
    renderBoard();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('start-game').addEventListener('click', startGame);
    document.getElementById('reset-game').addEventListener('click', resetGame);
}

function renderBoard() {
    const boardElement = document.getElementById('chessboard');
    boardElement.innerHTML = '';
    
    const board = game.getBoardState();
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.className = 'square';
            square.className += (row + col) % 2 === 0 ? ' light' : ' dark';
            square.textContent = board[row][col];
            square.dataset.row = row;
            square.dataset.col = col;
            boardElement.appendChild(square);
        }
    }
}

function updateGameInfo() {
    document.getElementById('current-turn').textContent = 
        game.currentTurn.charAt(0).toUpperCase() + game.currentTurn.slice(1);
    document.getElementById('move-number').textContent = Math.floor(game.moveCount / 2) + 1;
}

function updateMoveHistory(move) {
    const movesList = document.getElementById('moves-list');
    const moveEntry = document.createElement('div');
    moveEntry.className = 'move-entry';
    const moveNum = Math.floor(game.moveCount / 2);
    const color = game.currentTurn === 'white' ? 'Black' : 'White';
    moveEntry.textContent = `${moveNum}. ${color}: ${move}`;
    movesList.appendChild(moveEntry);
    movesList.scrollTop = movesList.scrollHeight;
}

function setStatus(status) {
    document.getElementById('game-status').textContent = status;
}

async function startGame() {
    const whiteSelect = document.getElementById('white-model').value;
    const blackSelect = document.getElementById('black-model').value;
    
    if (!whiteSelect || !blackSelect) {
        alert('Please select models for both players');
        return;
    }
    
    whiteModel = whiteSelect;
    blackModel = blackSelect;
    
    // Get API keys
    apiKeys = {
        huggingface: document.getElementById('huggingface-key').value,
        together: document.getElementById('together-key').value,
        openrouter: document.getElementById('openrouter-key').value
    };
    
    gameRunning = true;
    document.getElementById('start-game').disabled = true;
    setStatus('Playing...');
    
    // Start the game loop
    playGame();
}

function resetGame() {
    gameRunning = false;
    game.reset();
    renderBoard();
    updateGameInfo();
    document.getElementById('moves-list').innerHTML = '';
    document.getElementById('start-game').disabled = false;
    setStatus('Ready');
}

async function playGame() {
    while (gameRunning && !game.gameOver) {
        const currentModel = game.currentTurn === 'white' ? whiteModel : blackModel;
        
        setStatus(`${game.currentTurn} is thinking...`);
        
        try {
            const move = await getLLMMove(currentModel, game);
            
            if (move) {
                game.makeMove(move.from, move.to);
                updateMoveHistory(game.moveHistory[game.moveHistory.length - 1]);
                renderBoard();
                updateGameInfo();
                setStatus('Playing...');
                
                // 3-second pause for observation
                await sleep(3000);
            } else {
                setStatus('No valid move found - Game Over');
                gameRunning = false;
                break;
            }
            
            // Check for game over (simplified - just check move count)
            if (game.moveCount > 100) {
                setStatus('Draw - 50 moves');
                gameRunning = false;
            }
            
        } catch (error) {
            console.error('Error getting move:', error);
            setStatus('Error - Game stopped');
            gameRunning = false;
        }
    }
    
    document.getElementById('start-game').disabled = false;
}

async function getLLMMove(modelName, game) {
    const legalMoves = game.getAllLegalMoves(game.currentTurn);
    
    if (legalMoves.length === 0) {
        return null;
    }
    
    // Try to get move from LLM
    try {
        const [provider, model] = modelName.split(':');
        const prompt = buildChessPrompt(game, legalMoves);
        
        let response;
        switch (provider) {
            case 'huggingface':
                response = await queryHuggingFace(model, prompt, apiKeys.huggingface);
                break;
            case 'together':
                response = await queryTogether(model, prompt, apiKeys.together);
                break;
            case 'openrouter':
                response = await queryOpenRouter(model, prompt, apiKeys.openrouter);
                break;
            default:
                response = null;
        }
        
        if (response) {
            const selectedMove = parseMove(response, legalMoves);
            if (selectedMove) {
                return selectedMove;
            }
        }
    } catch (error) {
        console.error('LLM API error:', error);
    }
    
    // Fallback: random move
    return legalMoves[Math.floor(Math.random() * legalMoves.length)];
}

function buildChessPrompt(game, legalMoves) {
    const moveOptions = legalMoves.map((m, i) => 
        `${i + 1}. ${game.toAlgebraic(m.from, m.to, game.board[m.from[0]][m.from[1]], game.board[m.to[0]][m.to[1]])}`
    ).join(', ');
    
    return `You are playing chess as ${game.currentTurn}. 
Board state:
${game.getGameStateString()}

Legal moves: ${moveOptions}

Choose the best move by responding with ONLY the move number (1-${legalMoves.length}). For example, respond with just "1" or "5".`;
}

function parseMove(response, legalMoves) {
    // Try to extract a number from the response
    const match = response.match(/\b(\d+)\b/);
    if (match) {
        const moveIndex = parseInt(match[1]) - 1;
        if (moveIndex >= 0 && moveIndex < legalMoves.length) {
            return legalMoves[moveIndex];
        }
    }
    return null;
}

// API Functions
async function queryHuggingFace(model, prompt, apiKey) {
    if (!apiKey) {
        throw new Error('HuggingFace API key required');
    }
    
    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            inputs: prompt,
            parameters: { max_new_tokens: 10, temperature: 0.7 }
        })
    });
    
    const data = await response.json();
    return data[0]?.generated_text || '';
}

async function queryTogether(model, prompt, apiKey) {
    if (!apiKey) {
        throw new Error('Together AI API key required');
    }
    
    const response = await fetch('https://api.together.xyz/inference', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: model,
            prompt: prompt,
            max_tokens: 10,
            temperature: 0.7
        })
    });
    
    const data = await response.json();
    return data.output?.choices[0]?.text || '';
}

async function queryOpenRouter(model, prompt, apiKey) {
    if (!apiKey) {
        throw new Error('OpenRouter API key required');
    }
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'LLM Chess Battle'
        },
        body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 10,
            temperature: 0.7
        })
    });
    
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
