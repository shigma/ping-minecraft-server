# ping-minecraft-server

[![npm](https://img.shields.io/npm/v/ping-minecraft-server?style=flat-square)](https://www.npmjs.com/package/ping-minecraft-server)

Ping Minecraft Server.

- **Well-typed.** Written in TypeScript.
- **Lightweight.** Zero dependencies.

## Usage

```ts
import ping from 'ping-minecraft-server'

ping(host, port, options?)

/* {
  version: ...,
  players: ...,
  description: ...,
  favicon: ...,
} */
```

## Options

### timeout

- **type:** `number`
- **default:** `5000`

Connect timeout in milliseconds.
