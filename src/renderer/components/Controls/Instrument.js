const SerialPort = require('serialport')

export default class Instrument {
  /**
   * retrieve a list of serial ports that could be
   * used for communicating with the instrument
   */
  static async getAvailablePorts() {
    const portDescriptors = []
    try {
      let ports = await SerialPort.list()
      ports.forEach(port => {
        portDescriptors.push({
          name: port.comName.toString(),
          description: port.manufacturer,
          id: port.productId
        })
      })
    } catch (e) {
      throw e
    }
    return portDescriptors
  }

  /**
   * get the value used in the command sequence
   * @param {string} cmd instrument command to extract value from
   */
  static decodeCmd(cmd) {
    if (cmd.indexOf(':') > -1) {
      return parseFloat(cmd.substring(cmd.indexOf(':') + 1))
    }
    return parseInt(cmd[cmd.length - 1], 10)
  }

  /**
   * convert serial value to number value, otherwise return raw value
   * @param {string} rawString value from serial read
   * @param {string} oldValue previous value
   */
  static decodeValue(rawString, oldValue) {
    if (rawString === '') {
      rawString = 0
    }
    const tmpFloat = parseFloat(rawString)
    return !Number.isNaN(tmpFloat) ? tmpFloat : rawString
  }

  /**
   * decode the status binary value into logical values
   * @param {string} rawData value from serial read
   * @param {string} oldValue previous value
   */
  static decodeStatus(rawData, oldValue) {
    const bitFieldStatus = rawData.charCodeAt(0)
    const normalizedStatus = bitFieldStatus.toString(2).padStart(8, '0')
    if (normalizedStatus.indexOf('NaN') > 0) {
      return oldValue
    }
    return {
      cc: Number(normalizedStatus[0]),
      output: Number(normalizedStatus[1]),
      cv: Number(normalizedStatus[2]),
      beep: Number(normalizedStatus[4]),
      lock: Number(normalizedStatus[5])
    }
  }

  constructor() {
    let self = this
    this.pollInterval = 200
    this._autoUpdate = false
    this._busy = false
    this._port = null
    this._state = {
      id: { value: '------', get: '*IDN?', delay: 90 },
      set_voltage: { value: 0.0, set: 'VSET1:+', get: 'VSET1?', delay: 55 },
      set_current: { value: 0.0, set: 'ISET1:+', get: 'ISET1?', delay: 55 },
      actual_voltage: { value: 0.0, get: 'VOUT1?', delay: 55 },
      actual_current: { value: 0.0, get: 'IOUT1?', delay: 55 },
      ovp: { value: 0, set: 'OVP+', delay: 50 },
      ocp: { value: 0, set: 'OCP+', delay: 50 },
      output: { value: 0, set: 'OUT+', delay: 50 },
      beep: { value: 0, set: 'BEEP+', delay: 50 },
      status: {
        value: {
          cc: 0,
          cv: 0,
          beep: 0,
          lock: 0,
          output: 0
        },
        get: 'STATUS?',
        delay: 55
      }
    }
    // proxy to publicly expose only the value property
    let validator = {
      get: function(obj, prop) {
        if (prop !== '__ob__' && typeof obj[prop] === 'object' && obj[prop] !== null) {
          return new Proxy(obj[prop], validator)
        } else {
          return obj[prop]
        }
      },
      set: function(obj, prop, newVal) {
        if (prop === 'value') {
          obj[prop] = newVal
          if (!self.poll) {
            self._set(obj)
          }
          return true
        } else {
          return false
        }
      }
    }
    this.data = new Proxy(this._state, validator)
  }

  /**
   * update event loop used in polling mode
   */
  async _update(self) {
    await self.updateWhenOn()
    if (self.poll) {
      setTimeout(self._update, self.pollInterval, self)
    } else {
      await self.updateWhenOn()
    }
  }

  /**
   * polling instrument for status
   */
  get poll() {
    return this._autoUpdate
  }

  /**
   * set polling status, when true update event loop started
   * targeted commands are updated in loop instead of direct
   * request
   */
  set poll(newVal) {
    if (this._autoUpdate === false && newVal === true) {
      this._autoUpdate = newVal
      setTimeout(this._update, 0, this)
    }
    this._autoUpdate = newVal
  }

  /**
   * determine if connection is available
   */
  online() {
    let isOnline = this._port !== null && this._port.isOpen
    return isOnline
  }

  /**
   * open the connection for read write operation
   * @param {string} portName port name e.g. COM3 or /dev/tty1
   * @param {Number} baud serial baud rate, typically 9600 or 115200
   */
  open(portName, baud) {
    this._port = new SerialPort(portName, {
      baudRate: baud,
      dataBits: 8,
      stopBits: 1,
      parity: 'none',
      parser: SerialPort.parsers.raw
    })

    this._port.$buffer = ''
    this._port.on('data', data => {
      for (let i = 0; i < data.length; i += 1) {
        this._port.$buffer += String.fromCharCode(data[i])
      }
    })
  }

  /**
   * release the serial connection resources
   */
  close() {
    if (this._port) {
      this._port.close()
    }
  }

  /**
   * send a command to the instrument
   * @param {string} cmd data to transmit
   * @param {Number} delay number of milliseconds to delay finalizing the read data
   */
  _send(cmd, delay = 30) {
    return new Promise((resolve, reject) => {
      let x = self => {
        if (!this._port) {
          reject(new Error('port not open'))
        } else if (!self.busy) {
          self.busy = true
          self._port.$buffer = ''
          self._port.write(cmd)
          setTimeout(() => {
            let data = self._port.$buffer
            self.busy = false
            // console.debug(`${cmd}:${delay} - ${data}`)
            resolve(data)
          }, delay)
        } else {
          setTimeout(x, 0, self)
        }
      }
      x(this)
    })
  }

  /**
   * request the properties current value
   * @param {object} target the property to get and update value
   */
  async get(target) {
    if (!target.get) {
      throw Error('no getter for property')
    }

    const cmd = target.get
    let result = await this._send(cmd, target.delay)

    if (!cmd.endsWith('?')) {
      target.value = Instrument.decodeCmd(cmd)
    } else if (cmd === 'STATUS?') {
      target.value = Instrument.decodeStatus(result, target.value)
    } else {
      target.value = Instrument.decodeValue(result, target.value)
    }
    return target.value
  }
  /**
   * command the instrument to take the properties current value
   * @param {object} target the property to change
   */
  async _set(target) {
    if (!target.set) {
      throw Error('no setter for property')
    }

    try {
      const cmd = target.set.replace('+', Number(target.value))
      await this._send(cmd, target.delay)
    } catch {
      // port not open, okay with this
    }
    return target.value
  }

  /**
   * update and get the properties while the power is on.
   */
  async updateWhenOn() {
    await this._set(this._state.output)
    await this._set(this._state.set_voltage)
    await this._set(this._state.set_current)
    await this._set(this._state.ocp)
    await this._set(this._state.ovp)
    await this.get(this._state.actual_voltage)
    await this.get(this._state.actual_current)
    await this.get(this._state.status)
    return this._state
  }

  /**
   * called to initialize and get the status of the instrument
   */
  async init() {
    this._state.beep.value = 0
    this._state.ocp.value = 1
    this._state.ovp.value = 1
    await this.get(this._state.id)
    await this._set(this._state.beep)
    await this.get(this._state.set_voltage)
    await this.get(this._state.set_current)
    await this.get(this._state.status)
    this._state.output.value = this._state.status.value.output
    await this.updateWhenOn()
    return this._state
  }
}
