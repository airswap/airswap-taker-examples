import { Indexer, Server, Swap } from '@airswap/protocols'
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
  senderToken: string,
) {
  // Load a wallet using ethers.js
  const signer = new ethers.Wallet(
    process.env.ETHEREUM_ACCOUNT || '',
    ethers.getDefaultProvider('rinkeby'),
  )

  // Fetch Server locators from the Rinkeby Indexer
  const { locators } = await new Indexer().getLocators(signerToken, senderToken)

  // Iterate to get orders from all Servers.
  let orders: Array<Order> = []
  for (const locator of locators) {
    try {
      orders.push(
        await new Server(locator).getSenderSideOrder(
          signerAmount,
          signerToken,
          senderToken,
          signer.address,
        ),
      )
    } catch (error) {
      continue
    }
  }

  // Get the best among all returned orders.
  const best = getBestByLowestSenderAmount(orders)

  if (best) {
    return await new Swap().swap(best, signer)
  }
}

// Request to buy 1 DAI for WETH.
takeBestServerOrder(
  toAtomicString(new BigNumber(1), rinkebyTokens.DAI.decimals),
  rinkebyTokens.DAI.address,
  rinkebyTokens.WETH.address,
).then(hash => {
  if (hash) {
    console.log(getEtherscanURL(chainIds.RINKEBY, hash))
  } else {
    console.log('No valid orders found.')
  }
})
