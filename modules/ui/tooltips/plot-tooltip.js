/**
 * Plot Tooltips
 * @copyright 2022, Firaxis Gmaes
 * @description The tooltips that appear based on the cursor hovering over world plots.
 */

/**
	TCS Improved Plot Tooltip
	-------------------------
	author: thecrazyscotsman
	
	My apologies if my lack of JavaScript or CSS knowledge horrifies you.

 */

	console.warn("TCS IMPROVED PLOT TOOLTIP - LOADED");

	import TooltipManager, { PlotTooltipPriority } from '/core/ui/tooltips/tooltip-manager.js';
	import { ComponentID } from '/core/ui/utilities/utilities-component-id.js';
	import DistrictHealthManager from '/base-standard/ui/district/district-health-manager.js';
	import LensManager from '/core/ui/lenses/lens-manager.js';
	import { TradeRoute } from '/core/ui/utilities/utilities-data.js';
	import CityDetails, { UpdateCityDetailsEventName } from "/base-standard/ui/city-details/model-city-details.js";
	import { InterfaceMode } from '/core/ui/interface-modes/interface-modes.js';
	class PlotTooltipType {
		constructor() {
			this.plotCoord = null;
			this.isShowingDebug = false;
			this.plotOwnerID = null;
			this.plotOwnerPlayer = null;
			this.tooltip = document.createElement('fxs-tooltip');
			this.container = document.createElement('div');
			this.yieldsFlexbox = document.createElement('div');
			this.tooltip.classList.add('plot-tooltip', 'max-w-96');
			this.tooltip.appendChild(this.container);
			Loading.runWhenFinished(() => {
				for (const y of GameInfo.Yields) {
					const url = UI.getIcon(`${y.YieldType}`, "YIELD");
					Controls.preloadImage(url, 'plot-tooltip');
				}
				for (const c of GameInfo.Constructibles) {
					const url = UI.getIcon(`${c.ConstructibleType}`, "CONSTRUCTIBLE");
					Controls.preloadImage(url, 'plot-tooltip');
				}
			});
		}
		getHTML() {
			return this.tooltip;
		}
		isUpdateNeeded(plotCoord) {
			// Check if the plot location has changed, if not return early, otherwise cache it and rebuild.
			if (this.plotCoord != null) {
				if (plotCoord.x == this.plotCoord.x && plotCoord.y == this.plotCoord.y) {
					return false;
				}
			}
			this.plotCoord = plotCoord; // May be cleaner to recompute in update but at cost of computing 2nd time.
			return true;
		}
		reset() {
			this.container.innerHTML = '';
			this.yieldsFlexbox.innerHTML = '';
		}
		update() {
			if (this.plotCoord == null) {
				console.error("Tooltip was unable to read plot values due to a coordinate error.");
				return;
			}
			this.isShowingDebug = UI.isDebugPlotInfoVisible(); // Ensure debug status hasn't changed
			
			const plotCoord = this.plotCoord;
			// Get a bunch of info to reduce calls
			/* plot object attributes:
				coordinate
				x
				y
				PlotIndex
				OwningPlayerID
				OwningPlayer
				OwningPlayerDiplomacy
				OwningPlayerDistricts
				LocalPlayerID
				LocalPlayer
				LocalPlayerDiplomacy
				Constructibles
				DistrictID
				District
				City
				Units
			*/
			const plot = this.getPlotInfo(plotCoord);
			
			//---------------------
			// Construct Tooltip
			//---------------------
							
			// PRIORITY OVERRIDE: Settler Lens
			this.addSettlerOverride(plot);
	
			// SECTION: Biome & Terrain
			this.addBiomeTerrain(plot);
			
			// SECTION: Feature
			this.addFeatureRiver(plot);
					
			// SECTION: Yields
			this.yieldsFlexbox.classList.add("plot-tooltip__resourcesFlex");
			this.container.appendChild(this.yieldsFlexbox);
			this.addPlotYields(plot);
			this.addResource(plot);
			
			// SECTION: Constructibles
			this.addConstructibles(plot);
			
			// SECTION: City & Owner
			this.addCityOwnerInfo(plot);
			
			// SECTION: Units
			this.addUnitInfo(plot);
		   
			// SECTION: More Info
			// Continent & Route
			// Plot Effects
			this.addMoreInfo(plot);
			
			UI.setPlotLocation(this.plotCoord.x, this.plotCoord.y, plot.PlotIndex);
			// Adjust cursor between normal and red based on the plot owner's hostility
			if (!UI.isCursorLocked()) {
				const localPlayerID = plot.LocalPlayerID;
				const topUnit = this.getTopUnit(plot);
				let showHostileCursor = false;
				let owningPlayerID = plot.OwningPlayerID;
				// if there's a unit on the plot, that player overrides the tile's owner
				if (topUnit) {
					owningPlayerID = topUnit.owner;
				}
				const revealedState = GameplayMap.getRevealedState(localPlayerID, plotCoord.x, plotCoord.y);
				if (Players.isValid(localPlayerID) && Players.isValid(owningPlayerID) && (revealedState == RevealedStates.VISIBLE)) {
					const owningPlayer = plot.OwningPlayer;
					// Is it an independent?
					if (owningPlayer?.isIndependent) {
						let independentID = PlayerIds.NO_PLAYER;
						if (topUnit) {
							// We got the player from the unit, so use the unit
							independentID = Game.IndependentPowers.getIndependentPlayerIDFromUnit(topUnit.id);
						}
						else {
							// Get the independent from the plot, can reutrn -1
							independentID = Game.IndependentPowers.getIndependentPlayerIDAt(this.plotCoord.x, this.plotCoord.y);
						}
						if (independentID != PlayerIds.NO_PLAYER) {
							const relationship = Game.IndependentPowers.getIndependentRelationship(independentID, localPlayerID);
							if (relationship == IndependentRelationship.HOSTILE) {
								showHostileCursor = true;
							}
						}
					}
					else {
						var hasHiddenUnit = false;
						if (topUnit?.hasHiddenVisibility) {
							hasHiddenUnit = true;
						}
						const localPlayer = plot.LocalPlayer;
						if (localPlayer) {
							const localPlayerDiplomacy = plot.LocalPlayerDiplomacy;
							if (localPlayerDiplomacy) {
								if (localPlayerDiplomacy.isAtWarWith(owningPlayerID) && !hasHiddenUnit) {
									showHostileCursor = true;
								}
							}
						}
					}
				}
				if (InterfaceMode.getCurrent() && InterfaceMode.getCurrent() === 'INTERFACEMODE_ACQUIRE_TILE') {
					// When in Acquire Tile mode, let that mode control the cursor..
				}
				else {
					if (showHostileCursor) {
						UI.setCursorByURL("fs://game/core/ui/cursors/enemy.ani");
					}
					else {
						UI.setCursorByType(UIHTMLCursorTypes.Default);
					}
				}
			}
			
			//debug info
			this.addDebugInfo(plot);
		}
		
		
		
	
		//---------------------
		// Section Builders
		//---------------------
		addSettlerOverride(plotObject) {
			if (LensManager.getActiveLens() == "fxs-settler-lens") {
				//Add more details to the tooltip if we are in the settler lens
				const localPlayer = plotObject.LocalPlayer;
				if (!localPlayer) {
					console.error("plot-tooltip: Attempting to update settler tooltip, but no valid local player!");
					return;
				}
				const localPlayerDiplomacy = plotObject.LocalPlayerDiplomacy;
				if (localPlayerDiplomacy === undefined) {
					console.error("plot-tooltip: Attempting to update settler tooltip, but no valid local player Diplomacy object!");
					return;
				}
				else if (!GameplayMap.isWater(this.plotCoord.x, this.plotCoord.y) && !GameplayMap.isImpassable(this.plotCoord.x, this.plotCoord.y) && !GameplayMap.isNavigableRiver(this.plotCoord.x, this.plotCoord.y)) {
					//Dont't add any extra tooltip to mountains, oceans, or navigable rivers, should be obvious enough w/o them
					const settlerTooltip = document.createElement("div");
					settlerTooltip.classList.add("plot-tooltip__settler-tooltip");
					const localPlayerAdvancedStart = localPlayer?.AdvancedStart;
					if (localPlayerAdvancedStart === undefined) {
						console.error("plot-tooltip: Attempting to update settler tooltip, but no valid local player advanced start object!");
						return;
					}
					//Show why we can't settle here
					if (!GameplayMap.isPlotInAdvancedStartRegion(plotObject.LocalPlayerID, this.plotCoord.x, this.plotCoord.y) && !localPlayerAdvancedStart?.getPlacementComplete()) {
						settlerTooltip.classList.add("blocked-location");
						settlerTooltip.innerHTML = Locale.compose("LOC_PLOT_TOOLTIP_CANT_SETTLE_TOO_FAR");
					}
					else if (!localPlayerDiplomacy.isValidLandClaimLocation(this.plotCoord, true /*bIgnoreFriendlyUnitRequirement*/)) {
						settlerTooltip.classList.add("blocked-location");
						if (GameplayMap.isCityWithinMinimumDistance(this.plotCoord.x, this.plotCoord.y)) {
							settlerTooltip.innerHTML = Locale.compose("LOC_PLOT_TOOLTIP_CANT_SETTLE_TOO_CLOSE");
						}
						else if (GameplayMap.getResourceType(this.plotCoord.x, this.plotCoord.y) != ResourceTypes.NO_RESOURCE) {
							settlerTooltip.innerHTML = Locale.compose("LOC_PLOT_TOOLTIP_CANT_SETTLE_RESOURCES");
						}
					}
					else if (!GameplayMap.isFreshWater(this.plotCoord.x, this.plotCoord.y)) {
						settlerTooltip.classList.add("okay-location");
						settlerTooltip.innerHTML = Locale.compose("LOC_PLOT_TOOLTIP_NO_FRESH_WATER");
					}
					this.container.appendChild(settlerTooltip);
					const toolTipHorizontalRule = document.createElement("div");
					toolTipHorizontalRule.classList.add("plot-tooltip__horizontalRule");
					this.container.appendChild(toolTipHorizontalRule);
				}
			}
		}
		addBiomeTerrain(plotObject) {
			const terrainLabel = this.getTerrainLabel(plotObject);
			const biomeLabel = this.getBiomeLabel(plotObject);
			
			const tooltipFirstLine = document.createElement("div");
			tooltipFirstLine.classList.add('text-secondary', 'text-center', 'uppercase', 'font-title');
			if (biomeLabel) {
				// TODO - Add hard-coded string to localization XML.
				const label = Locale.compose("{1_TerrainName} {2_BiomeName}", terrainLabel, biomeLabel);
				tooltipFirstLine.setAttribute('data-l10n-id', label);
			}
			else {
				tooltipFirstLine.setAttribute('data-l10n-id', terrainLabel);
			}
			this.container.appendChild(tooltipFirstLine);
		}
		addFeatureRiver(plotObject) {
			const featureInfo = this.getFeatureInfo(plotObject); //this is an object, unlike the others
			const riverLabel = this.getRiverLabel(plotObject);
			
			// Feature & River
			if (featureInfo.featureLabel || riverLabel) {
				if (featureInfo.plotIsNaturalWonder) {
					// title line
					this.addTitleLine(featureInfo.featureLabel);
					
					// tooltip line
					this.addHorizontalRule();
					const toolTipNaturalWonderDetails = document.createElement('div');
					toolTipNaturalWonderDetails.classList.add("plot-tooltip__owner-civ-text", "justify-center");
					toolTipNaturalWonderDetails.setAttribute('data-l10n-id', featureInfo.featureTooltip);
					this.container.appendChild(toolTipNaturalWonderDetails);
				}
				else {
					const tooltipSecondLine = document.createElement("div");
					tooltipSecondLine.classList.add('text-2xs', 'text-center');
					if (featureInfo.featureLabel && riverLabel) {
						tooltipSecondLine.setAttribute('data-l10n-id', Locale.compose("LOC_PLOT_MOD_TCS_FEATURE_RIVER", featureInfo.featureLabel, riverLabel));
					}
					else if (featureInfo.featureLabel) {
						tooltipSecondLine.setAttribute('data-l10n-id', featureInfo.featureLabel);
					}
					else {
						tooltipSecondLine.setAttribute('data-l10n-id', riverLabel);
					}
					this.container.appendChild(tooltipSecondLine);
				}
			}    
		}
		addPlotYields(plotObject) {
			const fragment = document.createDocumentFragment();
			let maxValueLength = 0;
			let totalYields = 0;
			GameInfo.Yields.forEach(yield_define => {
				const yield_amount = GameplayMap.getYield(plotObject.x, plotObject.y, yield_define.YieldType, plotObject.LocalPlayerID);
				if (yield_amount > 0) {
					const tooltipIndividualYieldFlex = document.createElement("div");
					tooltipIndividualYieldFlex.classList.add("plot-tooltip__IndividualYieldFlex");
					tooltipIndividualYieldFlex.ariaLabel = `${Locale.toNumber(yield_amount)} ${Locale.compose(yield_define.Name)}`;
					fragment.appendChild(tooltipIndividualYieldFlex);
					const yieldIconCSS = UI.getIconCSS(yield_define.YieldType, "YIELD");
					const yieldIconShadow = document.createElement("div");
					yieldIconShadow.classList.add("plot-tooltip__IndividualYieldIcons-Shadow");
					yieldIconShadow.style.backgroundImage = yieldIconCSS;
					tooltipIndividualYieldFlex.appendChild(yieldIconShadow);
					const yieldIcon = document.createElement("div");
					yieldIcon.classList.add("plot-tooltip__IndividualYieldIcons");
					yieldIcon.style.backgroundImage = yieldIconCSS;
					yieldIconShadow.appendChild(yieldIcon);
					const toolTipIndividualYieldValues = document.createElement("div");
					toolTipIndividualYieldValues.classList.add("plot-tooltip__IndividualYieldValues");
					const value = yield_amount.toString();
					maxValueLength = Math.max(maxValueLength, value.length);
					toolTipIndividualYieldValues.textContent = value;
					tooltipIndividualYieldFlex.appendChild(toolTipIndividualYieldValues);
					totalYields = totalYields + yield_amount;
				}
			});
			this.yieldsFlexbox.appendChild(fragment);
			// Give all the yields extra room if one of them has extra digits, to keep the spacing even.
			this.yieldsFlexbox.classList.remove('resourcesFlex--double-digits', 'resourcesFlex--triple-digits');
			if (maxValueLength > 2) {
				this.yieldsFlexbox.classList.add(maxValueLength > 3 ? 'resourcesFlex--triple-digits' : 'resourcesFlex--double-digits');
			}
			if (totalYields > 0) {
				const plotTooltipTotalYields = document.createElement("div");
				plotTooltipTotalYields.classList.add('text-2xs', 'text-center');
				plotTooltipTotalYields.innerHTML = Locale.compose("LOC_PLOT_MOD_TCS_TOTAL_YIELDS") + " " + totalYields;
				this.container.appendChild(plotTooltipTotalYields);
			}
		}
		addResource(plotObject) {
			const hexResource = plotObject.Resource;	
			if (hexResource) {
				
				// Resource name
				this.addTitleLine(Locale.compose(hexResource.Name));
				
				// Resource icon and tooltip	
				const toolTipResourceContainer = document.createElement('div');
				toolTipResourceContainer.classList.add('plot-tooltip__resource-container');
				
				const toolTipResourceLargeIcon = document.createElement("div");
				toolTipResourceLargeIcon.classList.add("plot-tooltip__large-resource-icon");
				const toolTipResourceIconCSS = UI.getIconCSS(hexResource.ResourceType);
				toolTipResourceLargeIcon.style.backgroundImage = toolTipResourceIconCSS;
				toolTipResourceContainer.appendChild(toolTipResourceLargeIcon);
				
				const toolTipResourceDetails = document.createElement('div');
				toolTipResourceDetails.classList.add('plot-tooltip__resource-details');
				toolTipResourceDetails?.style.setProperty('flex-direction', 'row'); //text needs to flow more smoothly across
				toolTipResourceDetails?.style.setProperty('max-width', '14rem');
				
				const toolTipResourceDescription = document.createElement("div");
				toolTipResourceDescription.classList.add("plot-tooltip__resource-label_description");
				toolTipResourceDescription.setAttribute('data-l10n-id', hexResource.Tooltip);
				
				toolTipResourceDetails.appendChild(toolTipResourceDescription);
				toolTipResourceContainer.appendChild(toolTipResourceDetails);
				
				this.container.appendChild(toolTipResourceContainer);
			}
		}
		addConstructibles(plotObject) {
			
			/*
			district (rural/urban/quarter/wonder)
			specialists
			constructibles (improvements/buildings)
			fortifications
			*/
			
			const iCurrentAge = Game.age;
	
			// Get constructibles
			const buildings = [];
			const walls = [];
			const wonders = [];
			const improvements = [];
			const constructibles = plotObject.Constructibles;
			
			// Get district info
			const districtId = plotObject.DistrictID;
			const district = plotObject.District;
			let districtName = (district) ? Locale.compose(GameInfo.Districts.lookup(district.type).Name) : undefined;
			
			// Get player info
			const playerID = plotObject.OwningPlayerID;
			const player = plotObject.OwningPlayer;
			
			// Get city & specialist Info
			const city = plotObject.City;
			let numWorkers = undefined;
			let numWorkerSlots = undefined;
			if (city && !city.isTown) {
				if (district && (district.type == DistrictTypes.URBAN || district.type == DistrictTypes.CITY_CENTER)) {
					numWorkerSlots = city.Workers.getCityWorkerCap();
					const cityPlots = city.Workers.GetAllPlacementInfo();
					if (cityPlots) {
						for (const plot of cityPlots) {
							if (plot.PlotIndex == plotObject.PlotIndex) {
								numWorkers = plot.NumWorkers;
								break;						
							}
						}
					}
				}	
			}
			
			// Collect and sort constructibles
			constructibles.forEach((item) => {
				const instance = Constructibles.getByComponentID(item);
				if (!instance) {
					return;
				}
				const location = instance.location;
				if (location.x != plotObject.x || location.y != plotObject.y) {
					return;
				}
				const info = GameInfo.Constructibles.lookup(instance.type);
				if (!info) {
					console.warn("Building constructible without a definition: " + instance.type.toString());
					return;
				}
				if (info.ConstructibleClass == "BUILDING") {
					const constructibleType = info.ConstructibleType;
					const building = {
						Info: info,
						Name: Locale.compose(info.Name), //LOC_PLOT_MOD_TCS_CONSTRUCTIBLE_NAME -> name + tag
						Ageless: GameInfo.TypeTags.find(e => e.Tag == "AGELESS" && e.Type == info.ConstructibleType), //LOC_PLOT_MOD_TCS_AGELESS
						UniqueTrait: GameInfo.Buildings.find(e => e.ConstructibleType == info.ConstructibleType && e.TraitType !== null), //LOC_PLOT_MOD_TCS_UNIQUE
						ConstructibleAge: Database.makeHash(info?.Age ?? ""), //LOC_PLOT_MOD_TCS_OBSOLETE
						Damaged: instance.damaged, //LOC_PLOT_TOOLTIP_DAMAGED
						Completed: (instance.complete), //LOC_PLOT_TOOLTIP_IN_PROGRESS
						Defensive: (info.DistrictDefense > 0),
						FullTile: GameInfo.TypeTags.find(e => e.Tag == "FULL_TILE" && e.Type == info.ConstructibleType)
					}
					
					// Filter to walls out of building list
					if (info.DistrictDefense > 0 && info.ExistingDistrictOnly > 0) {
						walls.push(building);
					}
					else {
						buildings.push(building);
					}
				}
				else if (info.ConstructibleClass == "WONDER") {
					const wonder = {
						Info: info,
						Name: Locale.compose(info.Name), //LOC_PLOT_MOD_TCS_CONSTRUCTIBLE_NAME -> name + tag
						Tooltip : Locale.compose(info.Tooltip),
						ConstructibleAge: Database.makeHash(info?.Age ?? ""), //LOC_PLOT_MOD_TCS_OBSOLETE
						Damaged: instance.damaged, //LOC_PLOT_TOOLTIP_DAMAGED
						Completed: (instance.complete), //LOC_PLOT_TOOLTIP_IN_PROGRESS
						Defensive: (info.DistrictDefense > 0)
					}
					wonders.push(wonder);
				}
				else if (info.ConstructibleClass == "IMPROVEMENT") {
					const improvement = {
						Info: info,
						Name: Locale.compose(info.Name), //LOC_PLOT_MOD_TCS_CONSTRUCTIBLE_NAME -> name + tag
						//Ageless: GameInfo.TypeTags.find(e => e.Tag == "AGELESS" && e.Type == info.ConstructibleType), //LOC_PLOT_MOD_TCS_AGELESS
						UniqueTrait: GameInfo.Improvements.find(e => e.ConstructibleType == info.ConstructibleType && e.TraitType !== null), //LOC_PLOT_MOD_TCS_UNIQUE
						//ConstructibleAge: Database.makeHash(info?.Age ?? ""), //LOC_PLOT_MOD_TCS_OBSOLETE
						Damaged: instance.damaged, //LOC_PLOT_TOOLTIP_DAMAGED
						Completed: (instance.complete) //LOC_PLOT_TOOLTIP_IN_PROGRESS
					}
					improvements.push(improvement);
				}
				else {
					const pass = true;
				}
			});	
			
			// Check for Quarters
			// Criteria for an Urban district to be a Quarter:
			// 	- Have both unique Buildings from the same Civilization --> a Unique quarter
			//  - Have 2 Buildings from the current age --> a Standard quarter
			//  - Have 1 full-tile Building from the current age --> a Standard quarter
			const quarters = [];
			if (district && district.type == DistrictTypes.URBAN && buildings.length > 0) {
				const uniques = [];
				const ages = [];
				buildings.forEach((item) => {
					if (item.UniqueTrait && item.Completed) {
						uniques.push(item.UniqueTrait.TraitType);
					}
					if ((item.ConstructibleAge || item.Ageless) && item.Completed) {
						if (item.Ageless) {
							ages.push(iCurrentAge);
						}
						else {
							ages.push(item.ConstructibleAge);
						}
					}
				});
				if (uniques.length > 1) {
					const uniquesSet = new Set(uniques);
					if (uniquesSet.size == 1) {
						const uniqueQuarter = GameInfo.UniqueQuarters.find(e => e.TraitType == uniques[0]);
						const civType = GameInfo.LegacyCivilizationTraits.find(e => e.TraitType == uniques[0]);
						const civLegacy = GameInfo.LegacyCivilizations.find(e => e.CivilizationType == civType.CivilizationType);
						const civAdjective = Locale.compose(civLegacy.Adjective);
						const quarterTooltip = "LOC_" + uniqueQuarter.UniqueQuarterType + "_TOOLTIP";
						const quarter = {
							QuarterName: uniqueQuarter.Name,
							QuarterDescription: uniqueQuarter.Description,
							QuarterTooltip: (Locale.keyExists(quarterTooltip) ? quarterTooltip : uniqueQuarter.Description),
							Civilization: civLegacy,
							CivilizationAdjective: civLegacy.Adjective
						}
						quarters.push(quarter);
					}
				}
				else if (ages.length > 1) {
					const agesSet = new Set(ages);
					if (agesSet.size == 1 && ages[0] == iCurrentAge) {
						const quarter = {
							QuarterName: "LOC_PLOT_MOD_TCS_QUARTER",
							QuarterDescription: undefined,
							Civilization: undefined,
							CivilizationAdjective: undefined
						}
						quarters.push(quarter);
					}
				}
				else if (buildings.length == 1 && buildings[0].FullTile && buildings[0].Completed) {
					const quarter = {
						QuarterName: "LOC_PLOT_MOD_TCS_QUARTER",
						QuarterDescription: undefined,
						Civilization: undefined,
						CivilizationAdjective: undefined
					}
					quarters.push(quarter);
				}
				else {
					const pass = true;
				}
			}
			
			// Build District Title Tooltip
			// If Wonder, title is Wonder name
			// If unique Quarter, title is unique Quarter name
			// If standard Quarter, title is "Quarter"
			// If Urban, title is "Urban"
			// If Rural, title is "Rural"
			// If empty, title is "Wilderness"
			if (player || (improvements.length > 0) || (plotObject.PotentialImprovements.length > 0)) {
				if (district && district.type == DistrictTypes.WONDER) {
					districtName = wonders[0].Name;
					this.addTitleLine(districtName);
				}
				else if (quarters.length > 0) {
					districtName = Locale.compose(quarters[0].QuarterName);
					this.addTitleLine(districtName);
					if (quarters[0].QuarterDescription) {
						// Add description
						this.addHorizontalRule();
						const toolTipQuarterDetails = document.createElement('div');
						//toolTipWonderDetails.classList.add("plot-tooltip__resource-label_description");
						toolTipQuarterDetails.classList.add("plot-tooltip__owner-civ-text", "justify-center");
						toolTipQuarterDetails?.style.setProperty('padding-bottom', '0.25rem');
						toolTipQuarterDetails.setAttribute('data-l10n-id', Locale.compose("LOC_PLOT_MOD_TCS_UNIQUE_QUARTER", quarters[0].CivilizationAdjective) + " " + Locale.compose(quarters[0].QuarterTooltip));
						this.container.appendChild(toolTipQuarterDetails);
					}
				}
				else if (district && (district.type == DistrictTypes.URBAN || district.type == DistrictTypes.CITY_CENTER)) {
					this.addTitleLine(districtName);
				}
				else if (!player || plotObject.PotentialImprovements.length > 0) {
					this.addTitleLine(Locale.compose("LOC_PLOT_MOD_TCS_WILDERNESS"));
				}
				else {
					districtName = undefined;
				}
			}
			
			// Potential improvements
			const potentialImprovements = plotObject.PotentialImprovements;
			if (improvements.length == 0 && buildings.length == 0 && wonders.length == 0 && plotObject.PotentialImprovements.length > 0) {
				potentialImprovements.sort((a,b) => (a.Name > b.Name) ? 1 : ((b.Name > a.Name) ? -1 : 0));
				
				const plotTooltipImprovementContainer = document.createElement("div");
				plotTooltipImprovementContainer.classList.add('plot-tooltip__resource-container');
				plotTooltipImprovementContainer?.style.setProperty('justify-content', 'center');
				plotTooltipImprovementContainer?.style.setProperty('align-content', 'flex-start');
				//plotTooltipImprovementContainer?.style.setProperty('flex-wrap', 'wrap');
				plotTooltipImprovementContainer?.style.setProperty('padding', '0.5rem');
				
				potentialImprovements.forEach((item) => {
								
					// Sub Container
					const plotTooltipSubContainer = document.createElement("div");
					plotTooltipSubContainer.classList.add('plot-tooltip__resource-container');
					plotTooltipSubContainer?.style.setProperty('justify-content', 'center');
					plotTooltipSubContainer?.style.setProperty('position', 'row');
					plotTooltipSubContainer?.style.setProperty('width', '75%');
					plotTooltipSubContainer?.style.setProperty('align-content', 'center');
					
					// Icon
					const toolTipImprovementIcon = document.createElement("div");
					toolTipImprovementIcon.classList.add("plot-tooltip__large-resource-icon");
					let toolTipImprovementIconCSS = (item.ConstructibleType != "IMPROVEMENT_VILLAGE" && item.ConstructibleType != "IMPROVEMENT_ENCAMPMENT") ? UI.getIconCSS(item.ConstructibleType, "CONSTRUCTIBLE") : UI.getIconCSS("IMPROVEMENT_HILLFORT", "CONSTRUCTIBLE"); //fallback...blp:impicon_village (used for Village and Encampment improvements) doesn't seem to load anything. 
					toolTipImprovementIconCSS = (toolTipImprovementIconCSS) ? toolTipImprovementIconCSS : UI.getIconCSS("IMPROVEMENT_EXPEDITION_BASE", "CONSTRUCTIBLE");//fallback for discoverables without icons
					toolTipImprovementIcon?.style.setProperty('width', '2.25rem');
					toolTipImprovementIcon?.style.setProperty('height', '2.25rem');
					//toolTipImprovementIcon?.style.setProperty('background-size', '100%');
					toolTipImprovementIcon?.style.setProperty('margin-right', '0.333333337rem');
					toolTipImprovementIcon?.style.setProperty('opacity', '0.45');
					toolTipImprovementIcon.style.backgroundImage = toolTipImprovementIconCSS;
					plotTooltipSubContainer.appendChild(toolTipImprovementIcon);
					
					// Improvement String
					const plotTooltipImprovementElement = document.createElement("div");
					plotTooltipImprovementElement.classList.add('text-left');
					plotTooltipImprovementElement?.style.setProperty('margin-left', '0.15rem');
					plotTooltipImprovementElement?.style.setProperty('margin-right', '0.15rem');
					//plotTooltipImprovementElement?.style.setProperty('flex-wrap', 'wrap');
					plotTooltipImprovementElement.innerHTML = Locale.stylize("LOC_PLOT_MOD_TCS_POTENTIAL_IMPROVEMENT", item.Name);
					plotTooltipSubContainer.appendChild(plotTooltipImprovementElement);
					
					plotTooltipImprovementContainer.appendChild(plotTooltipSubContainer);
				});
				this.container.appendChild(plotTooltipImprovementContainer);
			}
			
			// Improvements
			if (improvements.length > 0) {
				improvements.sort((a,b) => (a.Name > b.Name) ? 1 : ((b.Name > a.Name) ? -1 : 0));
				
				const plotTooltipImprovementContainer = document.createElement("div");
				plotTooltipImprovementContainer.classList.add('plot-tooltip__resource-container');
				plotTooltipImprovementContainer?.style.setProperty('justify-content', 'center');
				plotTooltipImprovementContainer?.style.setProperty('align-content', 'flex-start');
				//plotTooltipImprovementContainer?.style.setProperty('flex-wrap', 'wrap');
				plotTooltipImprovementContainer?.style.setProperty('padding', '0.5rem');
				
				improvements.forEach((item) => {
					
					// Parse item tag (Wilderness, Rural, Unique)
					let itemTag = (!item.Info.Discovery) ? Locale.compose("LOC_PLOT_MOD_TCS_RURAL") : Locale.compose("LOC_PLOT_MOD_TCS_WILDERNESS");
					if (item.UniqueTrait) {
						itemTag = itemTag + " " + Locale.compose("LOC_PLOT_DIVIDER_DOT") + " " + Locale.compose("LOC_PLOT_MOD_TCS_UNIQUE");
					}
					
					// Parse item status (Damaged, In Progress)
					let itemStatus;
					if (item.Damaged) {
						itemStatus = Locale.compose("LOC_PLOT_TOOLTIP_DAMAGED");
					}
					else if (!item.Completed) {
						itemStatus = Locale.compose("LOC_PLOT_TOOLTIP_IN_PROGRESS");
					}
					else {
						itemStatus = undefined;
					}
					
					// Concatenate tag and status
					let propertyString;
					if (itemTag || itemStatus) {
						if (!itemTag) {
							propertyString = "[N][STYLE:text-2xs]" + itemStatus + "[/STYLE]";
						}
						else if (!itemStatus) {
							propertyString = "[N][STYLE:text-2xs]" + itemTag + "[/STYLE]";
						}
						else {
							propertyString = "[N][STYLE:text-2xs]" + itemTag + " " + Locale.compose("LOC_PLOT_DIVIDER_DOT") + " " + itemStatus + "[/STYLE]";
						}
					}
					
					// Check if the name needs to be split into 2 lines
					const itemName = "[STYLE:text-xs]" + item.Name + "[/STYLE]";
					
					// Concatenate name, tag, and status
					const improvementString = (!propertyString) ? itemName : itemName + propertyString;
					
					// Sub Container
					const plotTooltipSubContainer = document.createElement("div");
					plotTooltipSubContainer.classList.add('plot-tooltip__resource-container');
					plotTooltipSubContainer?.style.setProperty('justify-content', 'center');
					plotTooltipSubContainer?.style.setProperty('position', 'row');
					plotTooltipSubContainer?.style.setProperty('width', '75%');
					plotTooltipSubContainer?.style.setProperty('align-content', 'center');
					
					// Icon
					const toolTipImprovementIcon = document.createElement("div");
					toolTipImprovementIcon.classList.add("plot-tooltip__large-resource-icon");
					let toolTipImprovementIconCSS = (item.Info.ConstructibleType != "IMPROVEMENT_VILLAGE" && item.Info.ConstructibleType != "IMPROVEMENT_ENCAMPMENT") ? UI.getIconCSS(item.Info.ConstructibleType, "CONSTRUCTIBLE") : UI.getIconCSS("IMPROVEMENT_HILLFORT", "CONSTRUCTIBLE"); //fallback...blp:impicon_village (used for Village and Encampment improvements) doesn't seem to load anything. 
					toolTipImprovementIconCSS = (toolTipImprovementIconCSS) ? toolTipImprovementIconCSS : UI.getIconCSS("IMPROVEMENT_EXPEDITION_BASE", "CONSTRUCTIBLE");//fallback for discoverables without icons
					toolTipImprovementIcon?.style.setProperty('width', '2.25rem');
					toolTipImprovementIcon?.style.setProperty('height', '2.25rem');
					//toolTipImprovementIcon?.style.setProperty('background-size', '100%');
					toolTipImprovementIcon?.style.setProperty('margin-right', '0.333333337rem');
					toolTipImprovementIcon.style.backgroundImage = toolTipImprovementIconCSS;
					plotTooltipSubContainer.appendChild(toolTipImprovementIcon);
					
					// Improvement String
					const plotTooltipImprovementElement = document.createElement("div");
					plotTooltipImprovementElement.classList.add('text-left');
					plotTooltipImprovementElement?.style.setProperty('margin-left', '0.15rem');
					plotTooltipImprovementElement?.style.setProperty('margin-right', '0.15rem');
					//plotTooltipImprovementElement?.style.setProperty('flex-wrap', 'wrap');
					plotTooltipImprovementElement.innerHTML = Locale.stylize(improvementString);
					plotTooltipSubContainer.appendChild(plotTooltipImprovementElement);
					
					plotTooltipImprovementContainer.appendChild(plotTooltipSubContainer);
				});
				this.container.appendChild(plotTooltipImprovementContainer);
			}
			
			// Buildings
			if (buildings.length > 0) {
				buildings.sort((a,b) => (a.Name > b.Name) ? 1 : ((b.Name > a.Name) ? -1 : 0));
				
				const plotTooltipBuildingsContainer = document.createElement("div");
				plotTooltipBuildingsContainer.classList.add('plot-tooltip__resource-container');
				plotTooltipBuildingsContainer?.style.setProperty('justify-content', 'center');
				plotTooltipBuildingsContainer?.style.setProperty('align-content', 'flex-start');
				plotTooltipBuildingsContainer?.style.setProperty('padding', '0.5rem');
				if (buildings.length == 1) {
					plotTooltipBuildingsContainer?.style.removeProperty('width');
					plotTooltipBuildingsContainer?.style.setProperty('max-width', '100%');	
				}
				
				buildings.forEach((item) => {
					
					// Parse item tag (Unique, Ageless, Obsolete)
					const itemTags = [];
					if (item.UniqueTrait) {itemTags.push(Locale.compose("LOC_PLOT_MOD_TCS_UNIQUE"));}
					else if (item.Ageless) {itemTags.push(Locale.compose("LOC_PLOT_MOD_TCS_AGELESS"));}
					else if (item.ConstructibleAge != iCurrentAge) {itemTags.push(Locale.compose("LOC_PLOT_MOD_TCS_OBSOLETE"));}
					else if (item.ConstructibleAge == iCurrentAge) {
						if (iCurrentAge == Game.getHash("AGE_ANTIQUITY")) {itemTags.push(Locale.compose("LOC_AGE_ANTIQUITY_NAME"));}
						else if (iCurrentAge == Game.getHash("AGE_EXPLORATION")) {itemTags.push(Locale.compose("LOC_AGE_EXPLORATION_NAME"));}
						else if (iCurrentAge == Game.getHash("AGE_MODERN")) {itemTags.push(Locale.compose("LOC_AGE_MODERN_NAME"));}
					}
					
					// Parse item status (Damaged, In Progress, Full-Tile)
					if (item.Damaged) {itemTags.push(Locale.compose("LOC_PLOT_TOOLTIP_DAMAGED"));}
					if (!item.Completed) {itemTags.push(Locale.compose("LOC_PLOT_TOOLTIP_IN_PROGRESS"));}
					if (item.FullTile) {itemTags.push(Locale.compose("LOC_PLOT_MOD_TCS_FULL_TILE"));}
					
					// Sub Container
					/* Structure:
						I C	BuildingName
						O N - Tag 1
							- Tag 2
					*/
					const plotTooltipSubContainer = document.createElement("div");
					plotTooltipSubContainer.classList.add('plot-tooltip__resource-container');
					plotTooltipSubContainer?.style.setProperty('justify-content', 'center');
					if (buildings.length > 1) {
						plotTooltipSubContainer?.style.setProperty('max-width', '50%');
					}
					plotTooltipSubContainer?.style.setProperty('align-content', 'flex-start');
					plotTooltipSubContainer?.style.setProperty('padding-left', '0.5rem');
					
					
					// Icon
					const toolTipBuildingIcon = this.addConstructibleImage(item);
					plotTooltipSubContainer.appendChild(toolTipBuildingIcon);
					
					// Building String
					const plotTooltipBuildingElement = document.createElement("div");
					plotTooltipBuildingElement?.style.setProperty('margin-left', '0.15rem');
					plotTooltipBuildingElement?.style.setProperty('margin-right', '0.15rem');
					plotTooltipBuildingElement?.style.setProperty('flex-direction', 'column');
					plotTooltipBuildingElement?.style.setProperty('align-content', 'flex-start');
					
					const plotTooltipBuildingString = document.createElement("div");
					plotTooltipBuildingString.classList.add('text-xs', 'text-left', 'font-title');
					plotTooltipBuildingString?.style.setProperty('max-width', '5rem');
					//plotTooltipBuildingString?.style.setProperty('font-weight', '600');
					plotTooltipBuildingString.setAttribute('data-l10n-id', item.Name);
					plotTooltipBuildingElement.appendChild(plotTooltipBuildingString);
					
					if (itemTags.length > 0) {
						const plotTooltipPropertyString = this.addConstructibleTag(itemTags.join(" • "));
						if (buildings.length > 1) {plotTooltipPropertyString?.style.setProperty('max-width', '5rem');}
						plotTooltipBuildingElement.appendChild(plotTooltipPropertyString);	
					}
					plotTooltipSubContainer.appendChild(plotTooltipBuildingElement);
					plotTooltipBuildingsContainer.appendChild(plotTooltipSubContainer);
				});
				this.container.appendChild(plotTooltipBuildingsContainer);
			}
			
			// Wonders
			if (wonders.length > 0) {
				wonders.sort((a,b) => (a.Name > b.Name) ? 1 : ((b.Name > a.Name) ? -1 : 0));		
				wonders.forEach((item) => {         
					let itemStatus;
					if (item.Damaged) {
						itemStatus = "(" + Locale.compose("LOC_PLOT_TOOLTIP_DAMAGED") + ")";
					}
					else if (!item.Completed) {
						itemStatus = "(" + Locale.compose("LOC_PLOT_TOOLTIP_IN_PROGRESS") + ")";
					}
					else {
						const pass = true;
					}
					// Add status
					if (itemStatus) {
						const tooltipBuildingStatus = document.createElement("div");
						tooltipBuildingStatus.classList.add("plot-tooltip__building-status");
						tooltipBuildingStatus.innerHTML = itemStatus;
						this.container.appendChild(tooltipBuildingStatus);
					}			
					
					// Add icon and description	
					const toolTipWonderContainer = document.createElement('div');
					toolTipWonderContainer.classList.add('plot-tooltip__resource-container');
					
					const toolTipWonderLargeIcon = document.createElement("div");
					toolTipWonderLargeIcon.classList.add("plot-tooltip__large-resource-icon");
					const toolTipWonderIconCSS = UI.getIconCSS(item.Info.ConstructibleType, "CONSTRUCTIBLE");
					toolTipWonderLargeIcon.style.backgroundImage = toolTipWonderIconCSS;
					toolTipWonderContainer.appendChild(toolTipWonderLargeIcon);
					
					const toolTipWonderDetails = document.createElement('div');
					toolTipWonderDetails.classList.add('plot-tooltip__resource-details');
					toolTipWonderDetails?.style.setProperty('flex-direction', 'row'); //text needs to flow more smoothly across
					toolTipWonderDetails?.style.setProperty('max-width', '14rem');
					
					const toolTipWonderDescription = document.createElement("div");
					toolTipWonderDescription.classList.add("plot-tooltip__resource-label_description");
					toolTipWonderDescription.setAttribute('data-l10n-id', item.Tooltip);
					
					toolTipWonderDetails.appendChild(toolTipWonderDescription);
					toolTipWonderContainer.appendChild(toolTipWonderDetails);
					
					this.container.appendChild(toolTipWonderContainer);
				});
			}
			
			// Specialists
			if (numWorkers != undefined && numWorkerSlots && playerID == plotObject.LocalPlayerID) {
				const tooltipSpecialistLineFlex = document.createElement("div");
				tooltipSpecialistLineFlex.classList.add("plot-tooltip__horizontalRule");
				const tooltipSpecialistString = document.createElement("div");
				tooltipSpecialistString.classList.add('text-2xs', 'text-center');
				tooltipSpecialistString.innerHTML = Locale.stylize("LOC_PLOT_MOD_TCS_SPECIALIST_COUNT", numWorkers, numWorkerSlots);
				tooltipSpecialistLineFlex.appendChild(tooltipSpecialistString);
				this.container.appendChild(tooltipSpecialistLineFlex);
			}
			
			// Fortifications Container
			if (player) {
				if (district && district.type != DistrictTypes.RURAL) {
					const playerDistricts = plotObject.OwningPlayerDistricts;
					if (playerDistricts) {
						const currentHealth = playerDistricts.getDistrictHealth(plotObject.coordinate);
						const maxHealth = playerDistricts.getDistrictMaxHealth(plotObject.coordinate);
						const isFortified = (maxHealth > 0 && currentHealth == maxHealth) ? true : false;
						const isDamaged = (maxHealth > 0 && currentHealth < maxHealth) ? true : false;
						const isUnderSiege = playerDistricts.getDistrictIsBesieged(plotObject.coordinate);
						const isHealing = (!isUnderSiege && isDamaged) ? true : false;
						
						//Wall info
						let wallName;
						if (walls.length > 0) {
							for (const wall of walls) {
								if (wall.Info.ConstructibleType == "BUILDING_DEFENSIVE_FORTIFICATIONS" ) {
									wallName = wall.Name;
									break;
								}
								else if (wall.Info.ConstructibleType == "BUILDING_MEDIEVAL_WALLS" ) {
									wallName = wall.Name;
									break;
								}
								else if (wall.Info.ConstructibleType == "BUILDING_ANCIENT_WALLS" ) {
									wallName = wall.Name;
									break;
								}
								else {
									wallName = wall.Name;
								}
							}
						}
						// Check for other defensive buildings or wonders
						// Concatenate string with names
						let defensiveNames; 
						for (const item of buildings) {
							if (item.Defensive) {
								defensiveNames = (!defensiveNames) ? item.Name : defensiveNames + " " + Locale.compose("LOC_PLOT_DIVIDER_DOT") + " " + item.Name;
							}
						}
						for (const item of wonders) {
							if (item.Defensive) {
								defensiveNames = (!defensiveNames) ? item.Name : defensiveNames + " " + Locale.compose("LOC_PLOT_DIVIDER_DOT") + " " + item.Name;
							}
						}
						// Concatenate wall name with other defensive structures
						let allFortificationNames;
						if (wallName && defensiveNames) {
							allFortificationNames = wallName + " " + Locale.compose("LOC_PLOT_DIVIDER_DOT") + " " + defensiveNames;
						}
						else if (wallName) {
							allFortificationNames = wallName;
						}
						else {
							allFortificationNames = defensiveNames;
						}					
						
						// Build Fortification tooltip
						if (isFortified && !isDamaged) {
							this.addHorizontalRule();
							//const districtContainer = document.createElement("div");
							//districtContainer.classList.add("plot-tooltip__district-container");
							//districtContainer?.style.setProperty("background-color", "transparent");
							//this.addGradiantBackground("linear-gradient(to left, #507552, rgba(80, 117, 82, 0))", "linear-gradient(to right, #507552, rgba(80, 117, 82, 0))", districtContainer);
							const districtTitle = document.createElement("div");
							districtTitle.classList.add("text-2xs", "text-center");
							districtTitle.innerHTML = (!allFortificationNames) ? Locale.stylize("LOC_PLOT_MOD_TCS_FORTIFIED", currentHealth, maxHealth) : Locale.stylize("LOC_PLOT_MOD_TCS_FORTIFIED_WALL", currentHealth, maxHealth, allFortificationNames);
							/*const districtHealth = document.createElement("div");
							districtHealth.classList.add("plot-tooltip__district-health");
							const healthCaption = document.createElement("div");
							healthCaption.classList.add("plot-tooltip__lineThree");
							healthCaption?.style.removeProperty("color"); //remove text color change
							healthCaption?.style.setProperty("font-size", "calc(1rem + -0.3333333333rem)");
							healthCaption.innerHTML = (!allFortificationNames) ? Locale.compose("LOC_PLOT_MOD_TCS_DISTRICT_HEALTH", currentHealth, maxHealth) : allFortificationNames + " " + Locale.compose("LOC_PLOT_DIVIDER_DOT") + " " + Locale.compose("LOC_PLOT_MOD_TCS_DISTRICT_HEALTH", currentHealth, maxHealth);
							districtHealth.appendChild(healthCaption);
							districtContainer.appendChild(districtTitle);
							districtContainer.appendChild(districtHealth);*/
							this.container.appendChild(districtTitle);
						}
						if (isUnderSiege || isHealing) {
							this.addHorizontalRule();
							const districtContainer = document.createElement("div");
							districtContainer.classList.add("plot-tooltip__district-container");
							//districtContainer?.style.removeProperty("background-color");
							//this.addGradiantBackground("linear-gradient(to left, #3a0806, rgba(58, 8, 6, 0))", "linear-gradient(to right, #3a0806, rgba(58, 8, 6, 0))", districtContainer);
							const districtTitle = document.createElement("div");
							districtTitle.classList.add("plot-tooltip__district-title", "plot-tooltip__lineThree");
							districtTitle.innerHTML = isUnderSiege ? Locale.compose("LOC_PLOT_TOOLTIP_UNDER_SIEGE") : Locale.compose("LOC_PLOT_TOOLTIP_HEALING_DISTRICT");
							const districtHealth = document.createElement("div");
							districtHealth.classList.add("plot-tooltip__district-health");
							const healthCaption = document.createElement("div");
							healthCaption.classList.add("plot-tooltip__health-caption", "plot-tooltip__lineThree");
							healthCaption.innerHTML = (!allFortificationNames) ? Locale.compose("LOC_PLOT_MOD_TCS_DISTRICT_HEALTH", currentHealth, maxHealth) : allFortificationNames + " " + Locale.compose("LOC_PLOT_DIVIDER_DOT") + " " + Locale.compose("LOC_PLOT_MOD_TCS_DISTRICT_HEALTH", currentHealth, maxHealth);
							districtHealth.appendChild(healthCaption);
							districtContainer.appendChild(districtTitle);
							districtContainer.appendChild(districtHealth);
							this.container.appendChild(districtContainer);
						}	
					}
				}
			}
		}
		addUnitInfo(plotObject) {
			const localPlayerID = plotObject.LocalPlayerID;
			if (GameplayMap.getRevealedState(localPlayerID, plotObject.x, plotObject.y) != RevealedStates.VISIBLE) {
				return;
			}
			let topUnit = this.getTopUnit(plotObject);
			if (topUnit) {
				if (!Visibility.isVisible(localPlayerID, topUnit?.id)) {
					return;
				}
			}
			else {
				return;
			}
			let player = Players.get(topUnit.owner);
			if (!player) {
				return;
			}      
			
			// Build Element: Unit Header
			this.addTitleLine(Locale.compose("LOC_PLOT_MOD_TCS_UNITS"));
			
			// Build Elements: Unit
			let plotUnits = plotObject.Units;
			this.addHorizontalRule()
			const unitContainer = document.createElement("div");
			for (let i = 0; i < plotUnits.length && i < 4; i++) {
				let plotUnit = Units.get(plotUnits[i]);
				let unitName = Locale.compose(plotUnit.name);
				player = Players.get(plotUnit.owner);
				const toolTipUnitInfo = document.createElement("div");
				if (player.id != localPlayerID && i == 0) {
					const playerDiplomacy = player?.Diplomacy;
					if (playerDiplomacy.isAtWarWith(localPlayerID)) {
						unitContainer.classList.add("plot-tooltip__district-container");
					}
				}
				toolTipUnitInfo.classList.add('text-center',"plot-tooltip__unitInfo");
				if (player.id == localPlayerID) {
					toolTipUnitInfo.innerHTML = Locale.compose("LOC_PLOT_MOD_TCS_TOP_UNIT", unitName, Locale.compose("LOC_PLOT_MOD_TCS_YOURS"));
				}
				else {
					toolTipUnitInfo.innerHTML = Locale.compose("LOC_PLOT_MOD_TCS_TOP_UNIT", unitName, Locale.compose(player.name));
				}
				unitContainer.appendChild(toolTipUnitInfo);
				
			}
			if (plotUnits.length > 3) {
				const toolTipUnitInfo = document.createElement("div");
				toolTipUnitInfo.classList.add('text-center',"plot-tooltip__unitInfo");
				toolTipUnitInfo.innerHTML = Locale.compose("LOC_PLOT_MOD_TCS_ADDITIONAL_UNITS", (plotUnits.length - 3));
				unitContainer.appendChild(toolTipUnitInfo);
			}
			this.container.appendChild(unitContainer);
		}
		addMoreInfo(plotObject) {
			
			let continentName = this.getContinentName(plotObject.coordinate);
			const routeName = this.getRouteName(plotObject);
			const plotEffectNames = this.getPlotEffectNames(plotObject);
			const localPlayer = plotObject.LocalPlayer;
			const player = plotObject.Player;
			const city = plotObject.City;
			let isDistantLands = false;
			
			if (localPlayer != null) {
				if (localPlayer.isDistantLands(plotObject.coordinate)) {
					isDistantLands = true;
				}
			}
			
			if (continentName && isDistantLands) {
				continentName = continentName + " " + Locale.compose("LOC_PLOT_MOD_TCS_DISTANT_LANDS");
			}
			
			// Title line
			if (continentName || routeName || plotEffectNames) {
				this.addTitleLine(Locale.compose("LOC_PLOT_MOD_TCS_MORE_INFO"));
			}
			
			// Continent & Route
			if (continentName) {
				// Add Fresh Water info
				let lastLineLabel;
				if (GameplayMap.isFreshWater(plotObject.x, plotObject.y)) {
					lastLineLabel = (routeName) ? (continentName + " " + Locale.compose("LOC_PLOT_DIVIDER_DOT") + " " + routeName + " " + Locale.compose("LOC_PLOT_DIVIDER_DOT") + " " + Locale.compose("LOC_PLOT_MOD_TCS_FRESH_WATER")) : (continentName + " " + Locale.compose("LOC_PLOT_DIVIDER_DOT") + " " + Locale.compose("LOC_PLOT_MOD_TCS_FRESH_WATER"));
				}
				else {
					lastLineLabel = (routeName) ? (continentName + " " + Locale.compose("LOC_PLOT_DIVIDER_DOT") + " " + routeName) : continentName;
				}
				const tooltipLastLine = document.createElement("div");
				tooltipLastLine.classList.add('text-2xs', 'text-center');
				tooltipLastLine.setAttribute('data-l10n-id', lastLineLabel);
				this.container.appendChild(tooltipLastLine);
			}
	
			// Plot Effects
			if (plotEffectNames) {
				this.addHorizontalRule();
				const toolTipPlotEffectsText = document.createElement("div");
				toolTipPlotEffectsText.classList.add('text-2xs', 'text-center');
				toolTipPlotEffectsText.setAttribute('data-l10n-id', plotEffectNames);
				this.container.appendChild(toolTipPlotEffectsText);
			}
			
			// Original Owner
			if (city && city.owner != city.originalOwner && plotObject.District && plotObject.District.type == DistrictTypes.CITY_CENTER) {
				const originalOwnerPlayer = Players.get(city.originalOwner);
				const toolTipOriginalOwner = document.createElement("div");
				toolTipOriginalOwner.classList.add('text-2xs', 'text-center');
				toolTipOriginalOwner.innerHTML = Locale.compose("LOC_PLOT_MOD_TCS_ORIGINAL_FOUNDER", originalOwnerPlayer.name);
				this.container.appendChild(toolTipOriginalOwner);
			}
		}  
		addCityOwnerInfo(plotObject) {
			const owningPlayerID = plotObject.OwningPlayerID;
			const owningPlayer = plotObject.OwningPlayer;
			
			// Cancel if player is not alive
			if (!owningPlayer || !Players.isAlive(owningPlayerID)) {
				return;
			}
			const filteredConstructibles = plotObject.Constructibles;
			const constructibles = MapConstructibles.getConstructibles(plotObject.x, plotObject.y);        
			if (filteredConstructibles.length == 0 && filteredConstructibles.length != constructibles.length) {
				return;
			}
			
			const owningPlayerDiplomacy = plotObject.OwningPlayerDiplomacy;
			
			// Get local player
			const localPlayerID = plotObject.LocalPlayerID;
			const localPlayer = plotObject.LocalPlayer;
			const localPlayerDiplomacy = plotObject.LocalPlayerDiplomacy;  
			
			// Get ownership labels (playerLabel, civLabel, cityLabel)
			const playerLabel = (owningPlayer) ? Locale.stylize(owningPlayer.name) + ((owningPlayerID == localPlayerID) ? (" (" + Locale.compose("LOC_PLOT_TOOLTIP_YOU") + ")") : "") : undefined;
			const civLabel = Locale.compose(GameplayMap.getOwnerName(plotObject.x, plotObject.y));
			let cityLabel;
			let cityHappiness;
			let townFocus;
			let townFoodYield; //not using this for anything, but it's the net food sent from a Specialized Town to each connected City
			const tradeRoutes = [];
			const connectedSettlementNames = [];
			const citiesReceivingFood = [];
			const city = plotObject.City;
			if (city) {			
				cityLabel = Locale.compose("LOC_PLOT_MOD_TCS_CITY", Locale.compose(city.name));
				if (city.isTown) {
					cityLabel = Locale.stylize("LOC_PLOT_MOD_TCS_TOWN", Locale.compose(city.name));
				}
				else {
					cityLabel = Locale.stylize("LOC_PLOT_MOD_TCS_CITY", Locale.compose(city.name));
				}
				
				// Get connections
				const connectedSettlements = city.getConnectedCities();
				if (connectedSettlements.length > 0) {
					if (city.isTown) {
						townFoodYield = city.Yields?.getNetYield(YieldTypes.YIELD_FOOD);
						if (townFoodYield) {
							for (const townConnectedSettlementID of connectedSettlements) {
								const townConnectedSettlement = Cities.get(townConnectedSettlementID);
								if (townConnectedSettlement && !townConnectedSettlement.isTown) {
									citiesReceivingFood.push(townConnectedSettlement);
								}
							}	
						}
					}
					if (citiesReceivingFood.length > 0) {
						townFoodYield = Math.round(townFoodYield / citiesReceivingFood.length);
					}
					// Build connection names list	
					for (const connectedsettlementID of connectedSettlements) {
						const connectedSettlement = Cities.get(connectedsettlementID);
						if (connectedSettlement) {
							if (connectedSettlement.isTown) {
								if (!city.isTown && connectedSettlement.Growth?.growthType != GrowthTypes.EXPAND) {
									connectedSettlementNames.push(Locale.compose("LOC_PLOT_MOD_TCS_TOWN", connectedSettlement.name) + Locale.compose("LOC_PLOT_MOD_TCS_FOOD_ICON_RECEIVING"));
								}
								else {
									connectedSettlementNames.push(Locale.compose("LOC_PLOT_MOD_TCS_TOWN", connectedSettlement.name));
								}
							}
							else {
								if (city.isTown && city.Growth?.growthType != GrowthTypes.EXPAND) {
									connectedSettlementNames.push(Locale.compose("LOC_PLOT_MOD_TCS_CITY", connectedSettlement.name) + Locale.compose("LOC_PLOT_MOD_TCS_FOOD_ICON_SENDING"));
								}
								else {
									connectedSettlementNames.push(Locale.compose("LOC_PLOT_MOD_TCS_CITY", connectedSettlement.name));
								}
							}
						}
					}
					connectedSettlementNames.sort();						
				}
				
				// Get Town Focus
				if (city.isTown) {
					if (city.Growth?.growthType == GrowthTypes.EXPAND) {
						townFocus = "GROWING";
					}
					else {
						townFocus = "SPECIALIZED";		
					}
					
					//There are apparantly only 2 GrowthTypes: GrowthTypes.EXPAND and GrowthTypes.PROJECT.
					//EXPAND indicates a growing town, PROJECT indicates a specialized town. Each specialization has an entry in the Projects table.
					
					//TO DO: investigate further to see if we can figure out what Project a town has.
					//Potential info in production-chooser-helpers.js
				}
				
				// Get Trade Route counts
				if (owningPlayer && owningPlayerID && owningPlayerID != localPlayerID) {
					const localPlayerTrade = localPlayer?.Trade;
					const current = localPlayerTrade?.countPlayerTradeRoutesTo(city.owner) ?? 0;
					const capacity = localPlayerTrade?.getTradeCapacityFromPlayer(city.owner) ?? 0;
					if (capacity > 0) {
						tradeRoutes.push(current);
						tradeRoutes.push(capacity);
					}
				}
				
				/*
					Additional information which can be gained from the city object:
						Population::
							city.population
						Turns until growth::
							city.Growth.turnsUntilGrowth
						Local Happiness::
							city.Yields?.getYield(YieldTypes.YIELD_HAPPINESS)
				*/
				
				// Get Happiness
				/*const happiness = city.Yields?.getYield(YieldTypes.YIELD_HAPPINESS);
				if (happiness) {
					cityHappiness = Locale.compose("LOC_PLOT_MOD_TCS_HAPPY");
					if (happiness < 0) {
						cityHappiness = Locale.compose("LOC_PLOT_MOD_TCS_UNHAPPY");
					}
					else if (happiness < -10) {
						cityHappiness = Locale.compose("LOC_PLOT_MOD_TCS_ANGRY");
					}
					if (city.isInfected) {
						cityHappiness = Locale.compose("LOC_PLOT_MOD_TCS_PLAGUE");
					}
				}*/
				
				// Get Trade Routes
				/*const routes = city.Trade.routes;
				if (routes.length > 0) {
					for (let route of routes) {
						// Resources from this route? Include partner city and list resource yields
						const myRoutePayload = TradeRoute.getCityPayload(route, city.id);
						if (myRoutePayload && myRoutePayload.resourceValues.length > 0) {
							// Partner city name
							let partnerCity = TradeRoute.getOppositeCity(route, city.id);
							if (partnerCity) {
								tradeRoutes = (tradeRoutes) ? (tradeRoutes + " " + Locale.compose("LOC_PLOT_DIVIDER_DOT") + " " + Locale.compose(partnerCity.name)) : Locale.compose(partnerCity.name);
							}
						}
					}
				}*/
			}
			
			// Get relationship label (relationshipLabel)
			let relationshipLabel;
			if (owningPlayer && owningPlayerID && owningPlayerID != localPlayerID) {
				// If Plot Owner is an Independent and the local player is its suzerain, display relationship
				if (owningPlayer.isMinor && owningPlayer.Influence?.hasSuzerain && owningPlayer.Influence.getSuzerain() == localPlayerID) {
					relationshipLabel = Locale.compose("LOC_PLOT_MOD_TCS_RELATIONSHIP_VASSAL")
				}
				else {
					// Get diplomacy
					
					// TO DO: see if I can get active Open Borders deals.
					if (owningPlayerDiplomacy.isAtWarWith(localPlayerID)) {
						relationshipLabel = Locale.compose("LOC_PLOT_MOD_TCS_RELATIONSHIP_WAR");
					}
					else if (owningPlayerDiplomacy.hasAllied(localPlayerID)) {
						relationshipLabel = Locale.compose("LOC_PLOT_MOD_TCS_RELATIONSHIP_ALLIANCE", Locale.compose(owningPlayerDiplomacy.getRelationshipLevelName(localPlayerID)));
					}
					else {
						relationshipLabel = Locale.compose("LOC_PLOT_MOD_TCS_RELATIONSHIP_OTHER", Locale.compose(owningPlayerDiplomacy.getRelationshipLevelName(localPlayerID)));
					}
				}
			}
			
			// Get district info
			const districtId = plotObject.DistrictID;
			const district = plotObject.District;
			const plotIsCityCenter = (district && district.type == DistrictTypes.CITY_CENTER);
			
			//================
			// Build Container
			//================
			
			// Leader & Civ & Relationship, City & Status
			if (playerLabel) {
				// City
				if (cityLabel) {
					this.addTitleLine(cityLabel);
				}
				else {
					this.addTitleLine(civLabel);
				}
				
				// Player & Civ
				if (civLabel) {
					this.addHorizontalRule();
					const plotTooltipOwnerLeader = document.createElement("div");
					plotTooltipOwnerLeader.classList.add("plot-tooltip__owner-leader-text");
					plotTooltipOwnerLeader.innerHTML = (relationshipLabel) ? (playerLabel + " " + relationshipLabel) : playerLabel;
					this.container.appendChild(plotTooltipOwnerLeader);
					
					if (!owningPlayer.isIndependent) {
						this.addHorizontalRule();
						const plotTooltipOwnerCiv = document.createElement("div");
						plotTooltipOwnerCiv.classList.add("plot-tooltip__owner-civ-text");
						plotTooltipOwnerCiv.innerHTML = civLabel;
						this.container.appendChild(plotTooltipOwnerCiv);
					}
				}
				
				// Additional info for local player
				if (localPlayerID == owningPlayerID) {
					// Town Focus				
					if (townFocus) {
						this.addHorizontalRule();
						const plotTooltipTownFocus = document.createElement("div");
						plotTooltipTownFocus.classList.add('text-2xs', 'text-center');
						const townFocusString = (townFocus == "GROWING") ? Locale.compose("LOC_PLOT_MOD_TCS_TOWN_GROWING") : Locale.compose("LOC_PLOT_MOD_TCS_TOWN_SPECIALIZED");
						let tooltipTownFocusString = townFocusString;
						if (plotIsCityCenter && townFocus != "GROWING") {
							tooltipTownFocusString = (citiesReceivingFood.length == 1) ? (townFocusString + " " + Locale.compose("LOC_PLOT_DIVIDER_DOT") + " " + Locale.compose("LOC_PLOT_MOD_TCS_TOWN_FEEDING_SINGULAR")) : (townFocusString + " " + Locale.compose("LOC_PLOT_DIVIDER_DOT") + " " + Locale.compose("LOC_PLOT_MOD_TCS_TOWN_FEEDING_PLURAL", citiesReceivingFood.length));
						}
						else {
							tooltipTownFocusString = townFocusString;
						}
						plotTooltipTownFocus.innerHTML = Locale.stylize(tooltipTownFocusString);
						this.container.appendChild(plotTooltipTownFocus);
					}
					
					// Flag if city is not in trade network
					if (city && !city.Trade.isInTradeNetwork()) {
						this.addHorizontalRule()
						const toolTipNotInTradeNetwork = document.createElement("div");
						toolTipNotInTradeNetwork.classList.add("plot-tooltip__district-container");
						toolTipNotInTradeNetwork?.style.setProperty('justify-content','center');
						toolTipNotInTradeNetwork.innerHTML = Locale.compose("LOC_PLOT_MOD_TCS_NOT_IN_TRADE_NETWORK");
						this.container.appendChild(toolTipNotInTradeNetwork);
					}
					
					// Connections - shown when hovering over city center
					if (connectedSettlementNames.length > 0 && plotIsCityCenter) {
						const plotTooltipConnectionsHeader = document.createElement("div");
						plotTooltipConnectionsHeader.classList.add('text-2xs', 'text-center');
						plotTooltipConnectionsHeader?.style.setProperty('font-weight', 'bold');
						plotTooltipConnectionsHeader.innerHTML = Locale.compose("LOC_PLOT_MOD_TCS_CONNECTED");
						this.container.appendChild(plotTooltipConnectionsHeader);
						
						const plotTooltipConnectionsContainer = document.createElement("div");
						plotTooltipConnectionsContainer.classList.add('plot-tooltip__resource-container');
						plotTooltipConnectionsContainer?.style.setProperty('justify-content', 'center');
						plotTooltipConnectionsContainer?.style.setProperty('align-content', 'center');
						plotTooltipConnectionsContainer?.style.setProperty('flex-wrap', 'wrap');
						plotTooltipConnectionsContainer?.style.setProperty('width', '100%');
						plotTooltipConnectionsContainer?.style.setProperty('padding-right', '0.25rem');
						plotTooltipConnectionsContainer?.style.setProperty('padding-left', '0.25rem');
						plotTooltipConnectionsContainer?.style.setProperty('padding-bottom', '0.25rem');
						
						for (const settlementName of connectedSettlementNames) {
							const plotTooltipConnectionsElement = document.createElement("div");
							plotTooltipConnectionsElement.classList.add('text-2xs', 'text-left');
							plotTooltipConnectionsElement?.style.setProperty('margin-right', '0.5rem');
							plotTooltipConnectionsElement?.style.setProperty('max-height', '1.5rem');
							plotTooltipConnectionsElement.innerHTML = Locale.stylize(settlementName);
							plotTooltipConnectionsContainer.appendChild(plotTooltipConnectionsElement);
						}
						
						this.container.appendChild(plotTooltipConnectionsContainer);
						
						//plotTooltipConnectionsContainer?.style.setProperty('', '');
					}
				}
				// Additional info if player is not local player
				else {
					if (tradeRoutes.length == 2 && plotIsCityCenter && !owningPlayerDiplomacy.isAtWarWith(localPlayerID)) {
						const plotTooltipTradeRoutes = document.createElement("div");
						plotTooltipTradeRoutes.classList.add('text-2xs', 'text-center');
						plotTooltipTradeRoutes.innerHTML = Locale.compose("LOC_PLOT_MOD_TCS_TRADE_ROUTES", tradeRoutes[0], tradeRoutes[1]);
						this.container.appendChild(plotTooltipTradeRoutes);	
					}
				}
			}
			
			//Hmm...do i need this?
			const plotTooltipConqueror = this.getConquerorInfo(districtId);
			if (plotTooltipConqueror) {
				this.container.appendChild(plotTooltipConqueror);
			}
		}
		addDebugInfo(plotObject) {
			if (this.isShowingDebug) {
				const tooltipDebugFlexbox = document.createElement("div");
				tooltipDebugFlexbox.classList.add("plot-tooltip__debug-flexbox");
				this.container.appendChild(tooltipDebugFlexbox);
				this.addHorizontalRule();
				const playerID = plotObject.OwningPlayerID;
				const currHp = Players.Districts.get(playerID)?.getDistrictHealth(this.plotCoord);
				const maxHp = Players.Districts.get(playerID)?.getDistrictMaxHealth(this.plotCoord);
				const toolTipDebugTitle = document.createElement("div");
				toolTipDebugTitle.classList.add("plot-tooltip__debug-title-text");
				if ((currHp != undefined && currHp != 0) && (maxHp != undefined && maxHp != 0)) {
					toolTipDebugTitle.innerHTML = Locale.compose("LOC_PLOT_TOOLTIP_DEBUG_TITLE") + ": " + currHp + " / " + maxHp;
					tooltipDebugFlexbox.appendChild(toolTipDebugTitle);
				}
				else {
					toolTipDebugTitle.innerHTML = Locale.compose("LOC_PLOT_TOOLTIP_DEBUG_TITLE") + ":";
					tooltipDebugFlexbox.appendChild(toolTipDebugTitle);
				}
				const toolTipDebugPlotCoord = document.createElement("div");
				toolTipDebugPlotCoord.classList.add("plot-tooltip__coordinate-text");
				toolTipDebugPlotCoord.innerHTML = Locale.compose("LOC_PLOT_TOOLTIP_PLOT") + `: (${this.plotCoord.x},${this.plotCoord.y})`;
				tooltipDebugFlexbox.appendChild(toolTipDebugPlotCoord);
				const toolTipDebugPlotIndex = document.createElement("div");
				toolTipDebugPlotIndex.classList.add("plot-tooltip__coordinate-text");
				toolTipDebugPlotIndex.innerHTML = Locale.compose("LOC_PLOT_TOOLTIP_INDEX") + `: ${plotIndex}`;
				tooltipDebugFlexbox.appendChild(toolTipDebugPlotIndex);
				const localPlayer = plotObject.LocalPlayer;
				if (localPlayer != null) {
					if (localPlayer.isDistantLands(this.plotCoord)) {
						const toolTipDebugPlotTag = document.createElement("div");
						toolTipDebugPlotTag.classList.add("plot-tooltip__coordinate-text");
						toolTipDebugPlotTag.innerHTML = Locale.compose("LOC_PLOT_TOOLTIP_HEMISPHERE_WEST");
						tooltipDebugFlexbox.appendChild(toolTipDebugPlotTag);
					}
					else {
						const toolTipDebugPlotTag = document.createElement("div");
						toolTipDebugPlotTag.classList.add("plot-tooltip__coordinate-text");
						toolTipDebugPlotTag.innerHTML = Locale.compose("LOC_PLOT_TOOLTIP_HEMISPHERE_EAST");
						tooltipDebugFlexbox.appendChild(toolTipDebugPlotTag);
					}
				}
			}
		}
		
		//---------------------
		// Info Queries
		//---------------------
		getPlotInfo (plotCoordinate) {
			// Get plot index
			const plotIndex = GameplayMap.getIndexFromLocation(plotCoordinate);
			
			// Get biome object
			const biomeType = GameplayMap.getBiomeType(plotCoordinate.x, plotCoordinate.y);
			const biome = GameInfo.Biomes.lookup(biomeType);
			
			// Get terrain object
			const terrainType = GameplayMap.getTerrainType(plotCoordinate.x, plotCoordinate.y);
			const terrain = GameInfo.Terrains.lookup(terrainType);
			
			// Get feature object
			const featureType = GameplayMap.getFeatureType(plotCoordinate.x, plotCoordinate.y);
			const feature = GameInfo.Features.lookup(featureType);
			
			// Get river type
			const riverType = GameplayMap.getRiverType(plotCoordinate.x, plotCoordinate.y);
			
			// Get resource object
			const resourceType = GameplayMap.getResourceType(plotCoordinate.x, plotCoordinate.y);
			const resource = GameInfo.Resources.lookup(resourceType);
			
			// Get local player info
			const localPlayerID = GameContext.localPlayerID;
			const localPlayer = Players.get(localPlayerID);
			const localPlayerDiplomacy = localPlayer?.Diplomacy;  
			
			// Get owning player info
			const owningPlayerID = GameplayMap.getOwner(plotCoordinate.x, plotCoordinate.y);
			const owningPlayer = Players.get(owningPlayerID);
			const owningPlayerDiplomacy = (localPlayerID != owningPlayerID && owningPlayer) ? owningPlayer?.Diplomacy : undefined;
			const owningPlayerDistricts = (owningPlayer) ? Players.Districts.get(owningPlayerID) : undefined;
			
			// Get district info
			const districtId = MapCities.getDistrict(plotCoordinate.x, plotCoordinate.y);
			const district = (districtId) ? Districts.get(districtId) : undefined;
			
			// Get plot settlement info
			const owningCityID = GameplayMap.getOwningCityFromXY(plotCoordinate.x, plotCoordinate.y);
			let owningCity;
			if (owningPlayer && Players.isAlive(owningPlayerID)) {
				const playerCities = owningPlayer.Cities;
				if (playerCities) {
					const cities = playerCities.getCities();
					for (const city of cities) {
						if (ComponentID.isMatch(city.id, owningCityID) == true) {
							owningCity = city;
							break;
						}
					}
				}
			}
			
			// Get unit array
			const plotUnits = MapUnits.getUnits(plotCoordinate.x, plotCoordinate.y);
			
			// Get constructible array
			const constructibles = MapConstructibles.getHiddenFilteredConstructibles(plotCoordinate.x, plotCoordinate.y);
			
			// If no constructibles, get potential improvement array
			const potentialImprovements = [];
			if (!constructibles || constructibles.length == 0) {
				if (resource && potentialImprovements.length == 0) {
					const infos = GameInfo.District_FreeConstructibles.filter(item => (item.ResourceType && item.ResourceType == resource.ResourceType));
					if (infos) {
						for (const info of infos) {
							const constructible = GameInfo.Constructibles.find(item => (item.ConstructibleType == info.ConstructibleType));
							if (!constructible.Age || Database.makeHash(constructible?.Age ?? "") == Game.age) {
								potentialImprovements.push(constructible);
							}
						}
					}
				}
				if (feature && potentialImprovements.length == 0) {
					const infos = GameInfo.District_FreeConstructibles.filter(item => (item.FeatureType == feature.FeatureType));
					if (infos) {
						for (const info of infos) {
							const constructible = GameInfo.Constructibles.find(item => (item.ConstructibleType == info.ConstructibleType));
							if (!constructible.Age || Database.makeHash(constructible?.Age ?? "") == Game.age) {
								potentialImprovements.push(constructible);
							}
						}
					}
				}
				if (riverType && riverType == RiverTypes.RIVER_NAVIGABLE && potentialImprovements.length == 0) {
					const infos = GameInfo.District_FreeConstructibles.filter(item => (item.RiverType == "RIVER_NAVIGABLE"));
					if (infos) {
						for (const info of infos) {
							const constructible = GameInfo.Constructibles.find(item => (item.ConstructibleType == info.ConstructibleType));
							if (!constructible.Age || Database.makeHash(constructible?.Age ?? "") == Game.age) {
								potentialImprovements.push(constructible);
							}
						}
					}
				}
				if (terrain && potentialImprovements.length == 0) {
					const infos = GameInfo.District_FreeConstructibles.filter(item => (item.TerrainType == terrain.TerrainType));
					if (infos) {
						for (const info of infos) {
							const constructible = GameInfo.Constructibles.find(item => (item.ConstructibleType == info.ConstructibleType));
							if (!constructible.Age || Database.makeHash(constructible?.Age ?? "") == Game.age) {
								potentialImprovements.push(constructible);
							}
						}
					}
				}
			}		
			
			const plot = {
				coordinate: plotCoordinate,
				x: plotCoordinate.x, //int
				y: plotCoordinate.y, //int
				PlotIndex: plotIndex, //int
				Biome: biome, //object
				Terrain: terrain, //object
				Feature: feature, //object
				RiverType: riverType, //int
				Resource: resource, //object
				OwningPlayerID: owningPlayerID, //string
				OwningPlayer: owningPlayer, //object
				OwningPlayerDiplomacy: owningPlayerDiplomacy, //object
				OwningPlayerDistricts: owningPlayerDistricts, //array
				LocalPlayerID: localPlayerID, //string
				LocalPlayer: localPlayer, //object
				LocalPlayerDiplomacy: localPlayerDiplomacy, //object
				DistrictID: districtId, //string
				District: district, //object
				City: owningCity, //object
				Units: plotUnits, //array
				Constructibles: constructibles, //array
				PotentialImprovements: potentialImprovements //array
			}
			
			return plot;
		}
		getFeatureInfo(plotObject) {
			// Returns an Object:
			// Object.plotIsNaturalWonder
			// Object.featureLabel
			// Object.featureTooltip
			let featureLabel = '';
			const feature = plotObject.Feature;
			const plotIsNaturalWonder = (feature && GameInfo.Feature_NaturalWonders.find(e => e.FeatureType == feature.FeatureType)) ? true : false;
			const featureTooltip = (plotIsNaturalWonder) ? Locale.compose(feature.Description) : undefined;
			
			if (feature) {
				if (GameplayMap.isVolcano(plotObject.x, plotObject.y)) {
					const active = GameplayMap.isVolcanoActive(plotObject.x, plotObject.y);
					const volcanoStatus = (active) ? 'LOC_VOLCANO_ACTIVE' : 'LOC_PLOT_MOD_TCS_DORMANT';
					const volcanoName = GameplayMap.getVolcanoName(plotObject.x, plotObject.y);
					const volcanoDetailsKey = (volcanoName) ? 'LOC_UI_NAMED_VOLCANO_DETAILS' : 'LOC_UI_VOLCANO_DETAILS';
					featureLabel = (volcanoName) ? Locale.compose("LOC_PLOT_MOD_TCS_VOLCANO", volcanoName, volcanoStatus) : Locale.compose("LOC_PLOT_MOD_TCS_UNNAMED_VOLCANO", volcanoStatus);
				}
				else {
					featureLabel = Locale.compose(feature.Name);
				}
			}
			return {
				plotIsNaturalWonder : plotIsNaturalWonder, 
				featureLabel : featureLabel,
				featureTooltip : featureTooltip
			};
		}
		getTopUnit(plotObject) {
			let plotUnits = plotObject.Units;
			if (plotUnits && plotUnits.length > 0) {
				const topUnit = Units.get(plotUnits[0]);
				return topUnit;
			}
			return null;
		}
		getConquerorInfo(districtId) {
			if (!districtId) {
				return null;
			}
			const district = Districts.get(districtId);
			if (!district || !ComponentID.isValid(districtId)) {
				console.error(`plot-tooltip: couldn't find any district with the given id: ${districtId}`);
				return null;
			}
			if (district.owner != district.controllingPlayer) {
				const conqueror = Players.get(district.controllingPlayer);
				if (!conqueror) {
					console.error(`plot-tooltip: couldn't find any civilization with the given player ${district.controllingPlayer}`);
					return null;
				}
				if (conqueror.isIndependent) {
					const plotTooltipOwnerLeader = document.createElement("div");
					plotTooltipOwnerLeader.classList.add("plot-tooltip__owner-leader-text");
					const label = Locale.compose("{1_Term}: {2_Subject}", "LOC_PLOT_TOOLTIP_CONQUEROR", "LOC_PLOT_TOOLTIP_INDEPENDENT_CONQUEROR");
					plotTooltipOwnerLeader.innerHTML = label;
					return plotTooltipOwnerLeader;
				}
				else {
					const conquerorName = Locale.compose(conqueror.civilizationFullName);
					const plotTooltipConqueredCiv = document.createElement("div");
					plotTooltipConqueredCiv.classList.add("plot-tooltip__owner-civ-text");
					const label = Locale.compose("{1_Term}: {2_Subject}", "LOC_PLOT_TOOLTIP_CONQUEROR", conquerorName);
					plotTooltipConqueredCiv.innerHTML = label;
					return plotTooltipConqueredCiv;
				}
			}
			else {
				return null;
			}
		}
		
		//---------------------
		// Label Queries
		//---------------------
		getBiomeLabel(plotObject) {
			const biome = plotObject.Biome;
			// Do not show a label if marine biome.
			if (biome && biome.BiomeType != "BIOME_MARINE") {
				if (this.isShowingDebug) {
					return Locale.compose('{1_Name} ({2_Value})', biome.Name, biomeType.toString());
				}
				else {
					return biome.Name;
				}
			}
			else {
				return "";
			}
		}
		getTerrainLabel(plotObject) {
			const terrain = plotObject.Terrain;
			if (terrain) {
				if (this.isShowingDebug) {
					// despite being "coast" this is a check for a lake
					if (terrain.TerrainType == "TERRAIN_COAST" && GameplayMap.isLake(plotObject.x, plotObject.y)) {
						return Locale.compose('{1_Name} ({2_Value})', "LOC_TERRAIN_LAKE_NAME", terrainType.toString());
					}
					return Locale.compose('{1_Name} ({2_Value})', terrain.Name, terrainType.toString());
				}
				else {
					// despite being "coast" this is a check for a lake
					if (terrain.TerrainType == "TERRAIN_COAST" && GameplayMap.isLake(plotObject.x, plotObject.y)) {
						return "LOC_TERRAIN_LAKE_NAME";
					}
					return terrain.Name;
				}
			}
			else {
				return "";
			}
		}	
		getRiverLabel(plotObject) {
			const riverType = plotObject.RiverType;
			if (riverType != RiverTypes.NO_RIVER) {
				let riverNameLabel = GameplayMap.getRiverName(plotObject.x, plotObject.y);
				if (!riverNameLabel) {
					switch (riverType) {
						case RiverTypes.RIVER_MINOR:
							riverNameLabel = "LOC_MINOR_RIVER_NAME";
							break;
						case RiverTypes.RIVER_NAVIGABLE:
							riverNameLabel = "LOC_NAVIGABLE_RIVER_NAME";
							break;
					}
				}
				return riverNameLabel;
			}
			else {
				return "";
			}
		}
		getContinentName(location) {
			const continentType = GameplayMap.getContinentType(location.x, location.y);
			const continent = GameInfo.Continents.lookup(continentType);
			if (continent && continent.Description) {
				return Locale.compose(continent.Description);
			}
			else {
				return "";
			}
		}
		getRouteName(plotObject) {
			const routeType = GameplayMap.getRouteType(plotObject.x, plotObject.y);
			const route = GameInfo.Routes.lookup(routeType);
			const isFerry = GameplayMap.isFerry(plotObject.x, plotObject.y);
			let returnString = "";
			if (route) {
				if (isFerry) {
					returnString = Locale.compose(route.Name) + " " + Locale.compose("LOC_PLOT_DIVIDER_DOT") + " " + Locale.compose("LOC_NAVIGABLE_RIVER_FERRY");
				}
				else {
					returnString = Locale.compose(route.Name);
				}
			}
			return returnString;
		}
		getPlotEffectNames(plotObject) {
			const plotEffects = MapPlotEffects.getPlotEffects(plotObject.PlotIndex);
			if (plotEffects) {
				const localPlayerID = plotObject.LocalPlayerID;
				const plotEffectsFiltered = plotEffects.filter(item => (!item.onlyVisibleToOwner || (item.onlyVisibleToOwner && (item.owner == localPlayerID))));
				if (plotEffectsFiltered.length > 0) {
					let effectString;
					plotEffectsFiltered?.forEach((item) => {
						const effectInfo = GameInfo.PlotEffects.lookup(item.effectType);
						if (effectInfo) {
							if (!effectString) {
								effectString = Locale.compose(effectInfo.Name);
							}
							else {
								effectString = effectString + " " + Locale.compose("LOC_PLOT_DIVIDER_DOT") + " " + Locale.compose(effectInfo.Name);
							}					
						}
					});
					return effectString;
				}
				return false;
			}
			return false;
		}
		
		//---------------------
		// Div Constructors
		//---------------------
		addHorizontalRule() {
			const toolTipHorizontalRule = document.createElement("div");
			toolTipHorizontalRule.classList.add("plot-tooltip__horizontalRule");
			this.container.appendChild(toolTipHorizontalRule);
		}
		addSeparatorLine() {
			const tooltipSeparator_LineFlex = document.createElement("div");
			tooltipSeparator_LineFlex.classList.add("plot-tooltip__TitleLineFlex");
			const titleLeftSeparator = document.createElement("div");
			titleLeftSeparator.classList.add("plot-tooltip__TitleLineleft");
			tooltipSeparator_LineFlex.appendChild(titleLeftSeparator);
			const titleRightSeparator = document.createElement("div");
			titleRightSeparator.classList.add("plot-tooltip__TitleLineRight");
			tooltipSeparator_LineFlex.appendChild(titleRightSeparator);
			this.container.appendChild(tooltipSeparator_LineFlex);
		}
		addGradiantBackground(linearGradiantLeft, linearGradiantRight, container) {
			const tooltipSeparator_LineFlex = document.createElement("div");
			tooltipSeparator_LineFlex.classList.add("plot-tooltip__TitleLineFlex");
			const titleLeftSeparator = document.createElement("div");
			titleLeftSeparator.classList.add("plot-tooltip__TitleLineleft");
			titleLeftSeparator?.style.setProperty("height", '100%');
			titleLeftSeparator?.style.setProperty("width", '50%');
			titleLeftSeparator?.style.setProperty('background-image', linearGradiantLeft);
			titleLeftSeparator?.style.setProperty('align-self', 'flex-start');
			tooltipSeparator_LineFlex.appendChild(titleLeftSeparator);
			const titleRightSeparator = document.createElement("div");
			titleRightSeparator.classList.add("plot-tooltip__TitleLineRight");
			titleRightSeparator?.style.setProperty("height", '100%');
			titleRightSeparator?.style.setProperty("width", '50%');
			titleRightSeparator?.style.setProperty('background-image', linearGradiantRight);
			titleRightSeparator?.style.setProperty('align-self', 'flex-start');
			tooltipSeparator_LineFlex.appendChild(titleRightSeparator);
			container.appendChild(tooltipSeparator_LineFlex);
		}
		addTitleLine(titleText) {
			const tooltipTitle_LineFlex = document.createElement("div");
			tooltipTitle_LineFlex.classList.add("plot-tooltip__TitleLineFlex");
			const titleLeftSeparator = document.createElement("div");
			titleLeftSeparator.classList.add("plot-tooltip__TitleLineleft");
			titleLeftSeparator?.style.setProperty('min-width', '0.5rem');
			tooltipTitle_LineFlex.appendChild(titleLeftSeparator);
			const tooltipTitleName = document.createElement("div");
			tooltipTitleName.classList.add("plot-tooltip__ImprovementName");
			tooltipTitleName?.style.setProperty('max-width', '12rem');
			tooltipTitleName.innerHTML = titleText;
			tooltipTitle_LineFlex.appendChild(tooltipTitleName);
			const titleRightSeparator = document.createElement("div");
			titleRightSeparator.classList.add("plot-tooltip__TitleLineRight");
			titleRightSeparator?.style.setProperty('min-width', '0.5rem');
			tooltipTitle_LineFlex.appendChild(titleRightSeparator);
			this.container.appendChild(tooltipTitle_LineFlex);
		}
		
		addConstructibleImage(item) {
			const constructibleIcon = document.createElement("div");
			constructibleIcon.classList.add("plot-tooltip__large-resource-icon");
			const constructibleIconCSS = UI.getIconCSS(item.Info.ConstructibleType, "CONSTRUCTIBLE");
			constructibleIcon?.style.setProperty('width', '2rem');
			constructibleIcon?.style.setProperty('height', '2rem');
			constructibleIcon?.style.setProperty('margin-right', '0.333333337rem');
			constructibleIcon?.style.setProperty('padding-left', '0.333333337rem');
			constructibleIcon.style.backgroundImage = constructibleIconCSS;
			return constructibleIcon;
		}
		addConstructibleTag(string) {
			const constructibleTagString = document.createElement("div");
			constructibleTagString.classList.add('text-2xs', 'text-left', 'font-body-sm');
			constructibleTagString.setAttribute('data-l10n-id', string);
			return constructibleTagString;
		}
		
		//---------------------
		// Miscellaneous
		//---------------------
		// Unsure if this is still needed...??
		isBlank() {
			if (this.plotCoord == null) {
				return true;
			}
			const localPlayerID = GameContext.localPlayerID;
			const revealedState = GameplayMap.getRevealedState(localPlayerID, this.plotCoord.x, this.plotCoord.y);
			if (revealedState == RevealedStates.HIDDEN) {
				return true;
			}
			// If a unit is selected, check if over our own unit an enemy unit and prevent the plot tooltip from displaying.
			const selectedUnitID = UI.Player.getHeadSelectedUnit();
			if (selectedUnitID && ComponentID.isValid(selectedUnitID)) {
				const plotUnits = MapUnits.getUnits(this.plotCoord.x, this.plotCoord.y);
				if (plotUnits.length > 0) {
					// Hovering over your selected unit; don't show the plot tooltip
					if (plotUnits.find(e => ComponentID.isMatch(e, selectedUnitID))) {
						return true;
					}
					let args = {};
					args.X = this.plotCoord.x;
					args.Y = this.plotCoord.y;
					let combatType = Game.Combat.testAttackInto(selectedUnitID, args);
					if (combatType != CombatTypes.NO_COMBAT) {
						return true;
					}
				}
			}
			return false;
		}
	}
	TooltipManager.registerPlotType('plot', PlotTooltipPriority.LOW, new PlotTooltipType());
	
	//# sourceMappingURL=file:///base-standard/ui/tooltips/plot-tooltip.js.map
	