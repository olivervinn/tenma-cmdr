<template>
  <el-button
    size="mini"
    :type="target == preset ? 'primary' : 'default'"
    :disabled="disabled"
    @click="$emit('click', $event)"
    >{{ `${preset}${suffix}` }}</el-button
  >
</template>

<script>
export default {
  name: 'PresetButton',
  props: {
    preset: {
      type: Number,
      default: 1
    },
    disabled: {
      type: Boolean,
      default: false
    },
    target: {
      type: null,
      default: null
    },
    suffix: {
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
