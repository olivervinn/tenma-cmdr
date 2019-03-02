<template>
  <el-container>
    <el-header>
      <ComSelector
        :value="portSelected"
        :portlist="portNames"
        :isconnected="portInst.online()"
        @change="connect($event)"
      />
    </el-header>
    <el-main>
      <el-row>
        <div>{{ pData.id.value }}</div>
      </el-row>
      <el-row>
        <el-col :span="12">
          <SegmentDisplay
            :id="'setvoltage'"
            :title="$t('Target Voltage')"
            :value="pData.set_voltage.value"
          />
        </el-col>
        <el-col :span="12">
          <SegmentDisplay
            :id="'voltage'"
            :title="$t('Actual Voltage')"
            :value="pData.actual_voltage.value"
          />
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <SegmentDisplay
            :id="'setcurrent'"
            :title="$t('Target Current')"
            :value="pData.set_current.value"
            :major="1"
            :minor="3"
          />
        </el-col>
        <el-col :span="12">
          <SegmentDisplay
            :id="'current'"
            :title="$t('Actual Current')"
            :value="pData.actual_current.value"
            :major="1"
            :minor="3"
          />
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12" class="nifc">
          <label for="voltage">{{ $t('Voltage') }}</label>
          <el-input-number
            id="inputv"
            v-model.number="pData.set_voltage.value"
            :disabled="!portInst.online()"
            class="nif"
            :precision="2"
            :step="0.01"
            :min="0"
            :max="30"
            @change="setValue(pData.set_voltage)"
          />
          <div class="button-group">
            <PresetButton :property="pData.set_voltage" :value="3.3" label="3.3" />
            <PresetButton :property="pData.set_voltage" :value="5.0" label="5V" />
            <PresetButton :property="pData.set_voltage" :value="9.0" label="9V" />
            <PresetButton :property="pData.set_voltage" :value="12.0" label="12V" />
            <PresetButton :property="pData.set_voltage" :value="20.0" label="20" />
            <PresetButton :property="pData.set_voltage" :value="30.0" label="30" />
          </div>
        </el-col>
        <el-col :span="12" class="nifcr">
          <label for="current">{{ `${$t('Current')} (${peakCurrent})` }}</label>
          <el-input-number
            id="inputi"
            v-model.number="pData.set_current.value"
            :disabled="!portInst.online()"
            :precision="3"
            :step="0.001"
            :min="0"
            :max="5"
            class="nif"
            @change="setValue(pData.set_current)"
          />
          <div class="button-group">
            <PresetButton :property="pData.set_current" :value="0.1" label="0.1" />
            <PresetButton :property="pData.set_current" :value="0.2" label="0.2" />
            <PresetButton :property="pData.set_current" :value="0.5" label="0.5" />
            <PresetButton :property="pData.set_current" :value="2" label="1A" />
            <PresetButton :property="pData.set_current" :value="2" label="2A" />
            <PresetButton :property="pData.set_current" :value="3" label="3A" />
          </div>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12" class="nifc">
          <el-button
            class="oxp"
            :type="pData.ovp.value === 1 ? 'warning' : 'info'"
            :disabled="!portInst.online()"
            @click="toggle(pData.ovp)"
            >{{ $t('OVP') }}</el-button
          >
        </el-col>
        <el-col :span="12" class="nifcr">
          <el-button
            class="oxp"
            :type="pData.ocp.value === 1 ? 'warning' : 'info'"
            :disabled="!portInst.online()"
            @click="toggle(pData.ocp)"
            >{{ $t('OCP') }}</el-button
          >
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-button
            class="power"
            :type="pData.status.value.output === 1 ? 'danger' : 'primary'"
            :disabled="!portInst.online()"
            @click="
              peakCurrent = 0
              toggle(pData.output)
            "
          >
            {{ $t('POWER') }}
            {{ pData.status.value.output === 1 ? $t('ON') : $t('OFF') }}
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

export default {
  name: 'Controls',
  components: {
    SegmentDisplay: SegmentDisplay,
    PresetButton: PresetButton,
    ComSelector: ComSelector
  },
  data() {
    return {
      portNames: [],
      portSelected: null,
      peakCurrent: 0,
      polling: false,
      portInst: new Instrument(),
      pData: null
    }
  },
  beforeMount() {
    this.pData = this.portInst.data
  },
  mounted() {
    this.checkForPorts()
  },
  beforeDestroy() {
    if (this.port !== undefined) {
      this.port.close()
    }
  },
  methods: {
    async connect(portName) {
      if (this.portNames.length > 0) {
        this.portInst.open(portName, 9600)
        await this.portInst.initState()
        this.polling = true
        setTimeout(this.update, 1000)
      }
    },
    async update() {
      await this.portInst.updateWhenOn()
      this.peakCurrent = Math.max(this.peakCurrent, this.portInst.data.actual_current.value)
      this.polling = this.pData.output.value === 1
      if (this.polling) {
        setTimeout(this.update, 200)
      } else {
        await this.portInst.updateWhenOn()
      }
    },
    async checkForPorts() {
      if (!this.portInst.online()) {
        this.portNames = await Instrument.getPortNames()
        setTimeout(this.checkForPorts, 1500)
      }
    },
    async toggle(obj) {
      obj.value = obj.value === 1 ? 0 : 1
      if (!this.polling) {
        await this.update()
      }
    },
    async setValue(obj) {
      if (!this.polling) {
        await this.update()
      }
    },
    protectionTripped(oxp, obj) {
      if (((oxp === 1) !== obj.value) === 1) {
        return true
      }
      return false
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
  /* background-image: linear-gradient(-60deg, rgba(14, 14, 14, 0.933), rgba(0, 0, 0, 0.933)); */
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
.nif {
  width: 100%;
  margin: 4px 0px;
}
.button-group {
  display: inline-flex;
  position: relative;
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

.el-container {
  padding: 10px;
  /* margin-top: 5px; */
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
</style>
