<template>
  <el-container :class="darkMode ? 'darktheme' : ''">
    <el-header>
      <el-row>
        <el-col>
          <ComSelector
            :portlist="portNames"
            :isconnected="instr.online()"
            @click="toggleconnect"
            @change="connect"
          />
        </el-col>
        <el-col :span="8">
          <WindowMode v-model="darkMode"></WindowMode>
        </el-col>
      </el-row>
    </el-header>
    <el-main>
      <el-row>
        <div class="identity">{{ d.id.value }}</div>
      </el-row>
      <el-row>
        <Chart
          :value="d.actual_current.value"
          :max="5"
          :enabled="d.output.value && instr.online()"
          :duration="30000"
        ></Chart>
      </el-row>
      <el-row>
        <el-col :span="12">
          <SegmentDisplay :title="$t('label.targetVoltage')" :value="d.set_voltage.value" />
        </el-col>
        <el-col :span="12">
          <SegmentDisplay :title="$t('label.actualVoltage')" :value="d.actual_voltage.value" />
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <SegmentDisplay
            :title="$t('label.targetCurrent')"
            :value="d.set_current.value"
            :major="1"
            :minor="3"
          />
        </el-col>
        <el-col :span="12">
          <SegmentDisplay
            :title="$t('label.actualCurrent')"
            :overlay="peakCurrent"
            :value="d.actual_current.value"
            :major="1"
            :minor="3"
          />
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12" class="nifc">
          <label for="voltage">{{ $t('label.voltage') }}</label>
          <el-input-number
            v-model.number="d.set_voltage.value"
            :disabled="!instr.online()"
            class="nif"
            :precision="2"
            :step="0.01"
            :min="0"
            :max="30"
          />
          <div class="button-group">
            <PresetButton
              v-for="(preset, index) in [3.3, 5, 9, 12, 20.0, 30.0]"
              :key="index"
              :preset="preset"
              :target="d.set_voltage.value"
              :disabled="!instr.online()"
              :suffix="preset >= 5 && preset <= 12 ? 'V' : ''"
              @click="d.set_voltage.value = preset"
            />
          </div>
        </el-col>
        <el-col :span="12" class="nifcr">
          <label for="current">{{ $t('label.current') }}</label>
          <el-input-number
            v-model.number="d.set_current.value"
            :disabled="!instr.online()"
            :precision="3"
            :step="0.001"
            :min="0"
            :max="5"
            class="nif"
          />
          <div class="button-group">
            <PresetButton
              v-for="(preset, index) in [0.1, 0.2, 0.5, 1, 2, 3, 5]"
              :key="index"
              :preset="preset"
              :target="d.set_current.value"
              :disabled="!instr.online()"
              :suffix="preset >= 1 ? 'A' : ''"
              @click="d.set_current.value = preset"
            />
          </div>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12" class="nifc">
          <el-switch
            v-model="d.ovp.value"
            :disabled="!instr.online()"
            :active-text="`${$t('label.on')}`"
            :inactive-text="`${$t('label.ovp')}`"
            active-color="#67c23a"
            :width="60"
          ></el-switch>
        </el-col>
        <el-col :span="12" class="nifcr">
          <el-switch
            v-model="d.ocp.value"
            :disabled="!instr.online()"
            :active-text="`${$t('label.on')}`"
            :inactive-text="`${$t('label.ocp')}`"
            active-color="#67c23a"
            :width="60"
          ></el-switch>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-button
            class="power"
            :type="d.output.value ? 'danger' : 'primary'"
            :disabled="!instr.online()"
            @click="d.output.value = !d.output.value"
          >
            <el-badge
              id="autoOffIndicator"
              :value="`${$t('label.autoOff')}`"
              type="danger"
              :hidden="hideAutoOffInidcator"
            ></el-badge>
            {{ $t('label.power') }} {{ d.status.value.output ? $t('label.on') : $t('label.off') }}
          </el-button>
        </el-col>
      </el-row>
    </el-main>
  </el-container>
</template>

