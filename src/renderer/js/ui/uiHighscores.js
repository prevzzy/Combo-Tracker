import {
  APP_CONFIG_VALUES,
  ERROR_STRINGS,
} from '../utils/constants'
import {
  formatTimestamp,
  formatScore,
  formatBalancePropertyTime,
  getNumberWithOrdinal,
  formatSecondsToHours,
} from '../utils/helpers'
import * as ComboSaver from '../combo/comboSaver'
import * as GlobalUI from './uiGlobal'
import * as SavedCombosService from '../combo/savedCombosService'
import * as LastComboUI from './lastCombo/uiLastCombo'
import * as MemoryController from '../game/memory'

const mapCategoriesMenu = document.getElementById('hs-map-categories-menu')
const mapNameElement = document.getElementById('hs-map')
const trackedCombosAmountElement = document.getElementById('hs-map-combos-tracked')
const mapTimeSpentElement = document.getElementById('hs-map-time-spent')
const highscoresContainerElement = document.getElementById('hs-scores-container')
const sideDrawerTrigger = document.getElementById('hs-side-drawer-trigger')

let activeCategoryElement = document.getElementById('hs-all-maps-category');

let activeMapData = {
  categoryIcon: null,
  mapIcon: null,
  mapName: null,
  categoryName: null,
}

const highscoreStatElementsConfig = {
  score: {
    selectors: ['.hs-acc-score'],
    isFormattableNumberProperty: true
  },
  basePoints: {
    selectors: ['.hs-acc-base'],
    isFormattableNumberProperty: true
  },
  multiplier: {
    selectors: ['.hs-acc-multiplier'],
  },
  comboTime: {
    selectors: ['.hs-acc-combo-time', '.hs-acc-details-combo-time'],
    isTimestamp: true
  },
  date: {
    selectors: ['.hs-acc-date']
  },
  grindTime: {
    selectors: ['.hs-acc-grind-time'],
    isBalanceProperty: true
  },
  manualTime: {
    selectors: ['.hs-acc-manual-time'],
    isBalanceProperty: true
  },
}

function initMapCategoriesMenu() {
  sideDrawerTrigger.addEventListener('click', changeSideDrawerVisibility)
  document.getElementById('hs-backdrop')
    .addEventListener('click', changeSideDrawerVisibility)
  
  const allMapCategories = SavedCombosService.getAllMapCategoriesData()
  
  if (!allMapCategories) {
    return
  }
  
  const allMaps = document.getElementById('hs-all-maps-category')

  allMaps.addEventListener('click', (e) => {
    activeCategoryElement = allMaps;
    handleHighscoresDisplay(undefined, undefined, true)
    
    handleOnMapClick(allMaps)
  })

  for (let mapCategory in allMapCategories) {
    mapCategoriesMenu.appendChild(createMapCategory(mapCategory, allMapCategories[mapCategory]))
  }

  refreshCurrentlyDisplayedHighscores();
}

function handleOnMapClick(activeMapButton) { 
  let activeMapCategoryElement = null

  activeMapButton.classList.add('active-map-category')

  if (activeMapButton.id !== 'hs-all-maps-category') {
    activeMapCategoryElement = activeMapButton.parentElement.previousElementSibling
    activeMapCategoryElement.classList.add('active-map-category')
    document.getElementById('hs-all-maps-category').classList.remove('active-map-category')
  }

  Array.from(mapCategoriesMenu.children).forEach((mapCollapseContainer) => {
    if (mapCollapseContainer.classList.contains('hs-map-acc-container')) {
      const mapElements = mapCollapseContainer.lastElementChild.children
      const mapCategoryElement = mapCollapseContainer.firstElementChild

      clearActiveCategoryDisplay(mapCategoryElement, mapElements, activeMapButton, activeMapCategoryElement)
    }
  })
}

function clearActiveCategoryDisplay(mapCategoryElement, mapElements, activeMapElement, activeMapCategoryElement) {
  for (let mapElement of mapElements) {
    if (mapElement !== activeMapElement) {
      mapElement.classList.remove('active-map-category')
    }
  }

  if (mapCategoryElement !== activeMapCategoryElement) {
    mapCategoryElement.classList.remove('active-map-category')
  }
}

function createMapCategory(mapCategory, maps) {
  const mapCategoryElement = GlobalUI.createElementFromTemplate('hs-menu-map-accordion-template')
  const mapsListElement = mapCategoryElement.querySelector('.list-group')

  const mapCategoryElementId = `${mapCategory.split(' ').shift()}MenuLink`
  mapsListElement.id = mapCategoryElementId

  mapCategoryElement.querySelector('.category-name').textContent = mapCategory
  
  populateMapCategory(mapsListElement, mapCategory, maps)
  setupCollapse(
    mapCategoryElement,
    '.hs-map-acc-container',
    '.hs-map-acc-trigger',
    '.hs-map-acc-collapse',
    '.hs-map-acc-chevron',
    mapCategoryElementId
  )

  return mapCategoryElement
}

