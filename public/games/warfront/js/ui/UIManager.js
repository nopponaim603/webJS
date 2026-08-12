/**
 * @file UIManager.js
 * @description HUD Overlay Controls, Clock Updates, Attack Slider, & Settings Modal Handler.
 * @module ui/UIManager
 */

/**
 * Game In-Match HUD UI Manager
 */
export class UIManager {
  /**
   * @param {import('../engine/GameState.js').GameStateManager} gameState
   * @param {function(): void} onExitMatchCallback
   */
  constructor(gameState, onExitMatchCallback) {
    this.gameState = gameState;
    this.onExitMatch = onExitMatchCallback;

    // HUD DOM Elements
    this.hudElement = document.getElementById("GameHud");
    this.clockElement = document.getElementById("gameClock");
    this.openSettingsBtn = document.getElementById("openSettings");
    this.exitGameBtn = document.getElementById("exitGame");

    // Attack Strength Selector Elements
    this.attackSlider = document.getElementById("sliderAttackHidden");
    this.attackNumberLabel = document.getElementById("sliderAttackNumber");
    this.densityNumberLabel = document.getElementById("selectorDensityNumber");
    this.troopCountLabel = document.getElementById("selectorTroopCount");

    this.attackPercentage = 50.0;
  }

  /**
   * Initialize DOM event handlers for HUD controls.
   */
  init() {
    if (this.exitGameBtn) {
      this.exitGameBtn.addEventListener("click", () => {
        this.hideHUD();
        if (this.onExitMatch) {
          this.onExitMatch();
        }
      });
    }

    if (this.openSettingsBtn) {
      this.openSettingsBtn.addEventListener("click", () => {
        alert("Settings: Audio and Theme options");
      });
    }

    if (this.attackSlider) {
      this.attackSlider.addEventListener("input", (e) => {
        const val = parseFloat(e.target.value);
        this.attackPercentage = val;
        if (this.attackNumberLabel) {
          this.attackNumberLabel.textContent = `${val.toFixed(1)}%`;
        }
      });
    }
  }

  /**
   * Show HUD overlay.
   */
  showHUD() {
    if (this.hudElement) {
      this.hudElement.style.display = "block";
    }
  }

  /**
   * Hide HUD overlay.
   */
  hideHUD() {
    if (this.hudElement) {
      this.hudElement.style.display = "none";
    }
  }

  /**
   * Update HUD clock display and player troop stats.
   * @param {import('../engine/GameState.js').Player} [localPlayer]
   */
  update(localPlayer) {
    if (this.gameState && this.clockElement) {
      this.clockElement.textContent = this.gameState.getFormattedClock();
    }

    if (localPlayer) {
      if (this.troopCountLabel) {
        this.troopCountLabel.textContent = String(localPlayer.getTroops());
      }
      if (this.densityNumberLabel) {
        const density = localPlayer.getTerritorySize() > 0 ? (localPlayer.getTroops() / localPlayer.getTerritorySize()).toFixed(1) : "0.0";
        this.densityNumberLabel.textContent = density;
      }
    }
  }
}