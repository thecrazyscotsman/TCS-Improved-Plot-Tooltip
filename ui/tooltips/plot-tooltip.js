/**
 * Plot Tooltips
 * @copyright 2022, Firaxis Gmaes
 * @description The tooltips that appear based on the cursor hovering over world plots.
 * 
 * TCS Improved Plot Tooltip
 * -------------------------
 * author: thecrazyscotsman
*/
	import TooltipManager, { PlotTooltipPriority } from '/core/ui/tooltips/tooltip-manager.js';
	import { ComponentID } from '/core/ui/utilities/utilities-component-id.js';
	import DistrictHealthManager from '/base-standard/ui/district/district-health-manager.js';
	import LensManager from '/core/ui/lenses/lens-manager.js';
	import { TradeRoute } from '/core/ui/utilities/utilities-data.js';
	import CityDetails, { UpdateCityDetailsEventName } from "/base-standard/ui/city-details/model-city-details.js";
	import { InterfaceMode } from '/core/ui/interface-modes/interface-modes.js';

	import { TCS_ShowPotentialImprovement, TCS_ShowQuarterDescription, TCS_BuildingFlexDisplayMode, TCS_ShowPlayerRelationship, TCS_ShowCoordinates, TCS_EnableDebugMode } from 'fs://game/tcs-ui-improved-plot-tooltip/settings/settings.js';

	console.warn("----------------------------------");
	console.warn("TCS IMPROVED PLOT TOOLTIP (TCS-IPT) - LOADED");
	console.warn("----------------------------------");

	// General: Utilities
	const TCS_DIVIDER_DOT = Locale.compose("LOC_PLOT_DIVIDER_DOT");
	const TCS_CONSTRUCTIBLES_MISSING_ICONS = ['IMPROVEMENT_VILLAGE', 'IMPROVEMENT_ENCAMPMENT'];
	const TCS_FALLBACK_CONSTRUCTIBLE = 'IMPROVEMENT_HILLFORT'; //fallback...blp:impicon_village (used for Village and Encampment improvements) doesn't seem to load anything. 
	const TCS_FALLBACK_CONSTRUCTIBLE_DISCOVERY = 'IMPROVEMENT_EXPEDITION_BASE';

	// CSS: Title Line
	const TCS_TITLE_CONTAINER_PROPERTIES = [
		['display', 'flex'],
		['flex-direction', 'row'],
		['justify-content', 'center'],
		['align-items', 'center'],
		['align-self', 'center'],
		['margin-left', '-1.3333333333rem'],
		['margin-right', '-1.3333333333rem'],
		['flex', '1 1 auto'],
	];
	const TCS_TITLE_LINE_LEFT = [
		['height', '0.1111111111rem'],
		['flex', '1 1 auto'],
		['min-width', '0.5rem'],
		['margin-left', '0.3333333333rem'],
		['background-image', 'linear-gradient(to left, #8D97A6, rgba(141, 151, 166, 0))'],
	];
	const TCS_TITLE_LINE_RIGHT = [
		['height', '0.1111111111rem'],
		['flex', '1 1 auto'],
		['min-width', '0.5rem'],
		['margin-left', '0.3333333333rem'],
		['background-image', 'linear-gradient(to right, #8D97A6, rgba(141, 151, 166, 0))'],
	];
	const TCS_TITLE_LINE_TEXT = [
		['display', 'flex'],
		['flex-direction', 'row'],
		['align-items', 'center'],
		['position', 'relative'],
		['align-self', 'center'],
		['text-align', 'center'],
		['font-size', 'calc(1rem + -0.1111111111rem)'],
		['letter-spacing', '0.1111111111rem'],
		['padding-top', '0.25rem'],
		['padding-bottom', '0.1rem'],
		['padding-left', '0.6666666667rem'],
		['padding-right', '0.6666666667rem'],
		['line-height', '1.3333333333rem'],
		['max-width', '12rem'],
	];

	// CSS: Section Containers
	const TCS_SECTION_CONTAINER_PROPERTIES = [
		['position', 'relative'],
		['width', '100%'],
		['display', 'flex'],
		['justify-content', 'flex-start'],
		['align-content', 'center'],
	];
	const TCS_SECTION_CONTAINER_ROW_PROPERTIES = 
	[
		['position', 'relative'],
		['width', '100%'],
		['display', 'flex'],
		['flex-direction', 'row'],
		['justify-content', 'center'],
		['align-content', 'center'],
	];
	const TCS_SECTION_CONTAINER_COLUMN_PROPERTIES = 
	[
		['position', 'relative'],
		['width', '100%'],
		['display', 'flex'],
		['flex-direction', 'column'],
		['justify-content', 'center'],
		['align-content', 'flex-start'],
	];
	
	// CSS: Text Containers
	const TCS_TEXT_DEFAULT_CENTER = [
		['font-size', 'calc(1rem + -0.2222222222rem)'],
		['text-align', 'center'],
		['line-height', '1rem'],
		['margin-top', '0.0555555556rem'],
	];
	
	// CSS: Icons and Backgrounds
	const TCS_ICON_FORTIFICATION = `url("fs://game/Action_Defend.png")`;
	const TCS_ICON_HEALTH = `url("fs://game/prod_generic.png")`;
	const TCS_ICON_SPECIALISTS = 'CITY_SPECIAL_BASE';
	const TCS_ICON_TOTAL_YIELDS = 'CITY_RURAL';
	const TCS_ICON_TRADE_ROUTES = '[icon:UNIT_MERCHANT]';

	const TCS_ICON_MARGIN_RIGHT_SMALL = '0.166666667rem';
	const TCS_ICON_MARGIN_RIGHT_DEFAULT = '0.333333337rem';
	const TCS_ICON_MARGIN_RIGHT_LARGE = '0.666666667rem';
	const TCS_ICON_TRANSFORM = 'translate(0.0999999999rem, -0.0999999999rem)'; //default: translate(0.1111111111rem, -0.1111111111rem)
	const TCS_ICON_SHADOW_TRANSFORM = 'translate(-0.0999999999rem, 0.0999999999rem)'; //default: translate(-0.1111111111rem, 0.1111111111rem)
	const TCS_ICON_SHADOW_TINT = 'black'; //rgb(25, 25, 25) #000000
	const TCS_ICON_SIZE_SMALL = '1rem';
	const TCS_ICON_SIZE_DEFAULT = '2rem'; // Buildings
	const TCS_ICON_SIZE_MEDIUM = '2.25rem'; // Improvements
	const TCS_ICON_SIZE_LARGE = '2.6666666667rem'; // Resources & Wonders

	const TCS_ICON_PROPERTIES_DEFAULT = [
		['position', 'relative'],
		['background-size', 'contain'],
		['background-repeat', 'no-repeat'],
		['align-content', 'center'],
	];

	// CSS: Warning Banners
	const TCS_BORDER_WIDTH = "0.1111111111rem";
	const TCS_MARGIN_SIDE = `calc(${TCS_BORDER_WIDTH} - var(--padding-left-right))`;
	const TCS_PADDING_SIDE = `calc(var(--padding-left-right) - ${TCS_BORDER_WIDTH})`;
	const TCS_MARGIN_TOP = `calc(${TCS_BORDER_WIDTH} - var(--padding-top-bottom))`;
	const TCS_PADDING_TOP = `calc(var(--padding-top-bottom) - ${TCS_BORDER_WIDTH})`;
	const TCS_WARNING_BACKGROUND_COLOR = '#3A0806'; // #3A0806
	const TCS_WARNING_TEXT_COLOR = '#CEA92F'; // #CEA92F
	const TCS_WARNING_BANNER_PROPERTIES = [
		['flex-direction','column'],
		['--padding-top-bottom', '0.2222222222rem'],
		['margin-left', TCS_MARGIN_SIDE],
		['margin-right', TCS_MARGIN_SIDE],
		['margin-top', TCS_MARGIN_TOP],
		['margin-bottom', TCS_MARGIN_TOP],
		['padding-top', TCS_PADDING_TOP],
		['padding-bottom', TCS_PADDING_TOP],
		['padding-left', TCS_PADDING_SIDE],
		['padding-right', TCS_PADDING_SIDE],
		['background-color', TCS_WARNING_BACKGROUND_COLOR],
	];	

	// CSS: Constructibles
	const TCS_CONSTRUCTIBLE_CONTAINER_PROPERTIES = [
		['justify-content', 'center'],
		['align-content', 'flex-start'],
		['padding', '0.5rem']
	];	

	// Update Listener
	export const UpdateTCSPlotTooltipName = 'update-tcs-plot-tooltip';
	export class UpdateTCSPlotTooltipEvent extends CustomEvent {
		constructor() {
			super(UpdateTCSPlotTooltipName, { bubbles: false });
		}
	}

	// Tooltip Class
	class PlotTooltipType {
		constructor() {
			this.plotCoord = null;
			this.plotObject = null;
			this.plotOwnerID = null;
			this.plotOwnerPlayer = null;
			this.tooltip = document.createElement('fxs-tooltip');
			this.container = document.createElement('div');
			this.yieldsFlexbox = document.createElement('div');
			this.tooltip.classList.add('plot-tooltip', 'max-w-96');
			this.tooltip.appendChild(this.container);
			this.shiftKey = false;
			this.minimizeTooltip = false;

			// User config related-items
			this.updateQueued = false;
			this.isShowingDebug = false;
			this.isShowingCoordinates = false;
			this.isShowingQuarterDescription = true;
			this.isShowingPotentialImprovement = true;
			this.isShowingPlayerRelationship = true;
			this.isShowingBuildingsAsRow = true;

			// TCS - need to add a listener to update tooltip when different options are selected
			this.updateTCSPlotTooltipListener = this.queueUpdate.bind(this);
			window.addEventListener('update-tcs-plot-tooltip', this.updateTCSPlotTooltipListener);
			Loading.runWhenFinished(() => {
				for (const y of GameInfo.Yields) {
					const url = UI.getIcon(`${y.YieldType}`, "YIELD");
					Controls.preloadImage(url, 'plot-tooltip');
				}
				for (const c of GameInfo.Constructibles) {
					const url = UI.getIcon(`${c.ConstructibleType}`, "CONSTRUCTIBLE");
					Controls.preloadImage(url, 'plot-tooltip');
				}
				// Update based on stored user config options
				this.updateTooltipConfig();
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

			// Check if the Shift key is pressed (to minimize the tooltip)
			// Code borrowed from @beezany/@trixie. Thank you!
			const shiftKey = Input.isShiftDown();
			const minimizeTooltip = shiftKey;
			if (shiftKey != this.shiftKey || minimizeTooltip != this.minimizeTooltip) {
				this.shiftKey = shiftKey;
				this.minimizeTooltip = minimizeTooltip;
				return true;
			}
			return true;
		}
		reset() {
			this.container.innerHTML = '';
			this.yieldsFlexbox.innerHTML = '';
			this.plotObject = null;
		}
		update() {

			if (this.plotCoord == null) {
				console.error("Tooltip was unable to read plot values due to a coordinate error.");
				return;
			}
			//this.isShowingDebug = UI.isDebugPlotInfoVisible(); // Ensure debug status hasn't changed
			
			const plotCoord = this.plotCoord;

			// Get a bunch of info in 1 call to reduce repeated queries
			this.plotObject = this.getPlotInfo(plotCoord);
			
			//---------------------
			// Construct Tooltip
			//---------------------
			
			let feature; //needs to be initialized outside if-thens

			if (!this.minimizeTooltip) {
				// PRIORITY OVERRIDE: Settler Lens
				this.addSettlerOverride(this.plotObject);
		
				// SECTION: Biome & Terrain
				this.addBiomeTerrain(this.plotObject);
				
				// SECTION: Feature
				feature = this.getFeatureInfo(this.plotObject);
				if (feature && !feature.plotIsNaturalWonder) {this.addFeatureRiver(this.plotObject);}
			}
							
			// SECTION: Yields
			this.yieldsFlexbox.classList.add("plot-tooltip__resourcesFlex");
			this.container.appendChild(this.yieldsFlexbox);
			this.addPlotYields(this.plotObject);
			
			// SECTION: Constructibles
			this.addConstructibles(this.plotObject);

			if (!this.minimizeTooltip) {	
				// SECTION: Natural Wonder
				if (feature && feature.plotIsNaturalWonder) {this.addFeatureRiver(this.plotObject);}

				// SECTION: Resource
				this.addResource(this.plotObject);
				
				// SECTION: City & Owner
				this.addCityOwnerInfo(this.plotObject);
				
				// SECTION: Units
				this.addUnitInfo(this.plotObject);
			
				// SECTION: More Info
				// Continent & Route
				// Plot Effects
				this.addMoreInfo(this.plotObject);
			}
			
			UI.setPlotLocation(this.plotCoord.x, this.plotCoord.y, this.plotObject.PlotIndex);
			// Adjust cursor between normal and red based on the plot owner's hostility
			if (!UI.isCursorLocked()) {
				const localPlayerID = this.plotObject.LocalPlayerID;
				const topUnit = this.getTopUnit(this.plotObject);
				let showHostileCursor = false;
				let owningPlayerID = this.plotObject.OwningPlayerID;
				// if there's a unit on the plot, that player overrides the tile's owner
				if (topUnit) {
					owningPlayerID = topUnit.owner;
				}
				const revealedState = GameplayMap.getRevealedState(localPlayerID, plotCoord.x, plotCoord.y);
				if (Players.isValid(localPlayerID) && Players.isValid(owningPlayerID) && (revealedState == RevealedStates.VISIBLE)) {
					const owningPlayer = this.plotObject.OwningPlayer;
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
						const localPlayer = this.plotObject.LocalPlayer;
						if (localPlayer) {
							const localPlayerDiplomacy = this.plotObject.LocalPlayerDiplomacy;
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
			if (!this.minimizeTooltip) {this.addDebugInfo(this.plotObject);}
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
					this.container.appendChild(this.addElement_Title(featureInfo.featureLabel));
					
					// tooltip line
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
			let yieldTypes = 0;
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
					yieldTypes = yieldTypes + 1;
				}
			});

			this.yieldsFlexbox.appendChild(fragment);
			// Give all the yields extra room if one of them has extra digits, to keep the spacing even.
			this.yieldsFlexbox.classList.remove('resourcesFlex--double-digits', 'resourcesFlex--triple-digits');
			if (maxValueLength > 2) {
				this.yieldsFlexbox.classList.add(maxValueLength > 3 ? 'resourcesFlex--triple-digits' : 'resourcesFlex--double-digits');
			}
			
			// Get Specialist info
			let workerString;
			if (plotObject.OwningPlayerID == plotObject.LocalPlayerID && plotObject.City && plotObject.District && (plotObject.District.type == DistrictTypes.URBAN || plotObject.District.type == DistrictTypes.CITY_CENTER)) {
				if (!plotObject.City.isTown) {
					const numWorkerSlots = plotObject.City.Workers.getCityWorkerCap();
					if (numWorkerSlots > 0) {
						const cityPlots = plotObject.City.Workers.GetAllPlacementInfo();
						if (cityPlots) {
							const plot = cityPlots.find(p => p.PlotIndex == plotObject.PlotIndex);
							if (plot) {
								const numWorkers = plot.NumWorkers;
								workerString = (numWorkerSlots == numWorkers) ? numWorkers : (numWorkers + "/" + numWorkerSlots);
							}
						}
					}
				}
			}

			// Build total yields and specialist box
			if (totalYields > 0 || workerString) {
				const additionalIconProperties = [
					['width', '0.92rem'],
					['height', '0.92rem'],
					['margin-right', '0.2666667rem'],
					['margin-top', '0.1rem']
				]

				const additionalYieldInfo = document.createElement("div");
				TCS_SECTION_CONTAINER_ROW_PROPERTIES.forEach(p => {
					additionalYieldInfo?.style.setProperty(p[0], p[1]);
				});
				
				if (totalYields > 0 && yieldTypes > 1) {
					const subContainer = document.createElement("div");
					subContainer?.style.setProperty('display', 'flex');
					subContainer?.style.setProperty('flex-direction', 'row');
					subContainer?.style.setProperty('justify-content', 'flex-start');
					const totalYieldsIconCSS = UI.getIconCSS(TCS_ICON_TOTAL_YIELDS);

					// Icon + shadow
					const totalYieldsIconShadow = this.addElement_IconWithShadow(totalYieldsIconCSS, TCS_ICON_PROPERTIES_DEFAULT.concat(additionalIconProperties));

					// Text
					const totalYieldsText = this.addElement_Text(totalYields,[['font-weight', '500']]);
					totalYieldsText.classList.add('text-xs');

					subContainer.appendChild(totalYieldsIconShadow);
					subContainer.appendChild(totalYieldsText);
					additionalYieldInfo.appendChild(subContainer);
				}

				if (workerString) {
					const subContainer = document.createElement("div");
					subContainer?.style.setProperty('display', 'flex');
					subContainer?.style.setProperty('flex-direction', 'row');
					subContainer?.style.setProperty('justify-content', 'flex-start');

					const specialistsIconCSS = UI.getIconCSS(TCS_ICON_SPECIALISTS);
					additionalIconProperties.push(['margin-left', '0.75rem']);//extra margin for the specialist icon to space it from the total yields divs

					// Icon + shadow
					const specialistsIconShadow = this.addElement_IconWithShadow(specialistsIconCSS, TCS_ICON_PROPERTIES_DEFAULT.concat(additionalIconProperties));

					// Text
					const specialistsText = this.addElement_Text(workerString,[['font-weight', '500']]);
					specialistsText.classList.add('text-xs');

					subContainer.appendChild(specialistsIconShadow);
					subContainer.appendChild(specialistsText);
					additionalYieldInfo.appendChild(subContainer);
				}
				this.container.appendChild(additionalYieldInfo);
			}
		}
		addResource(plotObject) {
			const hexResource = plotObject.Resource;	
			if (hexResource) {
				
				// Resource name
				const nameString = "[icon:" + hexResource.ResourceClassType + "] " + Locale.compose(hexResource.Name);
				this.container.appendChild(this.addElement_Title(Locale.stylize(nameString)));
				
				// Resource icon and tooltip	
				const toolTipResourceContainer = document.createElement('div');
				toolTipResourceContainer.classList.add('plot-tooltip__resource-container');
				//toolTipResourceContainer?.style.setProperty('justify-content', 'center');
				
				const toolTipResourceIconCSS = UI.getIconCSS(hexResource.ResourceType);

				// Icon + Background shadow
				const resourceIconShadow = this.addElement_IconWithShadow(
					toolTipResourceIconCSS, 
					TCS_ICON_PROPERTIES_DEFAULT.concat([
						['height',TCS_ICON_SIZE_LARGE],
						['width',TCS_ICON_SIZE_LARGE],
						['margin-right',TCS_ICON_MARGIN_RIGHT_LARGE]
					])
				);
				toolTipResourceContainer.appendChild(resourceIconShadow);
				
				const toolTipResourceDetails = document.createElement('div');
				toolTipResourceDetails.classList.add('plot-tooltip__resource-details');
				toolTipResourceDetails?.style.setProperty('flex-direction', 'row'); //text needs to flow more smoothly across
				toolTipResourceDetails?.style.setProperty('max-width', '14rem');
				
				const toolTipResourceDescription = document.createElement("div");
				toolTipResourceDescription.classList.add("plot-tooltip__resource-label_description");
				//toolTipResourceDescription.setAttribute('data-l10n-id', hexResource.Tooltip);
				toolTipResourceDescription.innerHTML = Locale.stylize(hexResource.Tooltip);
				
				toolTipResourceDetails.appendChild(toolTipResourceDescription);
				toolTipResourceContainer.appendChild(toolTipResourceDetails);
				
				this.container.appendChild(toolTipResourceContainer);	
			}
		}
		addConstructibles(plotObject) {
			
			/*
			district (rural/urban/quarter/wonder)
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
			const district = plotObject.District;
			let districtName = (district) ? Locale.compose(GameInfo.Districts.lookup(district.type).Name) : undefined;
			
			// Get player info
			const player = plotObject.OwningPlayer;
						
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
			}
			
			// Build District Title Tooltip
			// If Wonder, title is Wonder name
			// If unique Quarter, title is unique Quarter name
			// If standard Quarter, title is "Quarter"
			// If Urban, title is "Urban"
			// If Rural, title is "Rural"
			// If empty, title is "Wilderness"
			if (player || (improvements.length > 0) || (plotObject.PotentialImprovements.length > 0)) {
				if (district && district.type == DistrictTypes.WONDER) {districtName = wonders[0].Name;}
				else if (quarters.length > 0) {districtName = Locale.compose(quarters[0].QuarterName);}
				else if (district && (district.type == DistrictTypes.RURAL)) {districtName = undefined;}
				//else if (!player || plotObject.PotentialImprovements.length > 0) {districtName = Locale.compose("LOC_PLOT_MOD_TCS_WILDERNESS");}

				if (districtName) {this.container.appendChild(this.addElement_Title(districtName));};
				if (this.isShowingQuarterDescription == true && quarters.length > 0 && quarters[0].QuarterDescription) {
					this.container.appendChild(this.addElement_Text(
						Locale.compose(quarters[0].QuarterTooltip), 
						TCS_TEXT_DEFAULT_CENTER.concat([['padding-bottom','0.25rem']])));
				};
			}
			
			// Potential improvements
			const potentialImprovements = plotObject.PotentialImprovements;
			if (this.isShowingPotentialImprovement == true && improvements.length == 0 && buildings.length == 0 && wonders.length == 0 && plotObject.PotentialImprovements.length > 0) {
				potentialImprovements.sort((a,b) => (Locale.compose(a.Name) > Locale.compose(b.Name)) ? 1 : ((Locale.compose(b.Name) > Locale.compose(a.Name)) ? -1 : 0));
				
				const plotTooltipImprovementContainer = this.addElement_SectionContainer(TCS_CONSTRUCTIBLE_CONTAINER_PROPERTIES);
				plotTooltipImprovementContainer?.style.setProperty('justify-content', 'center');
				plotTooltipImprovementContainer?.style.setProperty('align-content', 'center');
				
				// Sub Container
				const plotTooltipImprovementSubContainer = this.addElement_SectionContainer(
					[
						['align-content', 'flex-start'],
						['max-width', '100%'],
					]);
				plotTooltipImprovementSubContainer?.style.setProperty('flex-direction', 'column');
				plotTooltipImprovementSubContainer?.style.setProperty('justify-content', 'center');
				plotTooltipImprovementSubContainer?.style.removeProperty('width');
				plotTooltipImprovementContainer.appendChild(plotTooltipImprovementSubContainer);
				
				potentialImprovements.forEach((item) => {
					const plotTooltipSubContainer = this.addElement_SectionContainer(
						[
							['justify-content', 'flex-start'],
							['align-content', 'flex-start'],
							//['background-color', 'rgb(0, 91, 188)'], //debugging
						]);

					// Icon
					const toolTipImprovementIcon = this.addElement_ConstructibleIcon(item, [['opacity', '0.35']]);
					
					// Improvement String
					const plotTooltipImprovementElement = this.addElement_Text(
						Locale.stylize("LOC_PLOT_MOD_TCS_POTENTIAL_IMPROVEMENT", item.Name), 
						[
							['margin-left', '0.15rem'],
							['margin-right', '0.15rem']
						]);

					plotTooltipSubContainer.appendChild(toolTipImprovementIcon);
					plotTooltipSubContainer.appendChild(plotTooltipImprovementElement);
					plotTooltipImprovementSubContainer.appendChild(plotTooltipSubContainer);
				});
				this.container.appendChild(plotTooltipImprovementContainer);
			}
			
			// Improvements
			if (improvements.length > 0) {
				improvements.sort((a,b) => (a.Name > b.Name) ? 1 : ((b.Name > a.Name) ? -1 : 0));
				
				const plotTooltipImprovementContainer = this.addElement_SectionContainer(
					[
						['justify-content', 'center'],
						['align-content', 'center'],
						['max-width', '100%'],
						['padding-top', '0.125rem'],
						['padding-bottom', '0.125rem'],
					]);
				plotTooltipImprovementContainer?.style.removeProperty('width');
				
				improvements.forEach((item) => {
					
					// Parse item tag (Wilderness, Rural, Unique)
					const itemTags = [];
					if (item.Info.Discovery) {itemTags.push(Locale.compose("LOC_PLOT_MOD_TCS_WILDERNESS"));}
					else {itemTags.push(Locale.compose("LOC_PLOT_MOD_TCS_RURAL"));}
					if (item.UniqueTrait) {itemTags.push(Locale.compose("LOC_PLOT_MOD_TCS_UNIQUE"));}
					
					// Parse item status (Damaged, In Progress)
					if (item.Damaged) {itemTags.push(Locale.compose("LOC_PLOT_TOOLTIP_DAMAGED"));}
					else if (!item.Completed) {itemTags.push(Locale.compose("LOC_PLOT_TOOLTIP_IN_PROGRESS"));}
									
					// Sub Container
					const plotTooltipSubContainer = this.addElement_SectionContainer(
						[
							['justify-content', 'center'],
							['align-content', 'center'],
							//['padding', '0.25rem']
						]);
					plotTooltipSubContainer?.style.removeProperty('width');
					
					// Icon
					const toolTipImprovementIcon = this.addElement_ConstructibleIcon(item);
					plotTooltipSubContainer.appendChild(toolTipImprovementIcon);

					// Improvement String
					const plotTooltipImprovementElement = document.createElement("div");
					[
						['margin-left', '0.15rem'],
						['margin-right', '0.15rem'],
						['flex-direction', 'column'],
						['align-content', 'flex-start']
					].forEach(p => {
						plotTooltipImprovementElement?.style.setProperty(p[0], p[1]);
					});
					
					const plotTooltipImprovementString = this.addElement_Text(
						item.Name, 
						[
							//['max-width', '8rem'],
							['font-weight', 'bold']
						]);
					plotTooltipImprovementString.classList.add('text-xs');

					plotTooltipImprovementElement.appendChild(plotTooltipImprovementString);
					if (itemTags.length > 0) {
						const plotTooltipPropertyString = this.addConstructibleTag(itemTags.join(" " + TCS_DIVIDER_DOT + " "));
						plotTooltipImprovementElement.appendChild(plotTooltipPropertyString);	
					}
					plotTooltipSubContainer.appendChild(plotTooltipImprovementElement);
					plotTooltipImprovementContainer.appendChild(plotTooltipSubContainer);
				});
				this.container.appendChild(plotTooltipImprovementContainer);
			}
			
			// Buildings
			if (buildings.length > 0) {
				buildings.sort((a,b) => (a.Name > b.Name) ? 1 : ((b.Name > a.Name) ? -1 : 0));
				
				const plotTooltipBuildingsContainer = this.addElement_SectionContainer(TCS_CONSTRUCTIBLE_CONTAINER_PROPERTIES);
				const plotTooltipBuildingSubcontainer = this.addElement_SectionContainer(
					[
						['justify-content', 'flex-start'],
						['align-content', 'center'],
						//['background-color', TCS_WARNING_BACKGROUND_COLOR], //debugging
					]);
				plotTooltipBuildingsContainer.appendChild(plotTooltipBuildingSubcontainer);
				
				if (buildings.length == 1) {
					plotTooltipBuildingSubcontainer?.style.removeProperty('width');
					plotTooltipBuildingSubcontainer?.style.setProperty('max-width', '100%');	
				}
				if (this.isShowingBuildingsAsRow == false) {
					plotTooltipBuildingSubcontainer?.style.setProperty('flex-direction', 'column');
					plotTooltipBuildingsContainer?.style.setProperty('justify-content', 'center');
					plotTooltipBuildingsContainer?.style.setProperty('align-content', 'center');
					plotTooltipBuildingSubcontainer?.style.removeProperty('width');
					plotTooltipBuildingSubcontainer?.style.setProperty('max-width', '100%');	
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
					

					const plotTooltipSubContainer = this.addElement_SectionContainer(
						[
							['justify-content', 'center'],
							['align-content', 'flex-start'],
							//['background-color', 'rgb(0, 91, 188)'], //debugging
						]);
					if (buildings.length > 1 && this.isShowingBuildingsAsRow == true) {
						plotTooltipSubContainer?.style.setProperty('width', '50%');
					}
					else {plotTooltipSubContainer?.style.removeProperty('width');}
					if (this.isShowingBuildingsAsRow == false) {
						plotTooltipSubContainer?.style.setProperty('justify-content', 'flex-start');
					}
					
					// Icon
					const toolTipBuildingIcon = this.addElement_ConstructibleIcon(item);
					plotTooltipSubContainer.appendChild(toolTipBuildingIcon);
					
					// Building String
					const plotTooltipBuildingElement = document.createElement("div");
					[
						['margin-left', '0.15rem'],
						['margin-right', '0.15rem'],
						['flex-direction', 'column'],
						['align-content', 'flex-start'],
						//['background-color', 'rgb(0, 114, 23)'], //debugging
					].forEach(p => {
						plotTooltipBuildingElement?.style.setProperty(p[0], p[1]);
					});
					
					// Modify building name to fit better when displayed as row
					const itemName = (this.isShowingBuildingsAsRow == true && Locale.compose(item.Name).length > 12) ? Locale.compose(item.Name).replaceAll('-', ' ') : Locale.compose(item.Name);
					const plotTooltipBuildingString = this.addElement_Text(itemName, [
						['font-weight', 'bold']
					]);
					if (buildings.length > 1 && this.isShowingBuildingsAsRow == true) {
						plotTooltipBuildingString?.style.setProperty('max-width', '6rem');
						plotTooltipBuildingString?.style.setProperty('overflow-wrap', 'break-word');
					}
					else {plotTooltipBuildingString?.style.removeProperty('width');}
					if (this.isShowingBuildingsAsRow == true && buildings.length > 1  && itemName.length > 12 && (itemName == itemName.replaceAll(' ', ''))) {plotTooltipBuildingString.classList.add('text-2xs');}
					else {plotTooltipBuildingString.classList.add('text-xs');}
					plotTooltipBuildingElement.appendChild(plotTooltipBuildingString);
					
					if (itemTags.length > 0) {
						const plotTooltipPropertyString = this.addConstructibleTag(itemTags.join(" " + TCS_DIVIDER_DOT + " "));
						if (buildings.length > 1 && this.isShowingBuildingsAsRow == true) {plotTooltipPropertyString?.style.setProperty('max-width', '6rem');}
						plotTooltipBuildingElement.appendChild(plotTooltipPropertyString);	
					}
					plotTooltipSubContainer.appendChild(plotTooltipBuildingElement);
					plotTooltipBuildingSubcontainer.appendChild(plotTooltipSubContainer);
				});
				this.container.appendChild(plotTooltipBuildingsContainer);
			}
			
			// Wonders
			if (wonders.length > 0) {
				wonders.sort((a,b) => (a.Name > b.Name) ? 1 : ((b.Name > a.Name) ? -1 : 0));		
				wonders.forEach((item) => {         
					const itemTags = [];
					if (item.Damaged) {itemTags.push(Locale.compose("LOC_PLOT_TOOLTIP_DAMAGED"));}
					else if (!item.Completed) {itemTags.push(Locale.compose("LOC_PLOT_TOOLTIP_IN_PROGRESS"));}

					// Add status
					if (itemTags.length > 0) {
						const tooltipBuildingStatus = document.createElement("div");
						tooltipBuildingStatus.classList.add("plot-tooltip__building-status");
						tooltipBuildingStatus.innerHTML = itemTags.join(" " + TCS_DIVIDER_DOT + " ");
						this.container.appendChild(tooltipBuildingStatus);
					}			
					
					// Add icon and description	
					const toolTipWonderContainer = this.addElement_SectionContainer();	
					const tooltipWonderSubcontainer = this.addElement_SectionContainer(
						[
							['justify-content', 'center'],
							['align-content', 'flex-start'],
							['padding-left', '0.5rem']
						]);		
					const toolTipWonderLargeIcon = this.addElement_ConstructibleIcon(item);					
					const toolTipWonderDescription = this.addElement_Text(item.Tooltip, [
						['max-width', '14rem'],
						['font-size', 'calc(1rem + -0.2222222222rem)'],
						['line-height', '1rem']
					]);

					tooltipWonderSubcontainer.appendChild(toolTipWonderLargeIcon);
					tooltipWonderSubcontainer.appendChild(toolTipWonderDescription);
					toolTipWonderContainer.appendChild(tooltipWonderSubcontainer);
					this.container.appendChild(toolTipWonderContainer);
				});
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
						const defensiveConstructibles = [];
						if (walls.length > 0) {
							for (const wall of walls) {
								if (wall.Info.ConstructibleType == "BUILDING_DEFENSIVE_FORTIFICATIONS" ) {
									defensiveConstructibles.push(wall.Name);
									break;
								}
								else if (wall.Info.ConstructibleType == "BUILDING_MEDIEVAL_WALLS" ) {
									defensiveConstructibles.push(wall.Name);
									break;
								}
								else if (wall.Info.ConstructibleType == "BUILDING_ANCIENT_WALLS" ) {
									defensiveConstructibles.push(wall.Name);
									break;
								}
							}
						}
						// Check for other defensive buildings or wonders
						for (const item of buildings) {
							if (item.Defensive) {
								defensiveConstructibles.push(item.Name);
							}
						}
						for (const item of wonders) {
							if (item.Defensive) {
								defensiveConstructibles.push(item.Name);
							}
						}
						// Concatenate wall name with other defensive structures
						const allFortificationNames = defensiveConstructibles.join(" " + TCS_DIVIDER_DOT + " ");			
						
						// Build Fortification tooltip
						if (isFortified || isDamaged) {

							const fortificationInfo = document.createElement("div");
							[
								['position', 'relative'],
								['display', 'flex'],
								['flex-direction', 'row'],
								['justify-content', 'center'],
								['align-content', 'center'],
							].forEach(p => {
								fortificationInfo?.style.setProperty(p[0], p[1]);
							});

							// Add warning banner styling if under siege or recovering
							if (isUnderSiege || isHealing) {
								TCS_WARNING_BANNER_PROPERTIES.forEach(p => {
									fortificationInfo?.style.setProperty(p[0], p[1]);
								});
								
								const siegeTitle = document.createElement("div");
								siegeTitle.classList.add("plot-tooltip__district-title", "plot-tooltip__lineThree");
								siegeTitle.innerHTML = (isUnderSiege) ? Locale.compose("LOC_PLOT_TOOLTIP_UNDER_SIEGE") : Locale.compose("LOC_PLOT_TOOLTIP_HEALING_DISTRICT");
								fortificationInfo.appendChild(siegeTitle);
							}
							
							// Icon + String subcontainer
							const subContainer = document.createElement("div");
							[['display', 'flex'],['flex-direction', 'row']].forEach(p => {
								subContainer?.style.setProperty(p[0], p[1]);
							});
							if (isUnderSiege || isHealing) {subContainer?.style.setProperty('justify-content', 'center');}
							else {subContainer?.style.setProperty('justify-content', 'flex-start');}

							// Fortification Icon and shadow
							const fortificationIconShadow = this.addElement_IconWithShadow(TCS_ICON_FORTIFICATION, TCS_ICON_PROPERTIES_DEFAULT.concat([
								['width', TCS_ICON_SIZE_SMALL],
								['height', TCS_ICON_SIZE_SMALL],
								['margin-right', TCS_ICON_MARGIN_RIGHT_SMALL],
								['margin-top', '0.1rem'],
							]));
						
							// Text
							const fortificationText = document.createElement("div");
							fortificationText.classList.add('text-2xs');
							if (isUnderSiege || isHealing) {fortificationText?.style.setProperty('color', TCS_WARNING_TEXT_COLOR);}
							if (!isDamaged) {
								if (allFortificationNames) {fortificationText.setAttribute('data-l10n-id', allFortificationNames + " " + TCS_DIVIDER_DOT + " " + maxHealth);}
								else {fortificationText.setAttribute('data-l10n-id', maxHealth);}
							}
							else {
								if (allFortificationNames) {fortificationText.setAttribute('data-l10n-id', allFortificationNames + " " + TCS_DIVIDER_DOT + " " + currentHealth + "/" + maxHealth);}
								else {fortificationText.setAttribute('data-l10n-id', currentHealth + "/" + maxHealth);}
							}

							// Health Icon and shadow
							const healthIconShadow = this.addElement_IconWithShadow(TCS_ICON_HEALTH, TCS_ICON_PROPERTIES_DEFAULT.concat([
								['width', TCS_ICON_SIZE_SMALL],
								['height', TCS_ICON_SIZE_SMALL],
								['margin-left', TCS_ICON_MARGIN_RIGHT_SMALL],
								['margin-top', '0.1rem']
							]));

							// Build tooltip section
							subContainer.appendChild(fortificationIconShadow);
							subContainer.appendChild(fortificationText);
							subContainer.appendChild(healthIconShadow);
							fortificationInfo.appendChild(subContainer);
							this.container.appendChild(fortificationInfo);
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
			this.container.appendChild(this.addElement_Title(Locale.compose("LOC_PLOT_MOD_TCS_UNITS")));
			
			// Build Elements: Unit
			let plotUnits = plotObject.Units;
			const unitContainer = document.createElement("div");
			for (let i = 0; i < plotUnits.length && i < 4; i++) {
				let plotUnit = Units.get(plotUnits[i]);
				let unitName = Locale.compose(plotUnit.name);
				const unitDefinition = GameInfo.Units.lookup(plotUnit.type);
				player = Players.get(plotUnit.owner);
				const toolTipUnitInfo = document.createElement("div");
				if (player.id != localPlayerID && i == 0) {
					const playerDiplomacy = player?.Diplomacy;
					if (playerDiplomacy.isAtWarWith(localPlayerID)) {
						TCS_WARNING_BANNER_PROPERTIES.forEach(p => {
							unitContainer?.style.setProperty(p[0], p[1]);
						});
					}
				}
				toolTipUnitInfo.classList.add('text-center',"plot-tooltip__unitInfo");
				if (player.id == localPlayerID) {
					toolTipUnitInfo.innerHTML = Locale.stylize("LOC_PLOT_MOD_TCS_TOP_UNIT", "[icon:" + unitDefinition.UnitType + "] " + unitName, Locale.compose("LOC_PLOT_MOD_TCS_YOURS"));
				}
				else {
					toolTipUnitInfo.innerHTML = Locale.stylize("LOC_PLOT_MOD_TCS_TOP_UNIT", "[icon:" + unitDefinition.UnitType + "] " + unitName, Locale.compose(player.name));
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
			const city = plotObject.City;
			let isDistantLands = false;

			// Title line
			if (continentName || routeName || plotEffectNames) {this.container.appendChild(this.addElement_Title(Locale.compose("LOC_PLOT_MOD_TCS_MORE_INFO")));}
			
			// Continent & Route
			if (continentName) {
				if (localPlayer != null && localPlayer.isDistantLands(plotObject.coordinate)) {isDistantLands = true;}			
				if (continentName && isDistantLands) {continentName = continentName + " " + Locale.compose("LOC_PLOT_MOD_TCS_DISTANT_LANDS");}

				// Add Fresh Water info
				let lastLineLabel;
				if (GameplayMap.isFreshWater(plotObject.x, plotObject.y)) {
					lastLineLabel = (routeName) ? (continentName + " " + TCS_DIVIDER_DOT + " " + routeName + " " + TCS_DIVIDER_DOT + " " + Locale.compose("LOC_PLOT_MOD_TCS_FRESH_WATER")) : (continentName + " " + TCS_DIVIDER_DOT + " " + Locale.compose("LOC_PLOT_MOD_TCS_FRESH_WATER"));
				}
				else {
					lastLineLabel = (routeName) ? (continentName + " " + TCS_DIVIDER_DOT + " " + routeName) : continentName;
				}
				const tooltipLastLine = this.addElement_Text(lastLineLabel);
				tooltipLastLine.classList.add('text-2xs', 'text-center');
				this.container.appendChild(tooltipLastLine);
			}
	
			// Plot Effects
			if (plotEffectNames) {
				const toolTipPlotEffectsText = this.addElement_Text(plotEffectNames);
				toolTipPlotEffectsText.classList.add('text-2xs', 'text-center');
				this.container.appendChild(toolTipPlotEffectsText);
			}
			
			// Original Owner
			if (city && city.owner != city.originalOwner && plotObject.District && plotObject.District.type == DistrictTypes.CITY_CENTER) {
				const originalOwnerPlayer = Players.get(city.originalOwner);
				const toolTipOriginalOwner = this.addElement_Text(Locale.compose("LOC_PLOT_MOD_TCS_ORIGINAL_FOUNDER", originalOwnerPlayer.name));
				toolTipOriginalOwner.classList.add('text-2xs', 'text-center');
				this.container.appendChild(toolTipOriginalOwner);
			}

			// Config Option: XY
			if (this.isShowingCoordinates == true) {
				const toolTipCoordinates = this.addElement_Text(Locale.compose("LOC_PLOT_MOD_TCS_COORDINATES", plotObject.x, plotObject.y));
				toolTipCoordinates.classList.add('text-2xs', 'text-center');
				this.container.appendChild(toolTipCoordinates);
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
			let townFocus;
			let townFoodYield; //not using this for anything, but it's the net food sent from a Specialized Town to each connected City
			const tradeRoutes = [];
			const connectedSettlementNames = [];
			const citiesReceivingFood = [];
			const city = plotObject.City;
			if (city) {			
				cityLabel = Locale.compose("LOC_PLOT_MOD_TCS_CITY", Locale.compose(city.name));
				if (city.isTown) {cityLabel = Locale.stylize("LOC_PLOT_MOD_TCS_TOWN", Locale.compose(city.name));}
				else {cityLabel = Locale.stylize("LOC_PLOT_MOD_TCS_CITY", Locale.compose(city.name));}
				
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
					if (city.Growth?.growthType == GrowthTypes.EXPAND) {townFocus = "GROWING";}
					else {townFocus = "SPECIALIZED";}
					
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
			}
			
			// Get relationship label (relationshipLabel)
			let relationshipLabel;
			if (this.isShowingPlayerRelationship == true && owningPlayer && owningPlayerID && owningPlayerID != localPlayerID) {
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
				if (cityLabel) {this.container.appendChild(this.addElement_Title(cityLabel));}
				else {this.container.appendChild(this.addElement_Title(civLabel));}
				
				// Player & Civ
				if (civLabel) {
					const ownerLeaderText = (relationshipLabel) ? (playerLabel + " " + relationshipLabel) : playerLabel;
					const plotTooltipOwnerLeader = this.addElement_Text(ownerLeaderText, [['text-align', 'center']], true);
					this.container.appendChild(plotTooltipOwnerLeader);
					
					if (!owningPlayer.isIndependent) {
						let ownerCivText;
						if (tradeRoutes.length == 2 && plotIsCityCenter && !owningPlayerDiplomacy.isAtWarWith(localPlayerID)) {
							const tradeString = TCS_ICON_TRADE_ROUTES + " " + tradeRoutes[0] + "/" + tradeRoutes[1];
							ownerCivText = civLabel + " " + tradeString;
						}
						else {ownerCivText = civLabel;}
						const plotTooltipOwnerCiv = this.addElement_Text(ownerCivText, TCS_TEXT_DEFAULT_CENTER);
						this.container.appendChild(plotTooltipOwnerCiv);
					}
				}
				
				// Additional info for local player
				if (localPlayerID == owningPlayerID) {
					// Town Focus
					if (plotIsCityCenter) {			
						if (townFocus) {
							const townFocusString = (townFocus == "GROWING") ? Locale.compose("LOC_PLOT_MOD_TCS_TOWN_GROWING") : Locale.compose("LOC_PLOT_MOD_TCS_TOWN_SPECIALIZED");
							let tooltipTownFocusString = townFocusString;
							if (townFocus != "GROWING") {
								tooltipTownFocusString = (citiesReceivingFood.length == 1) ? (townFocusString + " " + TCS_DIVIDER_DOT + " " + Locale.compose("LOC_PLOT_MOD_TCS_TOWN_FEEDING_SINGULAR")) : (townFocusString + " " + TCS_DIVIDER_DOT + " " + Locale.compose("LOC_PLOT_MOD_TCS_TOWN_FEEDING_PLURAL", citiesReceivingFood.length));
							}
							else {
								tooltipTownFocusString = townFocusString;
							}
							const plotTooltipTownFocus = this.addElement_Text(tooltipTownFocusString);
							plotTooltipTownFocus.classList.add('text-2xs', 'text-center');
							this.container.appendChild(plotTooltipTownFocus);
						}
					}
					
					// Flag if city is not in trade network
					if (city && !city.Trade.isInTradeNetwork()) {
						const toolTipNotInTradeNetwork = this.addElement_Text(Locale.compose("LOC_PLOT_MOD_TCS_NOT_IN_TRADE_NETWORK"), [
							['text-align','center'],
							['color', TCS_WARNING_TEXT_COLOR]
						], true);
						TCS_WARNING_BANNER_PROPERTIES.forEach(p => {
							toolTipNotInTradeNetwork?.style.setProperty(p[0], p[1]);
						});
						this.container.appendChild(toolTipNotInTradeNetwork);
					}
					
					// Connections - shown when hovering over city center
					if (connectedSettlementNames.length > 0 && plotIsCityCenter) {
						const plotTooltipConnectionsHeader = this.addElement_Text("LOC_PLOT_MOD_TCS_CONNECTED",[
							['text-align', 'center'],
							['font-weight', 'bold']
						], true);
						plotTooltipConnectionsHeader.classList.add('text-2xs');
						this.container.appendChild(plotTooltipConnectionsHeader);
						
						const plotTooltipConnectionsContainer = this.addElement_SectionContainer([
							['justify-content', 'center'],
							['align-content', 'center'],
							['flex-wrap', 'wrap'],
							['width', '100%'],
							['padding-right', '0.25rem'],
							['padding-left', '0.25rem'],
							['padding-bottom', '0.25rem']
						]);
						
						for (const settlementName of connectedSettlementNames) {
							const plotTooltipConnectionsElement = this.addElement_Text(settlementName, [
								['text-align', 'left'],
								['margin-right', '0.5rem'],
								['max-height', '1.5rem']
							], true);
							plotTooltipConnectionsElement.classList.add('text-2xs');
							plotTooltipConnectionsContainer.appendChild(plotTooltipConnectionsElement);
						}
						
						this.container.appendChild(plotTooltipConnectionsContainer);
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
			if (this.isShowingDebug == true) {
				const tooltipDebugFlexbox = document.createElement("div");
				tooltipDebugFlexbox.classList.add("plot-tooltip__debug-flexbox", "text-2xs", "text-center");

				const toolTipDebugTitle = this.addElement_Title("LOC_PLOT_TOOLTIP_DEBUG_TITLE");

				tooltipDebugFlexbox.appendChild(this.addElement_Text('XY: ' + plotObject.x + ', ' + plotObject.y));
				tooltipDebugFlexbox.appendChild(this.addElement_Text('PlotIndex: ' + plotObject.PlotIndex));
				if (plotObject.Biome) {tooltipDebugFlexbox.appendChild(this.addElement_Text('Biome: ' + plotObject.Biome.BiomeType));}
				tooltipDebugFlexbox.appendChild(this.addElement_Text('Terrain: ' + plotObject.Terrain.TerrainType));
				if (plotObject.Terrain) {
					if (plotObject.Terrain.TerrainType == "TERRAIN_COAST" && GameplayMap.isLake(plotObject.x, plotObject.y)) {
							tooltipDebugFlexbox.appendChild(this.addElement_Text('Lake: true'));
					}
				}
				if (plotObject.Feature) {tooltipDebugFlexbox.appendChild(this.addElement_Text('Feature: ' + plotObject.Feature.FeatureType));}
				if (plotObject.RiverType > -1) {tooltipDebugFlexbox.appendChild(this.addElement_Text('RiverType: ' + ((plotObject.RiverType == RiverTypes.RIVER_NAVIGABLE) ? 'RiverTypes.RIVER_NAVIGABLE' : 'RiverTypes.RIVER_MINOR')));}
				if (plotObject.Resource) {tooltipDebugFlexbox.appendChild(this.addElement_Text('Resource: ' + plotObject.Resource.ResourceType));}
				if (plotObject.OwningPlayerID) {tooltipDebugFlexbox.appendChild(this.addElement_Text('OwningPlayerID: ' + plotObject.OwningPlayerID));}
				if (plotObject.OwningPlayer) {tooltipDebugFlexbox.appendChild(this.addElement_Text('OwningPlayer: ' + plotObject.OwningPlayer.name));}
				//tooltipDebugFlexbox.appendChild(this.addElement_Text('LocalPlayer: ' + plotObject.LocalPlayer.name));
				if (plotObject.District) {
					if (plotObject.District.type == DistrictTypes.RURAL) {tooltipDebugFlexbox.appendChild(this.addElement_Text('District.type: DistrictTypes.RURAL'));}
					else if (plotObject.District.type == DistrictTypes.URBAN) {tooltipDebugFlexbox.appendChild(this.addElement_Text('District.type: DistrictTypes.URBAN'));}
					else if (plotObject.District.type == DistrictTypes.CITY_CENTER) {tooltipDebugFlexbox.appendChild(this.addElement_Text('District.type: DistrictTypes.CITY_CENTER'));}
					else if (plotObject.District.type == DistrictTypes.WONDER) {tooltipDebugFlexbox.appendChild(this.addElement_Text('District.type: DistrictTypes.WONDER'));}
					else {tooltipDebugFlexbox.appendChild(this.addElement_Text('District.type: none'));}
				}
				if (plotObject.City) {tooltipDebugFlexbox.appendChild(this.addElement_Text('City: ' + plotObject.City.name));}
				//tooltipDebugFlexbox.appendChild(this.addElement_Text('Unit Count: ' + plotObject.Units.length));
				//tooltipDebugFlexbox.appendChild(this.addElement_Text('Constructible Count: ' + plotObject.Constructibles.length));
				if (plotObject.PotentialImprovements.length > 0) {
					plotObject.PotentialImprovements.forEach(i => {
						tooltipDebugFlexbox.appendChild(this.addElement_Text('PotentialImprovement: ' + i.ConstructibleType));
					});
					
				}
				
				this.container.appendChild(toolTipDebugTitle);
				this.container.appendChild(tooltipDebugFlexbox);
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
			const localPlayerCivType = GameInfo.Civilizations.lookup(localPlayer.civilizationType).CivilizationType;
			const localPlayerCivTraits = []; // Populated with TraitTypes just below
			GameInfo.CivilizationTraits.filter(t => t.CivilizationType == localPlayerCivType).forEach(t => {
				localPlayerCivTraits.push(t.TraitType);
			});
			
			// Get owning player info
			const owningPlayerID = GameplayMap.getOwner(plotCoordinate.x, plotCoordinate.y);
			const owningPlayer = Players.get(owningPlayerID);
			const owningPlayerDiplomacy = (localPlayerID != owningPlayerID && owningPlayer) ? owningPlayer?.Diplomacy : undefined;
			const owningPlayerDistricts = (owningPlayer) ? Players.Districts.get(owningPlayerID) : undefined;
			
			// Get district info
			const districtId = (owningPlayer) ? MapCities.getDistrict(plotCoordinate.x, plotCoordinate.y) : undefined;
			const district = (districtId) ? Districts.get(districtId) : undefined;
			
			// Get plot settlement info
			const owningCityID = (owningPlayer) ? GameplayMap.getOwningCityFromXY(plotCoordinate.x, plotCoordinate.y) : undefined;
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

				// Get local player unique improvements - we will check if it is a valid potential improvement later
				const localPlayerUniqueImprovements = GameInfo.Improvements.filter(i => localPlayerCivTraits.includes(i.TraitType));
				const addedImprovementTypes = [];

				if (resource && potentialImprovements.length == 0) {
					// Get "default" improvement for tile
					const infos = GameInfo.District_FreeConstructibles.filter(item => (item.ResourceType && item.ResourceType == resource.ResourceType));
					if (infos) {
						for (const info of infos) {
							const constructible = GameInfo.Constructibles.find(item => (item.ConstructibleType == info.ConstructibleType));
							if (!addedImprovementTypes.includes(constructible.ConstructibleType) && (!constructible.Age || Database.makeHash(constructible?.Age ?? "") == Game.age)) {
								potentialImprovements.push(constructible);
								addedImprovementTypes.push(constructible.ConstructibleType);
							}
						}
					}	
				}
				if (feature && potentialImprovements.length == 0) {
					// Get "default" improvement for tile
					const infos = GameInfo.District_FreeConstructibles.filter(item => (item.FeatureType == feature.FeatureType));
					if (infos) {
						for (const info of infos) {
							const constructible = GameInfo.Constructibles.find(item => (item.ConstructibleType == info.ConstructibleType));
							if (!addedImprovementTypes.includes(constructible.ConstructibleType) && (!constructible.Age || Database.makeHash(constructible?.Age ?? "") == Game.age)) {
								potentialImprovements.push(constructible);
								addedImprovementTypes.push(constructible.ConstructibleType);
							}
						}
					}
				}
				if (riverType && riverType == RiverTypes.RIVER_NAVIGABLE && potentialImprovements.length == 0) {
					// Get "default" improvement for tile
					const infos = GameInfo.District_FreeConstructibles.filter(item => (item.RiverType == "RIVER_NAVIGABLE"));
					if (infos) {
						for (const info of infos) {
							const constructible = GameInfo.Constructibles.find(item => (item.ConstructibleType == info.ConstructibleType));
							if (!addedImprovementTypes.includes(constructible.ConstructibleType) && (!constructible.Age || Database.makeHash(constructible?.Age ?? "") == Game.age)) {
								potentialImprovements.push(constructible);
								addedImprovementTypes.push(constructible.ConstructibleType);
							}
						}
					}
				}
				if (terrain && potentialImprovements.length == 0) {
					// Get "default" improvement for tile
					const infos = GameInfo.District_FreeConstructibles.filter(item => (item.TerrainType == terrain.TerrainType));
					if (infos) {
						for (const info of infos) {
							const constructible = GameInfo.Constructibles.find(item => (item.ConstructibleType == info.ConstructibleType));
							if (!addedImprovementTypes.includes(constructible.ConstructibleType) && (!constructible.Age || Database.makeHash(constructible?.Age ?? "") == Game.age)) {
								potentialImprovements.push(constructible);
								addedImprovementTypes.push(constructible.ConstructibleType);
							}
						}
					}	
				}

				// Get civ unique improvement for this tile
				if (localPlayerUniqueImprovements) {
					localPlayerUniqueImprovements.forEach(i => {
						const validTerrains = GameInfo.Constructible_ValidTerrains.filter(c => c.ConstructibleType == i.ConstructibleType);
						const validFeatures = GameInfo.Constructible_ValidFeatures.filter(c => c.ConstructibleType == i.ConstructibleType);
						const validResources = GameInfo.Constructible_ValidResources.filter(c => c.ConstructibleType == i.ConstructibleType);
						if (resource && validResources) {
							for (const r of validResources) {
								if (!addedImprovementTypes.includes(i.ConstructibleType) && r.ResourceType == resource.ResourceType) {
									const constructible = GameInfo.Constructibles.find(item => (item.ConstructibleType == i.ConstructibleType));
									potentialImprovements.push(constructible);
									addedImprovementTypes.push(construitible.ConstructibleType);
									break;
								}
							}
						}
						else if (feature && validFeatures) {
							for (const f of validFeatures) {
								if (!addedImprovementTypes.includes(i.ConstructibleType) && f.FeatureType == feature.FeatureType) {
									const constructible = GameInfo.Constructibles.find(item => (item.ConstructibleType == i.ConstructibleType));
									potentialImprovements.push(constructible);
									addedImprovementTypes.push(i.ConstructibleType);
									break;
								}
							}
						}
						else if (terrain && !resource) {
							if (validTerrains) {
								for (const t of validTerrains) {
									if (!addedImprovementTypes.includes(i.ConstructibleType) && t.TerrainType == terrain.TerrainType) {
										const constructible = GameInfo.Constructibles.find(item => (item.ConstructibleType == i.ConstructibleType));
										potentialImprovements.push(constructible);
										addedImprovementTypes.push(i.ConstructibleType);
										break;
									}
								}
							}	
						}
					});
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
				else {featureLabel = Locale.compose(feature.Name);}
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
			if (!districtId) {return null;}
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
			else {return null;}
		}
		
		//---------------------
		// Label Queries
		//---------------------
		getBiomeLabel(plotObject) {
			const biome = plotObject.Biome;
			// Do not show a label if marine biome.
			if (biome && biome.BiomeType != "BIOME_MARINE") {
				return biome.Name;
			}
			else {return "";}
		}
		getTerrainLabel(plotObject) {
			const terrain = plotObject.Terrain;
			if (terrain) {
				// despite being "coast" this is a check for a lake
				if (terrain.TerrainType == "TERRAIN_COAST" && GameplayMap.isLake(plotObject.x, plotObject.y)) {return "LOC_TERRAIN_LAKE_NAME";}
				return terrain.Name;
			}
			else {return "";}
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
			else {return "";}
		}
		getContinentName(location) {
			const continentType = GameplayMap.getContinentType(location.x, location.y);
			const continent = GameInfo.Continents.lookup(continentType);
			if (continent && continent.Description) {return Locale.compose(continent.Description);}
			else {return "";}
		}
		getRouteName(plotObject) {
			const routeType = GameplayMap.getRouteType(plotObject.x, plotObject.y);
			const route = GameInfo.Routes.lookup(routeType);
			const isFerry = GameplayMap.isFerry(plotObject.x, plotObject.y);
			let returnString = "";
			if (route) {
				if (isFerry) {returnString = Locale.compose(route.Name) + " " + TCS_DIVIDER_DOT + " " + Locale.compose("LOC_NAVIGABLE_RIVER_FERRY");}
				else {returnString = Locale.compose(route.Name);}
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
							if (!effectString) {effectString = Locale.compose(effectInfo.Name);}
							else {effectString = effectString + " " + TCS_DIVIDER_DOT + " " + Locale.compose(effectInfo.Name);}					
						}
					});
					return effectString;
				}
				return false;
			}
			return false;
		}
		
		//---------------------
		// CSS Utilities
		//---------------------
		addElement_Text(text, properties=[], innerHTML=false) {
			const textElement = document.createElement("div");
			if (innerHTML == true) {textElement.innerHTML = Locale.stylize(text);}
			else {textElement.setAttribute('data-l10n-id', text);}
			//properties.push(['overflow-wrap', 'break-word']);
			properties.forEach(p => {
				textElement?.style.setProperty(p[0], p[1]);
			});
			return textElement;
		}

		addElement_SectionContainer(properties=[], direction='row') {
			const containerElement = document.createElement("div");
			if (direction == 'row') {properties.push(['flex-direction', 'row']);}
			else {properties.push(['flex-direction', 'column']);}
			TCS_SECTION_CONTAINER_PROPERTIES.forEach(p => {
				containerElement?.style.setProperty(p[0], p[1]);
			});
			properties.forEach(p => {
				containerElement?.style.setProperty(p[0], p[1]);
			});
			return containerElement;
		}

		addElement_Title(text) {
			// Container Element
			const containerElement = document.createElement("div");
			TCS_TITLE_CONTAINER_PROPERTIES.forEach(p => {
				containerElement?.style.setProperty(p[0], p[1]);
			});
	
			// Left Element
			const leftElement = document.createElement("div");
			TCS_TITLE_LINE_LEFT.forEach(p => {
				leftElement?.style.setProperty(p[0], p[1]);
			});
			
			// Middle Element
			const textElement = this.addElement_Text(text, TCS_TITLE_LINE_TEXT, true);
			
			// Right Element
			const rightElement = document.createElement("div");
			TCS_TITLE_LINE_RIGHT.forEach(p => {
				rightElement?.style.setProperty(p[0], p[1]);
			});
	
			containerElement.appendChild(leftElement);
			containerElement.appendChild(textElement);
			containerElement.appendChild(rightElement);
			return containerElement;
		}

		addElement_Icon(iconCSS, properties=[]) {
			const iconElement = document.createElement("div");
			properties.forEach(p => {
				iconElement?.style.setProperty(p[0], p[1]);
			});
			iconElement.style.backgroundImage = iconCSS;
			return iconElement;
		}
	
		addElement_IconWithShadow(iconCSS, properties=[]) {
			/* 
				properties should include the following in addition to TCS_ICON_PROPERTIES_DEFAULT:
					height
					width
					margin-right
			*/
			const shadowElement = document.createElement("div");
			properties.forEach(p => {
				shadowElement?.style.setProperty(p[0], p[1]);
			});
			shadowElement?.style.setProperty('transform', TCS_ICON_SHADOW_TRANSFORM);
			shadowElement?.style.setProperty('fxs-background-image-tint', TCS_ICON_SHADOW_TINT);
			shadowElement.style.backgroundImage = iconCSS;
	
			const extraProperties = [
				['transform', TCS_ICON_TRANSFORM]
			];
			properties.forEach(p => {if (p[0] == 'height' || p[0] == 'width') {extraProperties.push(p);}});
			const iconElement = this.addElement_Icon(iconCSS, TCS_ICON_PROPERTIES_DEFAULT.concat(extraProperties));
			shadowElement.appendChild(iconElement);
			return shadowElement;
		}

		
		addElement_ConstructibleIcon(item, properties=[]) {
			let constructibleIconCSS;
			let size = TCS_ICON_SIZE_DEFAULT;
			let marginRight = TCS_ICON_MARGIN_RIGHT_DEFAULT;
			const constructibleType = (item.Info) ? item.Info.ConstructibleType : item.ConstructibleType;
			if (constructibleType.startsWith("BUILDING")) {
				constructibleIconCSS = UI.getIconCSS(constructibleType, "CONSTRUCTIBLE");
			}
			else if (constructibleType.startsWith("IMPROVEMENT")) {
				if (TCS_CONSTRUCTIBLES_MISSING_ICONS.includes(constructibleType)) {constructibleIconCSS = UI.getIconCSS(TCS_FALLBACK_CONSTRUCTIBLE, "CONSTRUCTIBLE");}
				else {constructibleIconCSS = UI.getIconCSS(constructibleType, "CONSTRUCTIBLE");}
				if (!constructibleIconCSS) {constructibleIconCSS = UI.getIconCSS(TCS_FALLBACK_CONSTRUCTIBLE_DISCOVERY, "CONSTRUCTIBLE");} //further fallback, mostly for discoverables without icons
				size = TCS_ICON_SIZE_MEDIUM;
			}
			else if (constructibleType.startsWith("WONDER")) {
				constructibleIconCSS = UI.getIconCSS(constructibleType, "CONSTRUCTIBLE");
				size = TCS_ICON_SIZE_LARGE;
				marginRight = TCS_ICON_MARGIN_RIGHT_LARGE;
			}	
			if (!constructibleIconCSS) {return;}
			
			// Extra Properties
			const extraProperties = [
				['height', size],
				['width', size],
				['margin-right', marginRight]
			].concat(properties);
			const constructibleIconShadow = this.addElement_IconWithShadow(constructibleIconCSS, TCS_ICON_PROPERTIES_DEFAULT.concat(extraProperties));
			return constructibleIconShadow;
		}

		addConstructibleTag(text) {
			const textElement = this.addElement_Text(text);
			textElement.classList.add('text-2xs', 'text-left', 'font-body-sm');
			return textElement;
		}

		//---------------------
		// Miscellaneous
		//---------------------
		// Update config settings
		queueUpdate() {
			if (this.updateQueued)
				return;
			this.updateQueued = true;
			const self = this;
			requestAnimationFrame(() => {
				self.updateTooltipConfig();
				self.updateQueued = false;
			});
		}
		updateTooltipConfig() {
			this.isShowingPotentialImprovement = (TCS_ShowPotentialImprovement.Option == true) ? true : false;
			this.isShowingQuarterDescription = (TCS_ShowQuarterDescription.Option == true) ? true : false;
			this.isShowingBuildingsAsRow = (TCS_BuildingFlexDisplayMode.Option == true) ? true : false;
			//const CONFIG_TCS_BUILDING_TAGS_DISPLAY_MODE = 'TEXT'; // 'TEXT' or 'ICONS', doesn't actually do anything yet
			this.isShowingPlayerRelationship = (TCS_ShowPlayerRelationship.Option == true) ? true : false;
			this.isShowingCoordinates = (TCS_ShowCoordinates.Option == true) ? true : false;
			this.isShowingDebug = (TCS_EnableDebugMode.Option == true) ? true : false;
		}

		// Unsure if this is still needed...?? Unused
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
	