function populateMapCategory(mapsListElement, mapCategory, maps) {
  const mapCategoryDisplayedName = mapCategory.split(' ').shift()

  mapsListElement.appendChild(
    createMapCategoryElement(mapCategory, undefined, `ALL ${mapCategoryDisplayedName} LEVELS`)
  )

  for (let mapScriptName in maps) {
    mapsListElement.appendChild(createMapCategoryElement(mapCategory, mapScriptName, maps[mapScriptName].name))
  }

  const gapElement = document.createElement('li')
  gapElement.className = 'list-group-item map-menu-item border-0 py-1'
  mapsListElement.appendChild(gapElement)

  return mapsListElement
}

function createMapCategoryElement(mapCategory, mapScriptName, text) {
  const element = document.createElement('li')
  element.className = 'list-group-item map-menu-item border-0 py-1'
  
  const textElement = document.createElement('span')
  textElement.textContent = text

  const container = document.createElement('div')
  container.classList.add('d-flex', 'align-items-center')
  container.appendChild(textElement)
  element.appendChild(container)

  element.addEventListener('click', (e) => {
    activeCategoryElement = element;
    handleHighscoresDisplay(mapCategory, mapScriptName, false)

    handleOnMapClick(element)
  })
  
  return element
}

function isScoresDataPresent(highscoresData) {
  return highscoresData && highscoresData.scores && highscoresData.scores.length
}

// gets scores for 'ALL [GAME] MAPS'
function getHighscoresDataForMapCategory(mapCategory) {
  const scoresArray = [];
  let combosTrackedTotal = 0;
  let timeSpentTotal = 0;
  const mapCategories = SavedCombosService.getMapCategoryData(mapCategory);

  if (mapCategories) {
    Object.keys(mapCategories).forEach((mapScriptName) => {
      const mapScores = mapCategories[mapScriptName].scores;
      const mapCombosTracked = mapCategories[mapScriptName].combosTracked;
      const timeSpent = mapCategories[mapScriptName].timeSpent;
 
      combosTrackedTotal += Number.isInteger(mapCombosTracked) ? mapCombosTracked : 0;
      timeSpentTotal += Number.isInteger(timeSpent) ? timeSpent : 0;
        
      for (let i = 0; i < mapScores.length; i++) {
        if (ComboSaver.isNewScoreWorthSaving(scoresArray, mapScores[i].score)) {
          const insertAt = ComboSaver.getIndexToInsertAtNewItemInSortedArray(
            scoresArray,
            mapScores[i],
            'score',
          );

          scoresArray.splice(insertAt, 0, mapScores[i])

          if (scoresArray.length > APP_CONFIG_VALUES.MAX_SCORES_PER_MAP) {
            scoresArray.pop()
          }
        } else {
          break; // score arrays are always sorted in descending order - no need to iterate further
        }
      }
    })
  }
  
  return {
    name: mapCategory,
    timeSpent: timeSpentTotal,
    combosTracked: combosTrackedTotal,
    scores: scoresArray,
  }
}

function handleHighscoresDisplay(mapCategory, mapScriptName, shouldDisplayAllMapsScores) {
  let highscoresData;
  highscoresContainerElement.parentElement.scrollTo(0, 0)

  if (mapCategory && !mapScriptName) {
    highscoresData = getHighscoresDataForMapCategory(mapCategory);
  } else {
    highscoresData = shouldDisplayAllMapsScores
      ? SavedCombosService.getAllMapsData(mapCategory, mapScriptName)
      : SavedCombosService.getMapData(mapCategory, mapScriptName)
  }

  highscoresContainerElement.innerHTML = null

  updateHighscoresTopInfo(highscoresData)

  if (isScoresDataPresent(highscoresData)) {
    updateHighscoresList(highscoresData.scores)
  }
}

function displayHighscoresContainerErrorText(text) {
  highscoresContainerElement.innerHTML = `
    <div class="h-100 d-flex justify-content-center align-items-center">
      <h4 class="mb-0">${text}</h4>
    </div>
  `
}

