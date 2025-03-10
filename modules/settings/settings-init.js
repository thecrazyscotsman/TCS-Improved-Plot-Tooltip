import { Options, OptionType } from '/core/ui/options/model-options.js';
import { CategoryType } from '/core/ui/options/options-helpers.js';
import { TCS_ShowPotentialImprovement, TCS_ShowQuarterDescription, TCS_BuildingFlexDisplayMode, TCS_ShowPlayerRelationship, TCS_ShowCoordinates, TCS_EnableDebugMode } from 'fs://game/tcs-ui-improved-plot-tooltip/settings/settings.js';

// We add a dependency on the Options module to ensure default options are loaded before we add our own
import '/core/ui/options/options.js';

// Option: Show Potential Improvement
const onTCS_ShowPotentialImprovementSettingsInit = (optionInfo) => {
    optionInfo.currentValue = TCS_ShowPotentialImprovement.Option;
};
const onTCS_ShowPotentialImprovementSettingsUpdate = (optionInfo, value) => {
	TCS_ShowPotentialImprovement.Option = value;
};
Options.addInitCallback(() => {
    Options.addOption({ 
        category: CategoryType.System, 
        // @ts-ignore
        group: 'TCS_IMPROVED_PLOT_TOOLTIP', 
        type: OptionType.Checkbox, 
        id: "tcs-show-potential-improvement", 
        initListener: onTCS_ShowPotentialImprovementSettingsInit, 
        updateListener: onTCS_ShowPotentialImprovementSettingsUpdate, 
        label: "LOC_OPTIONS_TCS_SHOW_POTENTIAL_IMPROVEMENT_LABEL", 
        description: "LOC_OPTIONS_TCS_SHOW_POTENTIAL_IMPROVEMENT_DESCRIPTION",
        currentValue: true
    });
});

// Option: Show Player Relationship
const onTCS_ShowPlayerRelationshipSettingsInit = (optionInfo) => {
    optionInfo.currentValue = TCS_ShowPlayerRelationship.Option;
};
const onTCS_ShowPlayerRelationshipSettingsUpdate = (optionInfo, value) => {
	TCS_ShowPlayerRelationship.Option = value;
};
Options.addInitCallback(() => {
    Options.addOption({ 
        category: CategoryType.System, 
        // @ts-ignore
        group: 'TCS_IMPROVED_PLOT_TOOLTIP', 
        type: OptionType.Checkbox, 
        id: "tcs-show-player-relationship", 
        initListener: onTCS_ShowPlayerRelationshipSettingsInit, 
        updateListener: onTCS_ShowPlayerRelationshipSettingsUpdate, 
        label: "LOC_OPTIONS_TCS_SHOW_PLAYER_RELATIONSHIP_LABEL", 
        description: "LOC_OPTIONS_TCS_SHOW_PLAYER_RELATIONSHIP_DESCRIPTION",
        currentValue: true
    });
});

// Option: Show Quarter Description
const onTCS_ShowQuarterDescriptionSettingsInit = (optionInfo) => {
    optionInfo.currentValue = TCS_ShowQuarterDescription.Option;
};
const onTCS_ShowQuarterDescriptionSettingsUpdate = (optionInfo, value) => {
	TCS_ShowQuarterDescription.Option = value;
};
Options.addInitCallback(() => {
    Options.addOption({ 
        category: CategoryType.System, 
        // @ts-ignore
        group: 'TCS_IMPROVED_PLOT_TOOLTIP', 
        type: OptionType.Checkbox, 
        id: "tcs-show-quarter-description", 
        initListener: onTCS_ShowQuarterDescriptionSettingsInit, 
        updateListener: onTCS_ShowQuarterDescriptionSettingsUpdate, 
        label: "LOC_OPTIONS_TCS_SHOW_QUARTER_DESCRIPTION_LABEL", 
        description: "LOC_OPTIONS_TCS_SHOW_QUARTER_DESCRIPTION_DESCRIPTION",
        currentValue: true
    });
});

// Option: Change Building Display Mode
const onTCS_BuildingFlexDisplayModeSettingsInit = (optionInfo) => {
	optionInfo.currentValue = TCS_BuildingFlexDisplayMode.Option;
};

const onTCS_BuildingFlexDisplayModeSettingsUpdate = (optionInfo, value) => {
	TCS_BuildingFlexDisplayMode.Option = value;
};

Options.addInitCallback(() => {
    Options.addOption({ 
        category: CategoryType.System, 
        // @ts-ignore
        group: 'TCS_IMPROVED_PLOT_TOOLTIP', 
        type: OptionType.Checkbox,
        id: "tcs-building-display-mode", 
        initListener: onTCS_BuildingFlexDisplayModeSettingsInit, 
        updateListener: onTCS_BuildingFlexDisplayModeSettingsUpdate, 
        label: "LOC_OPTIONS_TCS_BUILDING_DISPLAY_MODE_LABEL", 
        description: "LOC_OPTIONS_TCS_BUILDING_DISPLAY_MODE_DESCRIPTION",
        currentValue: true
    });
});

// Option: Show Coordinates
const onTCS_ShowCoordinatesSettingsInit = (optionInfo) => {
    optionInfo.currentValue = TCS_ShowCoordinates.Option;
};
const onTCS_ShowCoordinatesSettingsUpdate = (optionInfo, value) => {
	TCS_ShowCoordinates.Option = value;
};
Options.addInitCallback(() => {
    Options.addOption({ 
        category: CategoryType.System, 
        // @ts-ignore
        group: 'TCS_IMPROVED_PLOT_TOOLTIP', 
        type: OptionType.Checkbox, 
        id: "tcs-show-coordinates", 
        initListener: onTCS_ShowCoordinatesSettingsInit, 
        updateListener: onTCS_ShowCoordinatesSettingsUpdate, 
        label: "LOC_OPTIONS_TCS_SHOW_COORDINATES_LABEL", 
        description: "LOC_OPTIONS_TCS_SHOW_COORDINATES_DESCRIPTION",
        currentValue: false
    });
});

// Option: Enable Debug Mode
const onTCS_EnableDebugModeSettingsInit = (optionInfo) => {
    optionInfo.currentValue = TCS_EnableDebugMode.Option;
};
const onTCS_EnableDebugModeSettingsUpdate = (optionInfo, value) => {
	TCS_EnableDebugMode.Option = value;
};
Options.addInitCallback(() => {
    Options.addOption({ 
        category: CategoryType.System, 
        // @ts-ignore
        group: 'TCS_IMPROVED_PLOT_TOOLTIP', 
        type: OptionType.Checkbox, 
        id: "tcs-enable-debug-mode", 
        initListener: onTCS_EnableDebugModeSettingsInit, 
        updateListener: onTCS_EnableDebugModeSettingsUpdate, 
        label: "LOC_OPTIONS_TCS_ENABLE_DEBUG_LABEL", 
        description: "LOC_OPTIONS_TCS_ENABLE_DEBUG_DESCRIPTION",
        currentValue: false 
    });
});