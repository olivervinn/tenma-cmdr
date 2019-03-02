<template>
  <div>
    <el-select :placeholder="$t('Select')" @change="$emit('change', $event)">
      <el-option
        v-for="item in portlist"
        :key="item.name"
        :label="`${item.name}  (${item.description} - ${item.id})`"
        :value="item.name"
      />
    </el-select>
    <el-tag :type="isconnected ? 'success' : 'info'" class="item"
      >{{ isconnected ? $t('online') : $t('offline') }} {{ value }}</el-tag
    >
  </div>
</template>

<script>
export default {
  name: 'ComSelector',
  props: {
    portlist: {
      type: Array,
      default: () => {
        return []
      }
    },
    isconnected: {
      type: Boolean,
      default: false
    }
  }
}
</script>
