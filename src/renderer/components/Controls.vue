<template>
  <el-container>
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
        <el-col>
          <LocaleSelector></LocaleSelector>
        </el-col>
      </el-row>
    </el-header>
    <el-main>
      <el-row>
        <div>{{ d.id.value }}</div>
      </el-row>
      <el-row>
        <el-col :span="12">
          <SegmentDisplay :title="$t('Target Voltage')" :value="d.set_voltage.value" />
        </el-col>
        <el-col :span="12">
          <SegmentDisplay :title="$t('Actual Voltage')" :value="d.actual_voltage.value" />
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <SegmentDisplay
            :title="$t('Target Current')"
            :value="d.set_current.value"
            :major="1"
            :minor="3"
          />
        </el-col>
        <el-col :span="12">
          <SegmentDisplay
            :title="$t('Actual Current')"
            :overlay="peakCurrent"
            :value="d.actual_current.value"
            :major="1"
            :minor="3"
          />
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12" class="nifc">
          <label for="voltage">{{ $t('Voltage') }}</label>
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
              :suffix="preset >= 5 && preset <= 12 ? 'A' : ''"
              @click="d.set_voltage.value = preset"
            />
          </div>
        </el-col>
        <el-col :span="12" class="nifcr">
          <label for="current">{{ $t('Current') }}</label>
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
          <el-button
            class="oxp"
            :type="d.ovp.value === 1 ? 'warning' : 'info'"
            :disabled="!instr.online()"
            @click="toggle(d.ovp)"
            >{{ $t('OVP') }}</el-button
          >
        </el-col>
        <el-col :span="12" class="nifcr">
          <el-button
            class="oxp"
            :type="d.ocp.value === 1 ? 'warning' : 'info'"
            :disabled="!instr.online()"
            @click="toggle(d.ocp)"
            >{{ $t('OCP') }}</el-button
          >
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-button
            class="power"
            :type="d.output.value === 1 ? 'danger' : 'primary'"
            :disabled="!instr.online()"
            @click="toggle(d.output)"
          >
            {{ $t('POWER') }}
            {{ d.status.value.output === 1 ? $t('ON') : $t('OFF') }}
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
import LocaleSelector from './Controls/LocaleSelector'

export default {
  name: 'Controls',
  components: {
    SegmentDisplay: SegmentDisplay,
    PresetButton: PresetButton,
    ComSelector: ComSelector,
    LocaleSelector: LocaleSelector
  },
  data() {
    return {
      pollInterval: 100,
      baud: 9600,
      portNames: [],
      portSelected: null,
      instr: null,
      d: null,
      peakCurrent: 0
    }
  },
  watch: {
    'd.output.value': function(newVal, oldVal) {
      // off -> on
      if (newVal > oldVal) {
        this.peakCurrent = 0
      }
      // poll if output on
      this.instr.poll = newVal === 1
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
    },
    async toggle(obj) {
      obj.value = obj.value === 1 ? 0 : 1
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
  font-family: 'Source Sans Pro', sans-serif;
  background-size: 200%;
}
.el-container {
  padding: 10px;
  overflow: hidden;
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
  width: 100%;
  height: 100px;
  font-size: 3.5vh;
}
.oxp {
  width: 100%;
  height: 50px;
  margin: 4px 0px;
  margin-right: 5px;
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
</style>
