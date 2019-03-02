<template>
  <el-button
    size="mini"
    @click="
      property.value = value
      this.$parent.setValue(property)
    "
    >{{ label }}</el-button
  >
</template>

<script>
export default {
  name: 'PresetButton',
  props: {
    value: {
      type: Number,
      default: 1
    },
    property: {
      type: Object,
      default: () => {
        return ''
      }
    },
    label: {
      type: String,
      default: ''
    }
  }
}
</script>

<style>
.el-button--mini {
  padding: 4.3px;
  margin: 0px;
  margin-right: 4px !important;
  margin-left: 0px !important;
}
</style>
