const config = {
  type: 'line',
  options: {
    legend: {
      display: true,
      color: '#868e96',
      labels: {
        fontColor: '#868e96'
      },
      onHover: (event) => {
        event.target.style.cursor = 'pointer'
      },
      onLeave: (event) => {
        event.target.style.cursor = 'default'
      }
    },
    elements: {
      line: {
        tension: 0, // disables bezier curves
      },
      point: {
        radius: 0,
        hitRadius: 7,
        hoverRadius: 5
      }
    },
    scales: {
      xAxes: [{
        gridLines: {
          display: false,
          // color: '#A991D4'
        },
        ticks: {
          beginAtZero: true,
          fontColor: '#868e96'
        }
      }],
      yAxes: [{
        gridLines: {
          display: false,
        },
        ticks: {
          beginAtZero: true,
          fontColor: '#868e96'
        }
      }]
    },
    hover: {
      mode: 'index',
    },
    tooltips: {
      mode: 'index',
      callbacks: {
          label: function (tooltipItem, data) {
            let dataset = data.datasets[tooltipItem.datasetIndex];
            let blocks = [];
            if (dataset.label) {
                blocks.push(dataset.label + ':');
            }
            if (dataset.unitPrefix) {
                blocks.push(dataset.unitPrefix);
            }
            blocks.push(dataset.data[tooltipItem.index])
            if (dataset.unitSuffix) {
                blocks.push(dataset.unitSuffix);
            }
            return blocks.join('');
          },
      },
    },
  }
}

export {
  config
}