<script>
import Instrument from './Controls/Instrument.js'
import SegmentDisplay from './Controls/Segment'
import PresetButton from './Controls/PresetButton'
import ComSelector from './Controls/ComSelector'
import WindowMode from './Controls/WindowMode'
import Chart from './Controls/Chart'

export default {
  name: 'Controls',
  components: {
    SegmentDisplay: SegmentDisplay,
    PresetButton: PresetButton,
    ComSelector: ComSelector,
    WindowMode: WindowMode,
    Chart: Chart
  },
  data() {
    return {
      darkMode: false,
      pollInterval: 100,
      baud: 9600,
      portNames: [],
      portSelected: null,
      instr: null,
      d: null,
      peakCurrent: 0,
      hideAutoOffInidcator: true
    }
  },
  watch: {
    'd.status.value.output': function(newVal, oldVal) {
      // show status moved to off but dont reset demanded value
      if (this.d.output.value && !this.d.status.value.output) {
        this.hideAutoOffInidcator = false
      } else if (this.d.status.value.output) {
        this.hideAutoOffInidcator = true
      }
      // this.d.output.value = newVal
    },
    'd.output.value': function(newVal, oldVal) {
      // reset peak when off -> on
      if (newVal && !oldVal) {
        this.peakCurrent = 0
        this.hideAutoOffInidcator = true
      }
      // poll instrument status if output on
      this.instr.poll = newVal === true
    },
    'd.actual_current.value': function(newVal, oldVal) {
      this.peakCurrent = Math.max(this.peakCurrent, this.d.actual_current.value)
    }
  },
  beforeMount() {
    this.instr = new Instrument()
    this.instr.pollInterval = this.pollInterval
    this.d = this.instr.data
    this.checkForPorts()
  },
  beforeDestroy() {
    if (this.port !== undefined) {
      this.instr.close()
    }
  },
  methods: {
    async toggleconnect(event) {
      if (this.instr) {
        if (this.instr.online()) {
          this.instr.close()
        } else if (event) {
          await this.connect(event)
        }
      }
    },
    async connect(portName) {
      this.portSelected = portName
      if (this.portNames.length > 0) {
        this.instr.open(portName, this.baud)
        await this.instr.init()
      }
    },
    async checkForPorts() {
      if (!this.instr.online()) {
        this.portNames = await Instrument.getAvailablePorts()
        setTimeout(this.checkForPorts, 1500)
      }
    }
  }
}
</script>

<style>
@import url('https://fonts.googleapis.com/css?family=Source+Sans+Pro');
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  /* border: 1px solid red; */
}
body {
  overflow-x: hidden;
  overflow-y: hidden;
  font-family: 'Source Sans Pro', sans-serif;
  /* background-size: 200%; */
}
.el-container {
  padding: 10px;
}
.el-header {
  padding: 0px;
  margin: 0px;
  overflow: hidden;
}
.el-main {
  padding: 0px;
  margin: 0px;
  overflow: hidden;
}
.identity {
  font-weight: 700;
  font-size: 14px;
  color: rgba(136, 136, 136, 0.933);
  padding: 4px;
}
.power {
  margin-top: 5px;
  width: 100%;
  height: 90px;
  font-size: 3.5vh;
  font-weight: bold;
}
#autoOffIndicator {
  position: absolute;
  right: 15px;
  top: 15px;
  /* bottom: 20px; */
}
.el-switch {
  margin-top: 10px;
  margin-bottom: 4px;
  border-radius: 4px;
  padding: 20px;
  width: 100%;
  border: 1px solid rgb(221, 221, 221);
  background: rgba(240, 240, 240, 0.418);
}
label {
  font-size: 10px;
  user-select: none;
}
.button-group {
  display: inline-flex;
  position: relative;
}
.nif {
  width: 100%;
  margin: 4px 0px;
}
.nifc {
  padding-right: 3px;
  padding-top: 5px;
  font-size: 2vh;
}
.nifcr {
  padding-left: 3px;
  padding-top: 5px;
  font-size: 2vh;
}
.darktheme {
  background: #afafaf;
}
</style>
