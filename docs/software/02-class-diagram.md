# Software Class Diagram & Flow — webJS Game Portfolio

**Version:** 1.1.0 | **Last Updated:** 2026-07-28

---

## 1. Portfolio Data Flow & High Score Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Player
    participant UI as "Portfolio UI (index.html)"
    participant JS as "PortfolioApp Controller (script.js)"
    participant Modal as "Modal Iframe Component"
    participant Game as "Target Game (e.g. tile-match)"
    participant Storage as "HighScoreManager (LocalStorage)"

    Player->>UI: Opens Portfolio Site
    UI->>JS: Init Portfolio (load gamesData & highScores)
    JS->>Storage: getHighScores()
    Storage-->>JS: Return stored scores JSON
    JS->>UI: Render Game Cards Grid with HighScore Badges
    
    Player->>UI: Click "Play" on Game Card
    UI->>JS: openGameModal(gameId)
    JS->>Modal: Create/Show Iframe Modal with Game URL
    Modal->>Game: Load game index.html & game.js
    Game-->>Modal: Game Initialized
    
    Player->>Game: Plays Game & Reaches High Score
    Game->>JS: window.parent.postMessage({ type: 'WEBJS_HIGH_SCORE', gameId, score }, '*')
    JS->>Storage: saveHighScore(gameId, score)
    Storage->>Storage: Compare & Save to localStorage
    Storage-->>JS: High Score Updated (isNewRecord: true)
    JS->>UI: Update High Score Badge on Portfolio Card
    
    Player->>UI: Press ESC / Click Close
    UI->>JS: closeGameModal()
    JS->>Modal: Hide & Unload Iframe
```

---

## 2. Component Class Diagram

```mermaid
classDiagram
    class GameDataModel {
        +String id
        +String title
        +String category
        +String url
        +String aspectRatio
        +String image
        +String gradient
        +Number highScore
    }

    class PortfolioApp {
        -Array~GameDataModel~ gamesData
        -HTMLElement container
        -HTMLElement modalContainer
        -HighScoreManager highScoreManager
        -AudioEngine audioEngine
        +init()
        +renderCards(games)
        +filterByCategory(category)
        +searchGames(keyword)
        +openGameModal(gameId)
        +closeGameModal()
        +setupKeyboardShortcuts()
        +listenForGameMessages()
    }

    class HighScoreManager {
        -String storageKey
        +getHighScore(gameId) Number
        +saveHighScore(gameId, score) Boolean
        +getAllHighScores() Object
        +clearHighScores()
    }

    class AudioEngine {
        -AudioContext audioCtx
        +playSynthSFX(type)
        +toggleMute()
    }

    class GameInstance {
        +String gameId
        +Number score
        +initGame()
        +update()
        +sendScoreToParent(score)
    }

    PortfolioApp "1" o-- "*" GameDataModel : manages
    PortfolioApp "1" o-- "1" HighScoreManager : uses
    PortfolioApp "1" o-- "1" AudioEngine : uses
    PortfolioApp ..> GameInstance : launches & receives postMessage
```

---

## Related Documents
- System Design: [Subsystem Breakdown](./01-system-design.md)
- Data Schema: [Data Structures & Persistence](./03-data-schema.md)
- Backlog: [Product Backlog](../agile/01-product-backlog.md)
