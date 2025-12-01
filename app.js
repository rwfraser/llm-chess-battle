// Main application logic with chess.js and chessboard.js integration
let game = null;
let board = null;
let gameRunning = false;
let whiteModel = null;
let blackModel = null;
let apiKeys = {};

// Initialize the application - wait for all libraries to load
window.addEventListener('load', () => {
    // Check if libraries loaded
    if (typeof Chess === 'undefined') {
        console.error('Chess.js library not loaded');
        alert('Error: Chess library failed to load. Please refresh the page.');
        return;
    }
    if (typeof Chessboard === 'undefined') {
        console.error('Chessboard.js library not loaded');
        alert('Error: Chessboard library failed to load. Please refresh the page.');
        return;
    }
    
    try {
        game = new Chess();
        initializeBoard();
        setupEventListeners();
        updateGameInfo();
    } catch (error) {
        console.error('Initialization error:', error);
        alert('Error initializing game: ' + error.message);
    }
});

function setupEventListeners() {
    document.getElementById('start-game').addEventListener('click', startGame);
    document.getElementById('reset-game').addEventListener('click', resetGame);
}

function initializeBoard() {
    const config = {
        draggable: false,
        position: 'start',
        pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
    };
    board = Chessboard('chessboard', config);
}

function updateGameInfo() {
    const turn = game.turn() === 'w' ? 'White' : 'Black';
    document.getElementById('current-turn').textContent = turn;
    document.getElementById('move-number').textContent = Math.floor(game.history().length / 2) + 1;
    
    // Update game status
    if (game.isCheckmate()) {
        setStatus('Checkmate! ' + (game.turn() === 'w' ? 'Black' : 'White') + ' wins!');
        gameRunning = false;
    } else if (game.isDraw()) {
        setStatus('Draw!');
        gameRunning = false;
    } else if (game.isStalemate()) {
        setStatus('Stalemate!');
        gameRunning = false;
    } else if (game.isThreefoldRepetition()) {
        setStatus('Draw by threefold repetition');
        gameRunning = false;
    } else if (game.isInsufficientMaterial()) {
        setStatus('Draw by insufficient material');
        gameRunning = false;
    } else if (game.isCheck()) {
        setStatus('Check!');
    } else if (gameRunning) {
        setStatus('Playing...');
    }
}

function updateMoveHistory(move) {
    const movesList = document.getElementById('moves-list');
    const moveEntry = document.createElement('div');
    moveEntry.className = 'move-entry';
    
    const moveNum = Math.floor((game.history().length - 1) / 2) + 1;
    const color = move.color === 'w' ? 'White' : 'Black';
    const san = move.san;
    
    moveEntry.textContent = `${moveNum}. ${color}: ${san}`;
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
    board.position('start');
    updateGameInfo();
    document.getElementById('moves-list').innerHTML = '';
    document.getElementById('start-game').disabled = false;
    setStatus('Ready');
}

async function playGame() {
    while (gameRunning && !game.isGameOver()) {
        const currentModel = game.turn() === 'w' ? whiteModel : blackModel;
        const turnName = game.turn() === 'w' ? 'White' : 'Black';
        
        setStatus(`${turnName} is thinking...`);
        
        try {
            const move = await getLLMMove(currentModel);
            
            if (move) {
                const moveResult = game.move(move);
                if (moveResult) {
                    board.position(game.fen());
                    updateMoveHistory(moveResult);
                    updateGameInfo();
                    
                    // 3-second pause for observation
                    await sleep(3000);
                } else {
                    console.error('Invalid move attempted:', move);
                    setStatus('Error - Invalid move');
                    gameRunning = false;
                    break;
                }
            } else {
                setStatus('No valid move found - Game Over');
                gameRunning = false;
                break;
            }
            
        } catch (error) {
            console.error('Error getting move:', error);
            setStatus('Error - Game stopped');
            gameRunning = false;
        }
    }
    
    // Final status update
    if (game.isGameOver()) {
        updateGameInfo();
    }
    
    document.getElementById('start-game').disabled = false;
}

async function getLLMMove(modelName) {
    const legalMoves = game.moves();
    
    if (legalMoves.length === 0) {
        return null;
    }
    
    // Try to get move from LLM
    try {
        const [provider, model] = modelName.split(':');
        const prompt = buildChessPrompt(legalMoves);
        
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

function buildChessPrompt(legalMoves) {
    const turn = game.turn() === 'w' ? 'White' : 'Black';
    const moveOptions = legalMoves.map((m, i) => `${i + 1}. ${m}`).join(', ');
    
    // Get recent moves for context
    const history = game.history({ verbose: true });
    const recentMoves = history.slice(-6).map(m => m.san).join(' ');
    
    return `You are playing chess as ${turn}.

Current position (FEN): ${game.fen()}
Recent moves: ${recentMoves || 'Game start'}
${game.isCheck() ? 'You are in CHECK!' : ''}

Legal moves (${legalMoves.length} options): ${moveOptions}

Choose the best move by responding with ONLY the move number (1-${legalMoves.length}). 
For example, respond with just "1" or "5".

Think strategically:
- Protect your king
- Control the center
- Develop pieces
- Look for tactical opportunities`;
}

function parseMove(response, legalMoves) {
    // Try to extract a number from the response
    const numberMatch = response.match(/\b(\d+)\b/);
    if (numberMatch) {
        const moveIndex = parseInt(numberMatch[1]) - 1;
        if (moveIndex >= 0 && moveIndex < legalMoves.length) {
            return legalMoves[moveIndex];
        }
    }
    
    // Try to match move notation directly (e.g., "e4", "Nf3", "O-O")
    for (const move of legalMoves) {
        if (response.includes(move)) {
            return move;
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
            parameters: { 
                max_new_tokens: 20, 
                temperature: 0.7,
                return_full_text: false
            }
        })
    });
    
    if (!response.ok) {
        throw new Error(`HuggingFace API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data[0]?.generated_text || '';
}

async function queryTogether(model, prompt, apiKey) {
    if (!apiKey) {
        throw new Error('Together AI API key required');
    }
    
    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 20,
            temperature: 0.7
        })
    });
    
    if (!response.ok) {
        throw new Error(`Together AI API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
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
            max_tokens: 20,
            temperature: 0.7
        })
    });
    
    if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}