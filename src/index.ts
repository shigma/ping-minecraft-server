import { Socket } from 'net'

function itob(n: number, length: number) {
  const result = []
  while (n > 0 || result.length < length) {
    const digit = n & 0xff
    result.unshift(digit)
    n >>= 8
  }
  return result
}

class PingError extends Error {
  constructor(message: string, public host: string, public port: number) {
    super(message)
  }
}

function ping(host: string, port: number) {
  const socket = new Socket()

  const PacketID = Buffer.from([0])
  const ProtocolVersion = Buffer.from([242, 3])
  const ServerAddressContent = Buffer.from(host, 'ascii')
  const ServerAddressLength = Buffer.from(itob(ServerAddressContent.length, 1))
  const ServerAddress = Buffer.concat([ServerAddressLength, ServerAddressContent])
  const ServerPort = Buffer.from(itob(port, 2))
  const NextState = Buffer.from([1])
  const HandshakePacketContent = Buffer.concat([PacketID, ProtocolVersion, ServerAddress, ServerPort, NextState])
  const HandshakePacketLength = Buffer.from(itob(HandshakePacketContent.length, 1))
  const HandshakePacket = Buffer.concat([HandshakePacketLength, HandshakePacketContent])
  const RequestPacket = Buffer.from([1, 0])

  return new Promise<ping.Result>((resolve, reject) => {
    let response = ''
    let bytes = 0
    let length = -1

    socket.on('data', (data) => {
      let offset = 0
      if (length < 0) {
        const lowerByte = data[3]
        const higherByte = data[4]
        length = ((higherByte & 0x7f) << 7) | (lowerByte & 0x7f)
        offset = 5
      }
      response += data.slice(offset).toString()
      bytes += data.slice(offset).length
      if (bytes >= length) {
        try {
          resolve(JSON.parse(response))
        } catch (error) {
          reject(new PingError('parse-error', host, port))
        }
      }
    })

    socket.setTimeout(5000, () => {
      socket.end()
      if (!response) reject(new PingError('connect-timeout', host, port))
    })

    socket.on('error', () => {
      socket.destroy()
      reject(new PingError('connect-error', host, port))
    })

    socket.connect(port, host, () => {
      socket.write(HandshakePacket)
      socket.write(RequestPacket)
    })
  })
}

namespace ping {
  export type Error = PingError
  export const Error = PingError

  export interface Result {
    version: Result.Version
    players: Result.Players
    description: Result.Description
    favicon: string
    modinfo: Result.ModInfo
  }

  export namespace Result {
    export interface Version {
      name: string
      protocol: number
    }

    export interface Players {
      max: number
      online: number
    }

    export interface Description {
      text: string
      extra: Description.Extra[]
    }

    export namespace Description {
      export interface Extra {
        text: string
        color: string
        bold: boolean
        obfuscated: boolean
      }
    }

    export interface ModInfo {
      type: string
      modList: []
    }
  }
}

export = ping
