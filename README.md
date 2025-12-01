# LLM Chess Battle 🎮♟️

An interactive chess game where different AI language models compete against each other in real-time.

## Features

- **LLM vs LLM Chess**: Watch different AI models battle it out
- **Multiple Model Support**: Choose from various free LLM providers
- **Real-time Visualization**: 3-second pause between moves for observation
- **Move History**: Track all moves made during the game
- **Responsive Design**: Works on desktop and mobile devices

## Supported Models

- **HuggingFace**: GPT-2, DistilGPT-2
- **Together AI**: RedPajama-3B
- **OpenRouter**: GPT-3.5-Turbo (free tier)

## Setup

1. **No installation required** - This is a pure HTML/CSS/JavaScript application
2. Get free API keys (optional but recommended):
   - [HuggingFace](https://huggingface.co/settings/tokens)
   - [Together AI](https://api.together.xyz/signup)
   - [OpenRouter](https://openrouter.ai/keys)

## How to Use

1. Open `index.html` in a web browser
2. Select LLM models for White and Black players
3. Enter your API keys (if you have them)
4. Click "Start Game"
5. Watch the AI models battle!

## Hosting Options

### Option 1: GitHub Pages (Recommended - Completely Free)
1. Create a GitHub repository
2. Push these files to the repository
3. Go to Settings → Pages
4. Select your main branch
5. Your game will be live at: `https://yourusername.github.io/repository-name`

**Pros**: Free, reliable, automatic HTTPS, easy updates via git push

### Option 2: Netlify (Free Tier)
1. Sign up at [netlify.com](https://netlify.com)
2. Drag and drop the folder or connect your GitHub repo
3. Instant deployment with custom domain support

**Pros**: Free, easy deployment, automatic builds, serverless functions available

### Option 3: Vercel (Free Tier)
1. Sign up at [vercel.com](https://vercel.com)
2. Import your project or drag and drop
3. One-click deployment

**Pros**: Free, excellent performance, automatic HTTPS, preview deployments

### Option 4: CodePen
1. Create account at [codepen.io](https://codepen.io)
2. Create new pen
3. Copy HTML, CSS, and JS into respective sections
4. Share the live link

**Pros**: Instant preview, no setup, great for demos

## Project Structure

```
llm-chess-battle/
├── index.html      # Main HTML structure
├── styles.css      # Styling and responsive design
├── app.js          # Application logic and LLM API integration
└── README.md       # This file
```

**External Libraries (loaded via CDN):**
- chess.js - Complete chess rules engine
- chessboard.js - Professional chess board visualization
- jQuery - Required by chessboard.js

## Technical Details

- **Chess Engine**: chess.js library (complete chess rules)
- **Board Visualization**: chessboard.js library
- **Move Validation**: Full chess rules including castling, en passant, promotion
- **Game Detection**: Checkmate, stalemate, draw conditions
- **LLM Integration**: REST API calls to various providers
- **Fallback**: Random valid moves when API fails
- **Rate Limiting**: 3-second minimum delay between moves

## API Notes

- **Free tiers** have rate limits - expect slower gameplay
- **Without API keys**, the game uses random move selection
- Some models may give inconsistent responses - fallback ensures game continues
- CORS may require API keys to work properly from browser

## Future Enhancements

- [ ] Add more LLM providers
- [ ] Save game replays (PGN export)
- [ ] Add ELO rating system for models
- [ ] Tournament mode with multiple games
- [ ] Show LLM thinking process/reasoning
- [ ] Add time controls

## License

MIT License - Feel free to use and modify!

## Contributing

Pull requests welcome! Please feel free to enhance the chess engine or add more LLM providers.
