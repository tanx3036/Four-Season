/*:
 * @target MZ
 * @plugindesc Custom Menu Enhancements: Adds "Save" and "Exit" commands to the main menu.
 * @author YourName
 *
 * @help
 * This plugin customizes the main menu by adding "Save" and "Exit" commands.
 * 
 * - "Save": Opens the standard save scene, allowing players to choose a save slot.
 * - "Exit": Closes the game window on desktop platforms or prompts the user to close the browser tab on web platforms.
 * 
 * Ensure this plugin is placed below any plugins that modify the menu or window systems to prevent conflicts.
 */

(() => {
    // ------------------------------
    // Prevent Multiple Imports
    // ------------------------------
    var Imported = Imported || {};
    if (Imported.CustomMenu) {
        console.warn("CustomMenu.js is already imported.");
        return;
    }
    Imported.CustomMenu = true;

    // ------------------------------
    // Initialize Game Variables
    // ------------------------------
    const initializeGameData = () => {
        // Initialize or reset game variables if not already set
        $gameVariables.setValue(1, $gameVariables.value(1) || 1); // Current Date
        $gameVariables.setValue(2, $gameVariables.value(2) || 1); // Current Season
        $gameVariables.setValue(3, $gameVariables.value(3) || 0); // Wood
        $gameVariables.setValue(4, $gameVariables.value(4) || 0); // Food
        $gameVariables.setValue(5, $gameVariables.value(5) || 0); // Herb
        $gameVariables.setValue(6, $gameVariables.value(6) || 0); // Ore

        // Add an actor to the party if there are no members
        if ($gameParty.members().length === 0) {
            $gameParty.addActor(1); // Add actor with ID 1
        }
    };

    // ------------------------------
    // Ensure 'gameEnd' is Included in Menu Commands
    // ------------------------------
    const ensureGameEndInMenuCommands = () => {
        const commands = ["item", "skill", "equip", "status", "formation", "save", "gameEnd"];
        $dataSystem.menuCommands = commands;
        console.log("Updated menuCommands to include 'gameEnd':", $dataSystem.menuCommands);
    };

    // Override Scene_Boot to initialize game data and ensure 'gameEnd' is included
    const _Scene_Boot_start = Scene_Boot.prototype.start;
    Scene_Boot.prototype.start = function () {
        _Scene_Boot_start.call(this);
        initializeGameData();
        ensureGameEndInMenuCommands(); // Ensure 'gameEnd' is included
    };

    // ------------------------------
    // Utility Functions
    // ------------------------------
    // Define season names
    const getSeasonName = (seasonId) => {
        switch (seasonId) {
            case 1: return "Spring";
            case 2: return "Summer";
            case 3: return "Autumn";
            case 4: return "Winter";
            default: return "Unknown";
        }
    };

    // ------------------------------
    // Override Window_MenuCommand
    // ------------------------------
    Window_MenuCommand.prototype.makeCommandList = function () {
        // Add default commands (e.g., "Item", "Skill", etc.)
        Window_Command.prototype.makeCommandList.call(this);

        // Add custom commands
        this.addSaveCommand();
        this.addGameEndCommand();
    };

    Window_MenuCommand.prototype.addSaveCommand = function () {
        if (this.needsCommand("save")) { // Check if "save" is enabled in $dataSystem.menuCommands
            const enabled = this.isSaveEnabled();
            this.addCommand(TextManager.save, "save", enabled);
            console.log("Added 'Save' command. Enabled:", enabled);
        }
    };

    Window_MenuCommand.prototype.addGameEndCommand = function () {
        if (this.needsCommand("gameEnd")) { // Check if "gameEnd" is enabled in $dataSystem.menuCommands
            const enabled = this.isGameEndEnabled();
            this.addCommand(TextManager.gameEnd, "gameEnd", enabled);
            console.log("Added 'Exit' command. Enabled:", enabled);
        }
    };

    Window_MenuCommand.prototype.windowWidth = function () {
        return 220; // Adjust width as needed
    };

    Window_MenuCommand.prototype.windowHeight = function () {
        // Manually calculate height based on number of commands
        const lineHeight = 36; // Default line height in MZ
        const padding = 18;    // Default padding in MZ
        const numCommands = this.maxItems(); // Number of commands: "Save" and "Exit"
        return lineHeight * numCommands + padding * 2;
    };

    Window_MenuCommand.prototype.maxCols = function () {
        return 1; // Display commands vertically
    };

    Window_MenuCommand.prototype.itemTextAlign = function () {
        return "center"; // Center-align text
    };

    // ------------------------------
    // Override Window_MenuStatus
    // ------------------------------
    Window_MenuStatus.prototype.initialize = function (rect) {
        Window_Selectable.prototype.initialize.call(this, rect);
        this.refresh();
    };

    Window_MenuStatus.prototype.refresh = function () {
        this.contents.clear();
        this.contents.fontSize = 20;
        this.drawText("Menu", 0, 0, this.contentsWidth(), "center"); // Custom title
    };

    Window_MenuStatus.prototype.windowWidth = function () {
        return 220; // Match the width of the command window
    };

    Window_MenuStatus.prototype.windowHeight = function () {
        return Graphics.boxHeight - this.fittingHeight(this.maxItems()); // Fill remaining height below command window
    };

    // ------------------------------
    // Define Window_ResourceStatus
    // ------------------------------
    class Window_ResourceStatus extends Window_Base {
        constructor(rect) {
            super(rect);
            this.refresh();
        }

        refresh() {
            this.contents.clear();
            this.contents.fontSize = 20; // Professional look

            // Get variables
            const date = $gameVariables.value(1) || 1;
            const season = $gameVariables.value(2) || 1;
            const wood = $gameVariables.value(3) || 0;
            const food = $gameVariables.value(4) || 0;
            const herb = $gameVariables.value(5) || 0;
            const ore = $gameVariables.value(6) || 0;

            // Display Date and Season
            this.changeTextColor(ColorManager.systemColor());
            this.drawText("Date:", 0, 0, this.contentsWidth(), "left");
            this.resetTextColor();
            this.drawText(date, 80, 0, this.contentsWidth(), "left");

            this.changeTextColor(ColorManager.systemColor());
            this.drawText("Season:", 0, 30, this.contentsWidth(), "left");
            this.resetTextColor();
            this.drawText(getSeasonName(season), 80, 30, this.contentsWidth(), "left");

            // Display Resources
            const yOffset = 70;
            this.changeTextColor(ColorManager.systemColor());
            this.drawText("Resources:", 0, yOffset, this.contentsWidth(), "left");
            this.resetTextColor();
            const spacing = 25;
            this.drawText(`Wood: ${wood}`, 0, yOffset + spacing, this.contentsWidth(), "left");
            this.drawText(`Food: ${food}`, 0, yOffset + spacing * 2, this.contentsWidth(), "left");
            this.drawText(`Herb: ${herb}`, 0, yOffset + spacing * 3, this.contentsWidth(), "left");
            this.drawText(`Ore: ${ore}`, 0, yOffset + spacing * 4, this.contentsWidth(), "left");
        }
    }

    // ------------------------------
    // Adjust Scene_Menu
    // ------------------------------
    Scene_Menu.prototype.create = function () {
        // Correctly call the parent class's create method
        Scene_MenuBase.prototype.create.call(this);

        // Create and add windows
        this.createCommandWindow();
        this.createStatusWindow();
        this.createResourceWindow();
    };

    Scene_Menu.prototype.createCommandWindow = function () {
        // Define the rectangle for the command window
        const rect = new Rectangle(0, 0, this.commandWindowWidth(), this.commandWindowHeight());

        // Instantiate Window_MenuCommand with the rectangle
        this._commandWindow = new Window_MenuCommand(rect);
        console.log("Command Window created:", this._commandWindow);

        // Set up command handlers
        this._commandWindow.setHandler("save", this.commandSave.bind(this));
        this._commandWindow.setHandler("gameEnd", this.commandGameEnd.bind(this));
        this._commandWindow.setHandler("cancel", this.popScene.bind(this));

        this.addWindow(this._commandWindow);
    };

    Scene_Menu.prototype.commandWindowWidth = function () {
        return 220; // Adjust width as needed
    };

    Scene_Menu.prototype.commandWindowHeight = function () {
        // Manually calculate height based on number of commands
        const lineHeight = 36; // Default line height in MZ
        const padding = 18;    // Default padding in MZ
        const numCommands = 2; // "Save" and "Exit"
        return lineHeight * numCommands + padding * 2;
    };

    Scene_Menu.prototype.createStatusWindow = function () {
        const wx = 0;
        const wy = this._commandWindow.height;
        const ww = 220;
        const wh = Graphics.boxHeight - wy;
        const rect = new Rectangle(wx, wy, ww, wh);
        console.log(`Creating Status Window with dimensions: ${wx}, ${wy}, ${ww}, ${wh}`);
        this._statusWindow = new Window_MenuStatus(rect);
        console.log("Status Window created:", this._statusWindow);

        this.addWindow(this._statusWindow);
    };

    Scene_Menu.prototype.createResourceWindow = function () {
        const wx = this._commandWindow.width;
        const wy = 0;
        const ww = Graphics.boxWidth - this._commandWindow.width;
        const wh = Graphics.boxHeight;
        const rect = new Rectangle(wx, wy, ww, wh);
        console.log(`Creating Resource Window with dimensions: ${wx}, ${wy}, ${ww}, ${wh}`);
        this._resourceWindow = new Window_ResourceStatus(rect);
        console.log("Resource Window created:", this._resourceWindow);

        this.addWindow(this._resourceWindow);
    };

    // ------------------------------
    // Define Command Handlers
    // ------------------------------
    Scene_Menu.prototype.commandSave = function () {
        console.log("commandSave triggered");
        SceneManager.push(Scene_Save); // Push the standard save scene
    };

    Scene_Menu.prototype.commandGameEnd = function () {
        console.log("commandGameEnd triggered");

        if (Utils.isNwjs()) { // Checks if running in NW.js (desktop)
            console.log("Exiting game on desktop.");
            SceneManager.exit();
        } else {
            console.log("Running in browser. Cannot close tab programmatically.");
            // For browsers, inform the user to close the tab manually
            $gameMessage.add("Please close the browser tab to exit the game.");
            AudioManager.playBuzzer(); // Optional: play an error sound
        }
    };

    // ------------------------------
    // End of CustomMenu.js
    // ------------------------------
})();
