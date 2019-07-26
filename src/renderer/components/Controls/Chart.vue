<template>
  <div class="myChart-container">
    <div class="overlay">
      <div>{{ duration / 1000 }}s</div>
    </div>
    <canvas id="myChart"></canvas>
  </div>
</template>

<script>
import Chart from 'chart.js'
import 'chartjs-plugin-streaming'
export default {
  name: 'Chart',
  props: {
    max: {
      default: 30,
      type: Number
    },
    duration: {
      type: Number,
      default: 30 * 1000
    },
    value: {
      type: Number,
      default: 0
    },
    enabled: {
      type: Boolean,
      default: false
    }
  },
  data() {
    const chartColors = {
      red: 'rgb(255, 99, 132)',
      redf: 'rgba(255, 99, 132, 0.3)',
      orange: 'rgb(255, 159, 64)',
      yellow: 'rgb(255, 205, 86)',
      green: 'rgb(75, 192, 192)',
      blue: 'rgb(54, 162, 235)',
      purple: 'rgb(153, 102, 255)',
      grey: 'rgb(201, 203, 207)'
    }
    return {
      chart: {},
      config: {
        type: 'line',
        data: {
          datasets: [
            {
              backgroundColor: chartColors.redf,
              borderColor: chartColors.red,
              pointRadius: 2,
              data: []
            }
          ]
        },
        options: {
          legend: {
            display: false
          },
          tooltips: {
            enabled: false
          },
          scales: {
            xAxes: [
              {
                type: 'realtime',
                realtime: {
                  duration: this.duration,
                  delay: 1000,
                  pause: true,
                  ttl: undefined
                },
                ticks: {
                  display: false
                },
                gridLines: {
                  display: true,
                  color: '#eeeeee'
                }
              }
            ],
            yAxes: [
              {
                ticks: {
                  min: 0
                },
                scaleLabel: {
                  labelString: 'A'
                }
              }
            ]
          },
          hover: {
            animationDuration: 0
          },
          plugins: {
            streaming: {
              frameRate: 30
            }
          }
        }
      }
    }
  },
  watch: {
    duration: function(newVal, oldVal) {
      this.chart.config.xAxes.realtime.duration = newVal
    },
    value: function(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.onRefresh()
      }
    },
    enabled: function(newVal, oldVal) {
      if (!newVal) {
        this.config.options.scales.xAxes[0].realtime.pause = true
        this.chart.update({ duration: 0 })
      } else {
        this.config.options.scales.xAxes[0].realtime.pause = false
        this.chart.update({ duration: this.duration })
      }
    }
  },
  mounted() {
    const element = this.$el.getElementsByTagName('canvas')[0]
    var ctx = element.getContext('2d')
    this.chart = new Chart(ctx, this.config)
  },
  methods: {
    onRefresh() {
      this.chart.config.data.datasets[0].data.push({
        x: Date.now(),
        y: this.value
      })
      this.chart.update({ preservation: true })
    }
  }
}
</script>

<style scoped>
.myChart-container {
  border: 1px solid rgb(248, 209, 209);
  border-radius: 5px;
  padding: 5px;
  margin: 2px;
}
.overlay {
  position: absolute;
  font-size: 10px;
  top: 8px;
  right: 8px;
  background: rgb(221, 221, 221);
  padding: 3px;
  padding-top: 0px;
  padding-bottom: 0px;
  border-radius: 4px;
  /* margin-left: 100px; */
  word-wrap: none;
}
</style>