function updateHighscoresTopInfo(highscoresData) {
  mapNameElement.textContent = highscoresData && highscoresData.name || ERROR_STRINGS.UNKNOWN_MAP

  const hasTrackedCombos = highscoresData && highscoresData.hasOwnProperty('combosTracked')
  const hasSpentTime = highscoresData && highscoresData.hasOwnProperty('timeSpent')

  setAdditionalTopInfo(hasTrackedCombos, highscoresData && highscoresData.combosTracked, trackedCombosAmountElement)
  setAdditionalTopInfo(hasSpentTime, highscoresData && formatSecondsToHours(highscoresData.timeSpent), mapTimeSpentElement)

  if (!highscoresData) {
    displayHighscoresContainerErrorText('Data not found.')
    return
  }
  
  if (!isScoresDataPresent(highscoresData)) {
    displayHighscoresContainerErrorText(
      `No highscores ${mapNameElement.textContent === 'ALL MAPS' ? 'yet!' : 'on ' + mapNameElement.textContent + ' yet!'}`
    )
    return
  }
}

function setAdditionalTopInfo(isVisible, data, element) {
  if (isVisible) {
    element.style.display = 'initial'
    element.lastElementChild.textContent = data
  } else {
    element.style.display = 'none'
  }
}

function createNewHighscoreElement(comboData, standing) {
  const highscoreElement = GlobalUI.createElementFromTemplate('hs-accordion-template')
  
  const mapName = comboData.mapName || ERROR_STRINGS.UNKNOWN_MAP

  highscoreElement.querySelector('.hs-acc-standing').textContent = standing
  highscoreElement.querySelector('.hs-acc-map').textContent = mapName
  
  if (comboData.fullDataFileName) {
    highscoreElement.querySelector('.hs-acc-container').addEventListener('click', () =>
      LastComboUI.displayComboFromFile(comboData.fullDataFileName)
    )
  }

  drawHighscoreStats(highscoreElement, comboData)

  return highscoreElement;
}

function drawHighscoreStats(parentElement, stats) {
  for (const key in stats) {
    drawSingleHighscoreStat(
      parentElement,
      key,
      stats[key]
    )
  }
}

function updateHighscoresList(scores) {
  scores.forEach((comboData, i) => {
    const highscoreElement = createNewHighscoreElement(comboData, i + 1);
    highscoresContainerElement.appendChild(highscoreElement);
  })
}

function drawSingleHighscoreStat(parentElement, statName, value) {
  const statConfig = highscoreStatElementsConfig[statName]

  console.log(statName, value, statConfig)
  
  if (statConfig && statConfig.selectors) {
    statConfig.selectors.forEach((selector) => {
      const statElement = parentElement.querySelector(selector)
      
      if (statElement) {
        let formattedValue = value
        
        if (statConfig.colorPropertyConfig) {
          GlobalUI.colorComboPropertyText(
            statElement,
            value,
            statConfig.colorPropertyConfig.dangerThreshold,
            statConfig.colorPropertyConfig.warningThreshold
          )
        }
          
        if (statConfig.isFormattableNumberProperty) {
          formattedValue = formatScore(value)
        }
        
        if (statConfig.isTimestamp) {
          formattedValue = formatTimestamp(value)
        }
        
        if (statConfig.isBalanceProperty) {
          formattedValue = formatBalancePropertyTime(value, statConfig.shouldAddPrefix)
        }

        if (statConfig.shouldAddOrdinal) {
          formattedValue = getNumberWithOrdinal(value)
        }
          
        statElement.textContent = formattedValue
      }
    })
  }
}
    
function setupCollapse(parentElement, accordionContainerSelector, triggerSelector, collapseSelector, chevronSelector, uniqueId) {
  uniqueId = uniqueId.match(/[\d\w]+/g).join('');

  const accordionContainerElement = parentElement.querySelector(accordionContainerSelector)
  const triggerElement = parentElement.querySelector(triggerSelector)
  const collapseElement = parentElement.querySelector(collapseSelector)
  const chevronElement = parentElement.querySelector(chevronSelector)

  const accordionContainerId = `accordion-${uniqueId}`
  const collapseId = `collapse-${uniqueId}`
  const triggerId = `trigger-${uniqueId}`
  accordionContainerElement.id = accordionContainerId
  collapseElement.id = collapseId
  triggerElement.id = triggerId
  
  triggerElement.setAttribute('aria-controls', collapseId)
  triggerElement.setAttribute('data-target', `#${collapseId}`)
  
  collapseElement.setAttribute('aria-labelledby', triggerId)
  collapseElement.setAttribute('data-parent', `#${accordionContainerId}`)


  if (!chevronElement) {
    collapseElement.addEventListener('click', () => {
      $(`#${collapseId}`).collapse('hide')
    })

    return
  }

  $(function() {
    $(`#${accordionContainerId}`).on('hide.bs.collapse', () => {
      chevronElement.firstElementChild.textContent = 'chevron_right'
    })
    $(`#${accordionContainerId}`).on('show.bs.collapse', () => {
      chevronElement.firstElementChild.textContent = 'expand_more'
    })
  })
}

