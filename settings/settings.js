//ModSettingsManager from Leonardfactory

/**
 * Please, always use ModSettingsManager to save and read settings in your mod.
 * Right now if you try to use **multiple** keys in localStorage, it will break reading
 * from localStorage for **every mod**. This is a workaround to avoid this issue, while
 * keeing a namespace to give each mod its own settings.
 */
const ModSettingsManager = {
    save(key, data) {
        if (localStorage.length > 1) {
            console.warn("[ModSettingsManager] erasing previous storage..", localStorage.length);
            localStorage.clear();
        }  
        const modSettings = JSON.parse(localStorage.getItem("modSettings") || '{}');
        modSettings[key] = data;
        localStorage.setItem("modSettings", JSON.stringify(modSettings));
    },
    read(key) {
        const modSettings = localStorage.getItem("modSettings");
        try {
            if (modSettings) {
                const data = JSON.parse(modSettings || '{}')[key];
                if (data) {
                    return data;
                }
            }
            return null;
        }
        catch (e) {
            console.error(`[ModSettingsManager][${key}] Error loading settings`, e);
        }
        return null;
    }
}

export const TCS_ShowPotentialImprovement = new class {
    _data = {Option: true};

    constructor() {
        const modSettings = ModSettingsManager.read("TCS_ShowPotentialImprovement");
        if (modSettings) {this._data = modSettings;}
    }

    save() {
        console.warn("[TCS_ShowPotentialImprovement] saving..", JSON.stringify(this._data));
        ModSettingsManager.save("TCS_ShowPotentialImprovement", this._data);
    }

    get Option() {return this._data.Option;}

    set Option(value) {
        this._data.Option = value;
        this.save();
    }
}

export const TCS_ShowQuarterDescription = new class {
    _data = {Option: true};

    constructor() {
        const modSettings = ModSettingsManager.read("TCS_ShowQuarterDescription");
        if (modSettings) {this._data = modSettings;}
    }

    save() {
        console.warn("[TCS_ShowQuarterDescription] saving..", JSON.stringify(this._data));
        ModSettingsManager.save("TCS_ShowQuarterDescription", this._data);
    }

    get Option() {return this._data.Option;}

    set Option(value) {
        this._data.Option = value;
        this.save();
    }
}

export const TCS_BuildingFlexDisplayMode = new class {
    _data = {Option: true}; // true: ROW or false: COLUMN

    constructor() {
        const modSettings = ModSettingsManager.read("TCS_ShowQuarterDescription");
        if (modSettings) {this._data = modSettings;}
    }

    save() {
        console.warn("[TCS_BuildingFlexDisplayMode] saving..", JSON.stringify(this._data));
        ModSettingsManager.save("TCS_BuildingFlexDisplayMode", this._data);
    }

    get Option() {return this._data.Option;}

    set Option(value) {
        this._data.Option = value;
        this.save();
    }
}

export const TCS_ShowPlayerRelationship = new class {
    _data = {Option: true};

    constructor() {
        const modSettings = ModSettingsManager.read("TCS_ShowPlayerRelationship");
        if (modSettings) {this._data = modSettings;}
    }

    save() {
        console.warn("[TCS_ShowPlayerRelationship] saving..", JSON.stringify(this._data));
        ModSettingsManager.save("TCS_ShowPlayerRelationship", this._data);
    }

    get Option() {return this._data.Option;}

    set Option(value) {
        this._data.Option = value;
        this.save();
    }
}

export const TCS_ShowCoordinates = new class {
    _data = {Option: false};

    constructor() {
        const modSettings = ModSettingsManager.read("TCS_ShowCoordinates");
        if (modSettings) {this._data = modSettings;}
    }

    save() {
        console.warn("[TCS_ShowCoordinates] saving..", JSON.stringify(this._data));
        ModSettingsManager.save("TCS_ShowCoordinates", this._data);
    }

    get Option() {return this._data.Option;}

    set Option(value) {
        this._data.Option = value;
        this.save();
    }
}

export const TCS_EnableDebugMode = new class {
    _data = {Option: false};

    constructor() {
        const modSettings = ModSettingsManager.read("TCS_EnableDebugMode");
        if (modSettings) {this._data = modSettings;}
    }

    save() {
        console.warn("[TCS_EnableDebugMode] saving..", JSON.stringify(this._data));
        ModSettingsManager.save("TCS_EnableDebugMode", this._data);
    }

    get Option() {return this._data.Option;}

    set Option(value) {
        this._data.Option = value;
        this.save();
    }
}