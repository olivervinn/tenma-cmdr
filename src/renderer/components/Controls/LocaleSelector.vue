<template>
  <el-dropdown
    split-button
    type="default"
    size="mini"
    @click="$emit('click', $event)"
    @command="setLocale"
  >
    {{ $i18n.locale }}
    <el-dropdown-menu slot="dropdown">
      <el-dropdown-item v-for="locale in getLocales()" :key="locale.id" :command="locale">{{
        locale
      }}</el-dropdown-item>
    </el-dropdown-menu>
  </el-dropdown>
</template>

<script>
export default {
  methods: {
    setLocale: function(locale) {
      this.$i18n.locale = locale
    },
    getLocales() {
      return Object.getOwnPropertyNames(this.$i18n.messages)
    }
  }
}
</script>

<style scoped>
.el-dropdown {
  position: absolute;
  top: 0px;
  right: 0px;
  font-size: 10px;
}
</style>
