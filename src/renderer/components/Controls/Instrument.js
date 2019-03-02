const SerialPort = require('serialport')

export default class Instrument {
  /**
   * retrieve a list of serial ports that could be
   * used for communicating with the instrument
   */
  static async getPortNames() {
    const portnames = []
    try {
      await SerialPort.list((_, ports) => {
        ports.forEach(port => {
          // eslint-disable-next-line no-console
          console.log(`${port.comName} - ${port.manufacturer}`)
          portnames.push({
            name: port.comName.toString(),
            description: port.manufacturer,
            id: port.productId
          })
        })
      })
    } catch (e) {
      throw e
    }
    return portnames
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
    const mask = rawData.charCodeAt(0)
    const bmask = mask.toString(2).padStart(8, '0')
    if (bmask.indexOf('NaN') > 0) {
      return oldValue
    }
    return {
      cc: Number(bmask[0]),
      output: Number(bmask[1]),
      cv: Number(bmask[2]),
      beep: Number(bmask[4]),
      lock: Number(bmask[5])
    }
  }

  constructor() {
    this._port = null
    this.busy = false
    this.data = {
      id: { value: '------', get: '*IDN?', delay: 100 },
      set_voltage: { value: 0.0, set: 'VSET1:+', get: 'VSET1?', delay: 60 },
      set_current: { value: 0.0, set: 'ISET1:+', get: 'ISET1?', delay: 60 },
      actual_voltage: { value: 0.0, get: 'VOUT1?', delay: 60 },
      actual_current: { value: 0.0, get: 'IOUT1?', delay: 60 },
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
        delay: 100
      }
    }
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
        if (!self.busy) {
          self.busy = true
          self._port.$buffer = ''
          self._port.write(cmd)
          setTimeout(() => {
            let data = self._port.$buffer
            self.busy = false
            // eslint-disable-next-line no-console
            console.log(`${cmd}:${delay} - ${data}`)
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
   * change the properties current value
   * @param {object} target the property to change
   */
  async set(target) {
    if (!target.set) {
      throw Error('no setter for property')
    }

    const cmd = target.set.replace('+', Number(target.value))
    await this._send(cmd, target.delay)
    return target.value
  }

  /**
   * update and get the properties while the power is on.
   */
  async updateWhenOn() {
    await this.set(this.data.set_voltage)
    await this.set(this.data.set_current)
    await this.set(this.data.output)
    await this.set(this.data.ocp)
    await this.set(this.data.ovp)
    await this.get(this.data.actual_voltage)
    await this.get(this.data.actual_current)
    await this.get(this.data.status)
    return this.data
  }

  /**
   * called to initilse and get the status of the instrument
   */
  async initState() {
    this.data.beep.value = 0
    this.data.ocp.value = 1
    this.data.ovp.value = 1
    await this.get(this.data.id)
    await this.set(this.data.beep)
    await this.get(this.data.set_voltage)
    await this.get(this.data.set_current)
    await this.updateWhenOn()
    return this.data
  }
}
