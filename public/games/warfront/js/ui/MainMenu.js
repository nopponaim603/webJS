/**
 * @file MainMenu.js
 * @description Main Menu UI Controller & Match Launcher.
 * @module ui/MainMenu
 */

/**
 * Main Menu UI Controller
 */
export class MainMenu {
  /**
   * @param {function(string): void} onStartSingleplayerCallback
   */
  constructor(onStartSingleplayerCallback) {
    this.menuElement = document.getElementById("MainMenu");
    this.nameInput = document.getElementById("playerNameInput");
    this.validationLabel = document.getElementById("playerNameInputValidation");
    this.startButton = document.getElementById("btnStartSingleplayer");
    this.onStartSingleplayer = onStartSingleplayerCallback;
  }

  /**
   * Initialize DOM event bindings for Main Menu buttons.
   */
  init() {
    if (this.menuElement) {
      this.menuElement.style.display = "block";
    }

    if (this.nameInput) {
      this.nameInput.addEventListener("input", () => this.validateName());
    }

    if (this.startButton) {
      this.startButton.addEventListener("click", () => {
        const playerName = this.getPlayerName();
        if (this.validateName()) {
          this.hide();
          if (this.onStartSingleplayer) {
            this.onStartSingleplayer(playerName);
          }
        }
      });
    }
  }

  /**
   * Validate user player name input string.
   * @returns {boolean} True if valid name
   */
  validateName() {
    if (!this.nameInput) return true;
    const name = this.nameInput.value.trim();

    if (name.length < 3) {
      this.showValidationError("Name must be at least 3 characters long.");
      return false;
    }
    if (name.length > 32) {
      this.showValidationError("Name must not exceed 32 characters.");
      return false;
    }

    this.hideValidationError();
    return true;
  }

  showValidationError(msg) {
    if (this.validationLabel) {
      this.validationLabel.textContent = msg;
      this.validationLabel.style.display = "block";
    }
    if (this.startButton) {
      this.startButton.disabled = true;
    }
  }

  hideValidationError() {
    if (this.validationLabel) {
      this.validationLabel.style.display = "none";
    }
    if (this.startButton) {
      this.startButton.disabled = false;
    }
  }

  getPlayerName() {
    return this.nameInput ? this.nameInput.value.trim() : "Player";
  }

  show() {
    if (this.menuElement) {
      this.menuElement.style.display = "block";
    }
  }

  hide() {
    if (this.menuElement) {
      this.menuElement.style.display = "none";
    }
  }
}