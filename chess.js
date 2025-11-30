// Simple chess engine for move validation and game state
class ChessGame {
    constructor() {
        this.board = this.initializeBoard();
        this.currentTurn = 'white';
        this.moveCount = 0;
        this.gameOver = false;
        this.moveHistory = [];
    }

    initializeBoard() {
        // Standard chess starting position
        return [
            ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'],
            ['♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟'],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['♙', '♙', '♙', '♙', '♙', '♙', '♙', '♙'],
            ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖']
        ];
    }

    getPieceAt(row, col) {
        return this.board[row][col];
    }

    isWhitePiece(piece) {
        return ['♙', '♖', '♘', '♗', '♕', '♔'].includes(piece);
    }

    isBlackPiece(piece) {
        return ['♟', '♜', '♞', '♝', '♛', '♚'].includes(piece);
    }

    getAllLegalMoves(color) {
        const moves = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && ((color === 'white' && this.isWhitePiece(piece)) || 
                             (color === 'black' && this.isBlackPiece(piece)))) {
                    const pieceMoves = this.getPieceMoves(row, col);
                    moves.push(...pieceMoves);
                }
            }
        }
        return moves;
    }

    getPieceMoves(row, col) {
        const piece = this.board[row][col];
        const moves = [];
        const pieceType = piece.toLowerCase();

        // Simplified move generation (not complete chess rules)
        const directions = {
            '♟': [[1, 0], [1, -1], [1, 1]], // Black pawn
            '♙': [[-1, 0], [-1, -1], [-1, 1]], // White pawn
            '♜': [[1, 0], [-1, 0], [0, 1], [0, -1]], // Rook
            '♖': [[1, 0], [-1, 0], [0, 1], [0, -1]],
            '♞': [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]], // Knight
            '♘': [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]],
            '♝': [[1, 1], [1, -1], [-1, 1], [-1, -1]], // Bishop
            '♗': [[1, 1], [1, -1], [-1, 1], [-1, -1]],
            '♛': [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]], // Queen
            '♕': [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]],
            '♚': [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]], // King
            '♔': [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]
        };

        const dirs = directions[piece] || [];
        const isPawn = piece === '♟' || piece === '♙';
        const isKnight = piece === '♞' || piece === '♘';
        const isKing = piece === '♚' || piece === '♔';

        for (const [dr, dc] of dirs) {
            let newRow = row + dr;
            let newCol = col + dc;
            
            // For sliding pieces, continue in direction
            const maxSteps = (isKnight || isKing || isPawn) ? 1 : 7;
            
            for (let step = 0; step < maxSteps; step++) {
                if (newRow < 0 || newRow > 7 || newCol < 0 || newCol > 7) break;
                
                const targetPiece = this.board[newRow][newCol];
                const isWhiteMoving = this.isWhitePiece(piece);
                
                if (isPawn) {
                    // Pawn forward move
                    if (dc === 0 && !targetPiece) {
                        moves.push({ from: [row, col], to: [newRow, newCol] });
                    }
                    // Pawn capture
                    else if (dc !== 0 && targetPiece && 
                            ((isWhiteMoving && this.isBlackPiece(targetPiece)) ||
                             (!isWhiteMoving && this.isWhitePiece(targetPiece)))) {
                        moves.push({ from: [row, col], to: [newRow, newCol] });
                    }
                } else {
                    if (!targetPiece) {
                        moves.push({ from: [row, col], to: [newRow, newCol] });
                    } else if ((isWhiteMoving && this.isBlackPiece(targetPiece)) ||
                              (!isWhiteMoving && this.isWhitePiece(targetPiece))) {
                        moves.push({ from: [row, col], to: [newRow, newCol] });
                        break; // Can't move through pieces
                    } else {
                        break; // Blocked by own piece
                    }
                }
                
                newRow += dr;
                newCol += dc;
            }
        }

        return moves;
    }

    makeMove(from, to) {
        const [fromRow, fromCol] = from;
        const [toRow, toCol] = to;
        
        const piece = this.board[fromRow][fromCol];
        const captured = this.board[toRow][toCol];
        
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = '';
        
        this.moveCount++;
        this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';
        
        const moveNotation = this.toAlgebraic(from, to, piece, captured);
        this.moveHistory.push(moveNotation);
        
        return moveNotation;
    }

    toAlgebraic(from, to, piece, captured) {
        const files = 'abcdefgh';
        const fromSquare = files[from[1]] + (8 - from[0]);
        const toSquare = files[to[1]] + (8 - to[0]);
        const captureSymbol = captured ? 'x' : '-';
        return `${piece}${fromSquare}${captureSymbol}${toSquare}`;
    }

    getBoardState() {
        return this.board.map(row => row.slice());
    }

    getGameStateString() {
        let state = `Current position:\n`;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col] || '.';
                state += piece + ' ';
            }
            state += '\n';
        }
        state += `\nTurn: ${this.currentTurn}\n`;
        state += `Legal moves: ${this.getAllLegalMoves(this.currentTurn).map(m => 
            this.toAlgebraic(m.from, m.to, this.board[m.from[0]][m.from[1]], this.board[m.to[0]][m.to[1]])
        ).join(', ')}`;
        return state;
    }

    reset() {
        this.board = this.initializeBoard();
        this.currentTurn = 'white';
        this.moveCount = 0;
        this.gameOver = false;
        this.moveHistory = [];
    }
}
