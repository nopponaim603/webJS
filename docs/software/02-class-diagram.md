# Software Class Diagram & Flow — webJS Game Portfolio

**Version:** 1.0.0 | **Last Updated:** 2026-07-26

---

## 1. Portfolio Data Flow Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Player
    participant UI as Portfolio UI (index.html)
    participant JS as Script Controller (script.js)
    participant Modal as Modal Iframe Component
    participant Game as Target Game (e.g. tile-match)

    Player->>UI: Opens Portfolio Site
    UI->>JS: Init Portfolio (load gamesData)
    JS->>UI: Render Game Cards Grid
    
    Player->>UI: Click "Play" on Game Card
    UI->>JS: openGameModal(gameId)
    JS->>Modal: Create/Show Iframe Modal with Game URL
    Modal->>Game: Load game index.html & game.js
    Game-->>Modal: Game Initialized
    
    Player->>Game: Plays Game & Scores Points
    Game->>JS: Post High Score (optional message event)
    Player->>UI: Press ESC / Click Close
    UI->>JS: closeGameModal()
    JS->>Modal: Hide & Unload Iframe
```

---

## 2. Component Class / Model Diagram

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
    }

    class PortfolioApp {
        -Array~GameDataModel~ gamesData
        -HTMLElement container
        -HTMLElement modalContainer
        +init()
        +renderCards(games)
        +filterByCategory(category)
        +searchGames(keyword)
        +openGameModal(gameId)
        +closeGameModal()
        +setupKeyboardShortcuts()
    }

    class GameInstance {
        +String gameId
        +Number score
        +Number highScore
        +initGame()
        +update()
        +saveHighScore()
    }

    PortfolioApp "1" o-- "*" GameDataModel : manages
    PortfolioApp ..> GameInstance : launches in iframe
```

---

## Related Documents
- System Design: [Subsystem Breakdown](./01-system-design.md)
- Data Schema: [Data Structures & Persistence](./03-data-schema.md)
