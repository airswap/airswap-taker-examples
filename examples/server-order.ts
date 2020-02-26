import { Indexer, Server, Swap, Validator } from '@airswap/protocols'
import { Order } from '@airswap/types'
import { chainIds, rinkebyTokens } from '@airswap/constants'
import {
  toAtomicString,
  getBestByLowestSenderAmount,
  getEtherscanURL,
} from '@airswap/utils'
import { ethers } from 'ethers'
import { BigNumber } from 'ethers/utils'

import dotenv from 'dotenv'

dotenv.config()
if (!process.env.ETHEREUM_ACCOUNT) {
  throw new Error('ETHEREUM_ACCOUNT must be set')
}

async function takeBestServerOrder(
  signerAmount: string,
  signerToken: string,
  senderToken: string
) {
  // Load a wallet using ethers.js
  const wallet = new ethers.Wallet(
    process.env.ETHEREUM_ACCOUNT || '',
    ethers.getDefaultProvider('rinkeby')
  )

  // Fetch Server locators from the Rinkeby Indexer
  const { locators } = await new Indexer().getLocators(signerToken, senderToken)

  // Iterate to get orders from all Servers.
  const orders: Array<Order> = []
  for (const locator of locators) {
    try {
      orders.push(
        await new Server(locator).getSenderSideOrder(
          signerAmount,
          signerToken,
          senderToken,
          wallet.address
        )
      )
      console.log(`[ ✓ Order Received from ${locator} ]`)
    } catch (error) {
      console.log(`[ ✗ Error (${error.code}) ${locator}: ${error.message} ]`)
      continue
    }
  }

  // Get the best among all returned orders.
  const best = getBestByLowestSenderAmount(orders)

  if (best) {
    // Do a pre-swap check for any errors that would occur
    const errors = await new Validator().checkSwap(best)
    if (errors.length) {
      console.log(
        '\nUnable to take best order (as sender) for the following reasons\n'
      )
      for (const error of errors) {
        console.log('·', Validator.getReason(error))
      }
      console.log()
    } else {
      return await new Swap().swap(best, wallet)
    }
  } else {
    console.log('\nNo valid orders found\n')
  }
}

// Request to buy 1 DAI for WETH.
takeBestServerOrder(
  toAtomicString(new BigNumber(1), rinkebyTokens.DAI.decimals),
  rinkebyTokens.DAI.address,
  rinkebyTokens.WETH.address
).then(hash => {
  if (hash) {
    console.log(getEtherscanURL(chainIds.RINKEBY, hash))
  }
})
