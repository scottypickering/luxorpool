# Luxor Mining Pool JavaScript API Client

[![Version](https://img.shields.io/npm/v/luxorpool.svg)](https://www.npmjs.org/package/luxorpool)
[![Try on RunKit](https://badge.runkitcdn.com/luxorpool.svg)](https://runkit.com/npm/luxorpool)

This unofficial Luxor Mining Pool client provides convenient access to the Luxor API from
client-side and server-side JavaScript applications.

## Installation
```sh
npm install luxorpool
# or
yarn add luxorpool
```

## Usage
The package needs to be configured with an API key from your Luxor account:
1. Log in to [Luxor](https://app.luxor.tech/en/login).
1. Go to *Settings* > *API Keys* > *Generate new Key*.

```js
import { Luxor } from 'luxorpool'

const luxor = new Luxor({
  key: 'YOUR_API_KEY'
  coin: 'BTC',
  units: 'TH'
})

async function example() {
  const subaccounts = await luxor.getSubaccounts()
  const hashrate = await luxor.getPoolHashrate()
  const transactions = await luxor.getTransactionHistory('YOUR_SUBACOUNT')
  // etc.
}
```

## Documentation
This library is a pretty lightweight wrapper around the Luxor Pool API, so [Luxor's API documentation](https://docs.luxor.tech/docs/schema/getting-started) is probably helpful.
It also includes type definitions, so it should be convenient for TypeScript folks.