function appendNewMapToMapCategoryDropdown(mapScriptName, mapName, mapCategoryName) {
  const mapCategoriesMenuElement = document.getElementById('hs-map-categories-menu')

  for (let mapCategoryElement of mapCategoriesMenuElement.children) {
    const categoryNameElement = mapCategoryElement.querySelector('.category-name')
    
    if (
      mapCategoryElement &&
      categoryNameElement && 
      categoryNameElement.textContent === mapCategoryName
      ) {
      mapCategoryElement.lastElementChild.appendChild(createMapCategoryElement(mapCategoryName, mapScriptName, mapName))
      return
    }
  }
  return false
}

function refreshCurrentlyDisplayedHighscores() {
  if (activeCategoryElement) {
    const tempScrollTop = highscoresContainerElement.parentElement.scrollTop;
    activeCategoryElement.click();
    highscoresContainerElement.parentElement.scrollTo(0, tempScrollTop);
  }
}

function resetMapCategoriesMenu() {
  const allMaps = document.getElementById('hs-all-maps-category')
  const allMapsCopy = allMaps.cloneNode(true)
  mapCategoriesMenu.innerHTML = ''
  mapCategoriesMenu.appendChild(allMapsCopy)
  
  activeCategoryElement = allMapsCopy
  initMapCategoriesMenu()
  refreshCurrentlyDisplayedHighscores()
}

function changeSideDrawerVisibility() {
  const menuContainer = document.getElementById('hs-maps-menu-container');
  const backdrop = document.getElementById('hs-backdrop');

  if (menuContainer.classList.contains('shown')) {
    menuContainer.classList.replace('shown', 'hidden')
    sideDrawerTrigger.firstElementChild.textContent = 'chevron_right'
    backdrop.style.visibility = 'hidden'
  } else {
    menuContainer.classList.replace('hidden', 'shown')
    sideDrawerTrigger.firstElementChild.textContent = 'chevron_left'
    backdrop.style.visibility = 'visible'
  }
}

function watchActiveMap() {
  const activeMapName = SavedCombosService.getMapName(MemoryController.getCurrentMapScript())
  const activeCategoryName = SavedCombosService.getMapCategory(MemoryController.getCurrentMapScript())

  if (activeMapData.mapName !== activeMapName || activeMapData.categoryName !== activeCategoryName) {
    setActiveMapData()
    if (activeMapName && activeCategoryName) {
      setupActiveMapIcons(activeMapName, activeCategoryName)
    }
  }
}

function setupActiveMapIcons(activeMapName, activeCategoryName) {
  for (const mapCategoryElement of Array.from(mapCategoriesMenu.children)) {
    const mapCategoryTextElement = mapCategoryElement.querySelector('.category-name')

    if (mapCategoryTextElement && mapCategoryTextElement.textContent === activeCategoryName) {
      const allMapElements = Array.from(mapCategoryElement.querySelector('.hs-map-acc-collapse').children)
      const mapElement = allMapElements.find((map) => map.textContent === activeMapName)

      if (mapElement) {
        const categoryIcon = createActiveMapIcon()
        const mapIcon = createActiveMapIcon()

        mapCategoryTextElement.insertAdjacentElement('afterend', categoryIcon)
        mapElement.firstElementChild.appendChild(mapIcon)
        
        setActiveMapData(categoryIcon, mapIcon, activeMapName, activeCategoryName)
        
        return
      }
    }
  }
}

function createActiveMapIcon() {
  const activeMapIcon = document.createElement('span')
  activeMapIcon.classList.add('material-icons', 'text-secondary', 'ml-1')
  activeMapIcon.textContent = 'place'

  return activeMapIcon
}

function setActiveMapData(categoryIcon, mapIcon, mapName, categoryName) {
  activeMapData.categoryIcon && activeMapData.categoryIcon.remove()
  activeMapData.mapIcon && activeMapData.mapIcon.remove()

  activeMapData = {
    categoryIcon,
    mapIcon,
    mapName,
    categoryName,
  }
}

export {
  initMapCategoriesMenu,
  resetMapCategoriesMenu,
  appendNewMapToMapCategoryDropdown,
  refreshCurrentlyDisplayedHighscores,
  watchActiveMap,
  setActiveMapData,
  drawHighscoreStats,
}
