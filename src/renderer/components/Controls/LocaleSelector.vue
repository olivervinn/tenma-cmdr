<template>
  <el-dropdown type="default" size="mini" placement="bottom" @command="setLocale">
    <span
      class="el-dropdown-link el-button el-button--info is-plain el-button--mini is-circle locale-button"
      >{{ $i18n.locale }}</span
    >
    <el-dropdown-menu slot="dropdown">
      <el-dropdown-item v-for="locale in getLocales()" :key="locale.id" :command="locale">
        {{ locale }}
      </el-dropdown-item>
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
.locale-button {
  /* font-size: 10px; */
  padding: 6px;
  justify-content: center;
}
</style>
