<template>
  <div class="segment-container">
    <div class="label">{{ title }}</div>
    <div v-if="overlay" class="overlay">P: {{ overlay.toFixed(minor) }}</div>
    <div class="segment">
      <canvas :id="id" width="150" height="50" :value="value" />
    </div>
  </div>
</template>

<script>
import Segdisp from './Segment/segment-display.js'

export default {
  name: 'SegmentDisplay',
  props: {
    id: {
      type: String,
      default: 'segment'
    },
    title: {
      type: String,
      default: 'label'
    },
    major: {
      type: Number,
      default: 2
    },
    minor: {
      type: Number,
      default: 2
    },
    value: {
      type: Number,
      default: 0
    },
    overlay: {
      type: Number,
      default: null
    }
  },
  data: () => ({
    display: null
  }),
  computed: {
    displayValue() {
      return this.value
    }
  },
  updated() {
    this.display.setValue(this.value)
  },
  mounted() {
    const canvas = this.$el.getElementsByTagName('canvas')[0]
    this.display = this.createSegment(canvas, this.major, this.minor)
    this.display.setValue(this.value)
  },
  methods: {
    createSegment(id, major, minor) {
      const display = new Segdisp(id, major, minor)
      display.colorOn = 'rgba(200, 0, 0, 0.9)'
      display.colorOff = 'rgba(0, 0, 0, 0.1)'
      display.setValue(0)
      return display
    }
  }
}
</script>

<style scoped>
.segment-container {
  border: 1px solid rgba(230, 162, 162, 0.521);
  border-radius: 5px;
  margin: 2px;
  padding: 5px;
}
.label {
  margin-bottom: 10px;
  font-size: 10px;
  user-select: none;
}
.segment {
  margin-bottom: 10px;
}
.overlay {
  position: absolute;
  font-size: 11.5px;
  bottom: 4px;
  right: 8px;
  /* margin-left: 100px; */
  word-wrap: none;
}
</style>
