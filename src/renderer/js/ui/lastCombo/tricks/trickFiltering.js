import { Trick, TRICK_CONSTANTS } from '../../../combo/trickHistory'

export const TRICK_FILTERS = {
  GAPS: 'GAPS',
  SPECIALS: 'SPECIALS',
  REGULAR_TRICKS: 'REGULAR_TRICKS',
  SHOW_SWITCH: 'SHOW_SWITCH'
}

export const SORT_TYPES = {
  ASCENDING: 'ASCENDING',
  DESCENDING: 'DESCENDING',
}

export class TrickFilteringService {
  constructor(
    sortingType = SORT_TYPES.ASCENDING,
    filters = [...Object.values(TRICK_FILTERS)]
  ) {
    this.activeSortingType = sortingType
    this.activeFilters = {}

    filters.forEach(filter => this.activeFilters[filter] = true)
  }

  sortTricks(sortingType, tricksInComboArrayRaw, userInput) {
    if (sortingType && SORT_TYPES[sortingType]) {
      this.activeSortingType = sortingType
    }

    return this.applyFilters(tricksInComboArrayRaw, userInput)
  }

  filterTricks(filterName, tricksInComboArrayRaw, userInput) {
    this.updateFilters(filterName)
    return this.applyFilters(tricksInComboArrayRaw, userInput)
  }
  
  filterTricksByUserInput(tricksInComboArray, userInput) {
    
    if (!userInput || userInput.trim().length === 0) {
      return tricksInComboArray
    }

    const input = userInput.toLowerCase()

    const matchingTricks = tricksInComboArray.filter((trick) => {
      const trickName = trick.name.toLowerCase()
      return trickName.includes(input)
    })
    
    return matchingTricks;
  }

  updateFilters(filterName) {
    if (filterName && TRICK_FILTERS[filterName]) {
      this.activeFilters[filterName] = this.activeFilters[filterName]
        ? false
        : true
    }
  }

  applyFilters(tricksInComboArrayRaw, userInput) {
    let filteredArray = [...tricksInComboArrayRaw]

    if (!this.activeFilters[TRICK_FILTERS.SHOW_SWITCH]) {
      filteredArray = this.getDiscardedStanceTrickArray(filteredArray)
    }

    filteredArray = [...this.filterByTrickType(
      filteredArray,
      !!this.activeFilters[TRICK_FILTERS.GAPS],
      !!this.activeFilters[TRICK_FILTERS.SPECIALS],
      !!this.activeFilters[TRICK_FILTERS.REGULAR_TRICKS]
    )]

    filteredArray = [...this.filterTricksByUserInput(filteredArray, userInput)]
  
    return this.sortByUsage(filteredArray, this.activeSortingType)
  }

  removeSwitchFromTrickName(trickName) {
    return trickName.replace(`${TRICK_CONSTANTS.SWITCH} `, '')
  }

  getDiscardedStanceTrickArray(trickArray) {
    const discardedStanceTricks = [...trickArray].map(trick => {
      const newTrick = new Trick(trick.name, trick.flags, trick.timesUsed)
      
      if (newTrick.isSwitch()) {
        newTrick.name = this.removeSwitchFromTrickName(trick.name)
      }

      return newTrick
    })
    
    return discardedStanceTricks.filter((trick, index) => {
      const firstFoundIndex = discardedStanceTricks.findIndex(noStanceTrick =>
        noStanceTrick.name === trick.name
      )

      if (index !== firstFoundIndex) {
        discardedStanceTricks[firstFoundIndex].timesUsed += trick.timesUsed
        return false
      }

      return true
    })
  }
    
  sortByUsage(arrayToSort, sortType) {
    return [...arrayToSort].sort((a, b) => {
      const result = a.timesUsed - b.timesUsed

      if (result === 0) {
        return this.determineTrickOrderAlphabetically(a, b, sortType)
      }

      return sortType === SORT_TYPES.ASCENDING
        ? -result
        : result
    })
  }

  determineTrickOrderAlphabetically(aTrick, bTrick, sortType) {
    let aName = aTrick.name
    let bName = bTrick.name

    if (aTrick.isSwitch()) {
      aName = aTrick.name.replace(`${TRICK_CONSTANTS.SWITCH} `, '')
    }

    if (bTrick.isSwitch()) {
      bName = bTrick.name.replace(`${TRICK_CONSTANTS.SWITCH} `, '')
    }

    if (sortType === SORT_TYPES.ASCENDING) {
      return aName.localeCompare(bName)
    }

    return bName.localeCompare(aName)
  }

  filterByTrickType(arrayToFilter, showGaps, showSpecials, showRegularTricks) {
    let filteredArray = []

    if (showGaps && showSpecials && showRegularTricks) {
      return arrayToFilter
    }

    filteredArray = arrayToFilter.filter((trick) => { 
      return showGaps && trick.isGap() ||
        showSpecials && trick.isSpecial() ||
        showRegularTricks && !trick.isGap() && !trick.isSpecial()
    })

    return filteredArray
  }
}
