<template>
  <div>
    <el-dropdown
      split-button
      :type="isconnected ? 'success' : 'primary'"
      @click="$emit('click', activeport)"
      @command="
        activeport = $event
        $emit('change', $event)
      "
    >
      <div>
        {{ activeport ? activeport : $t('label.select') }} |
        {{ isconnected ? $t('label.online') : $t('label.offline') }}
      </div>
      <el-dropdown-menu slot="dropdown">
        <el-dropdown-item v-for="item in portlist" :key="item.name" :command="item.name">{{
          `${item.name} (${item.description} - ${item.id})`
        }}</el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>
  </div>
</template>

<script>
export default {
  name: 'ComSelector',
  props: {
    portlist: {
      type: Array,
      default: null
    },
    isconnected: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      activeport: null
    }
  }
}
</script>
