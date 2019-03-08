<template>
  <div class="mode-container">
    <el-tooltip :content="`${$t('label.pinWindow')}`" placement="top">
      <el-button
        is-plan
        circle
        size="mini"
        :type="ontop ? 'warning' : 'default'"
        @click="ontop = change('windowMode', ontop)"
      >
        <span class="el-icon-location-outline"></span>
      </el-button>
    </el-tooltip>
    <el-tooltip :content="`${$t('label.darkTheme')}`" placement="top">
      <el-button
        is-plan
        circle
        size="mini"
        :type="value ? 'info' : 'default'"
        @click="
          $emit('input', !value)
          change('darkMode', dark)
        "
      >
        <span class="el-icon-view"></span>
      </el-button>
    </el-tooltip>
    <LocaleSelector></LocaleSelector>
  </div>
</template>

<script>
import LocaleSelector from './LocaleSelector'
export default {
  components: {
    LocaleSelector: LocaleSelector
  },
  props: ['value'],
  data() {
    return {
      ontop: false,
      dark: false
    }
  },
  methods: {
    change: function(eventId, value) {
      value = !value
      this.$electron.ipcRenderer.send(eventId, value)
      return value
    }
  }
}
</script>

<style scoped>
.mode-container {
  position: absolute;
  top: 0px;
  right: 0px;
}
</style>
