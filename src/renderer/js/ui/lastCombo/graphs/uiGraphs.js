import Chart from 'chart.js'
import { config } from './graphConfig'
import * as NavigationUI from '../../uiNavigation'

const allTabsContainer = document.getElementById('combo-details-graphs-tabs-container')
const allNavElementsContainer = document.getElementById('combo-details-graphs-nav-container')

const tabContentContainersArray = Array.from(allTabsContainer.children)
const navElementsArray = Array.from(allNavElementsContainer.children)

const pointsCanvas = document.getElementById('canvas-points')
const balanceCanvas = document.getElementById('canvas-balance')
const revertPenaltyCanvas = document.getElementById('canvas-revert')

let pointsChart
let balanceChart
let revertPenaltyChart
let timestampsArray = []

function drawComboCharts(data, timestamps) {
  timestampsArray = timestamps
  drawPointsChart([1] && data && data.scoreDataset, [1] && data && data.basePointsDataset, [1] && data && data.multiplierDataset)
  drawBalanceChart([1] && data && data.manualTimeDataset, [1] && data && data.grindTimeDataset, [1] && data && data.lipTimeDataset)
  drawRevertPenaltyChart([1] && data && data.revertPenaltyDataset)
  
  // timestampsArray = ["0:01", "0:02", "0:03", "0:04", "0:05", "0:06", "0:07"];
  // const scoreDataset = ["0.003832", "0.009748", "0.022512", "0.058644", "0.117460", "0.260952", 0.278798]
  // const basePointsDataset = ["1.916", "2.437", "3.216", "6.516", "11.746", "21.746", "21.406"]
  // const multiplierDataset = [2, 4, 7, 9, 10, 12, 13]
  // const revertsDataset = [0, 0, 0, 0, 0, 0, 0]

  // drawPointsChart(scoreDataset, basePointsDataset, multiplierDataset)
  // drawRevertPenaltyChart(revertsDataset)
  // drawBalanceChart(scoreDataset, basePointsDataset, multiplierDataset)
}

function drawPointsChart(scoreData, basePointsData, multiplierData) {
  if (pointsChart) {
    pointsChart.destroy()
  }
  pointsChart = new Chart(pointsCanvas, {
    ...config,
    data: {
      labels: timestampsArray,
      datasets: [
        {
          data: scoreData,
          label: 'Score',
          borderColor: 'rgb(65, 106, 198)',
          pointBackgroundColor: 'rgb(65, 106, 198)',
          pointBorderWidth: 0,
          fill: false,
          unitSuffix: 'm',
        },
        {
          data: basePointsData,
          label: 'Base points',
          borderColor: 'rgb(243, 172, 25)',
          pointBackgroundColor: 'rgb(243, 172, 25)',
          pointBorderWidth: 0,
          fill: false,
          unitSuffix: 'k',
        },
        {
          data: multiplierData,
          label: 'Multiplier',
          borderColor: 'rgb(5, 245, 244)',
          pointBackgroundColor: 'rgb(5, 245, 244)',
          pointBorderWidth: 0,
          fill: false
        }
      ]
    }
  })
}

function drawBalanceChart (manualBalanceData, grindBalanceData, lipTimeDataset) {
  if (balanceChart) {
    balanceChart.destroy()
  }

  balanceChart = new Chart(balanceCanvas, {
    ...config,
    data: {
      labels: timestampsArray,
      datasets: [
        {
          data: manualBalanceData,
          label: 'Manual time',
          borderColor: 'rgb(100, 255, 100)',
          pointBackgroundColor: 'rgb(100, 255, 100)',
          pointBorderWidth: 0,
          fill: false,
          hidden: manualBalanceData[manualBalanceData.length - 1] === 0 ? true : false,
          unitSuffix: 's',
        },
        {
          data: grindBalanceData,
          label: 'Grind time',
          borderColor: 'rgb(205, 82, 82)',
          pointBackgroundColor: 'rgb(205, 82, 82)',
          pointBorderWidth: 0,
          fill: false,
          hidden: grindBalanceData[grindBalanceData.length - 1] === 0 ? true : false,
          unitSuffix: 's',
        },
        {
          data: lipTimeDataset,
          label: 'Lip time',
          borderColor: 'rgb(205, 205, 82)',
          pointBackgroundColor: 'rgb(205, 205, 82)',
          pointBorderWidth: 0,
          fill: false,
          hidden: lipTimeDataset[lipTimeDataset.length - 1] === 0 ? true : false,
          unitSuffix: 's',
        }
      ]
    }
  })
}

function drawRevertPenaltyChart(revertPenaltyDataset) {
  if (revertPenaltyChart) {
    revertPenaltyChart.destroy()
  }

  revertPenaltyChart = new Chart(revertPenaltyCanvas, {
    ...config,
    data: {
      labels: timestampsArray,
      datasets: [
        {
          data: revertPenaltyDataset,
          label: 'Revert penalty',
          borderColor: '#A991D4',
          pointBackgroundColor: '#A991D4',
          pointBorderWidth: 0,
          fill: false
        }
      ]
    }
  })
}

function init() {
  NavigationUI.initNavigation(navElementsArray, tabContentContainersArray)
}

export {
  drawComboCharts,
  init,
}
