import { Indexer, Server, Swap } from '@airswap/clients'
import { toAtomicString } from '@airswap/utils'
import { chainIds, rinkebyTokens, etherscanDomains } from '@airswap/constants'
import { ethers } from 'ethers'
import { BigNumber } from 'ethers/utils'
import dotenv from 'dotenv'

// Make sure environment variable is set
dotenv.config()
if (!process.env.ETHEREUM_ACCOUNT) {
  throw new Error('ETHEREUM_ACCOUNT must be set')
}

// Create a wallet using ethers.js.
const wallet = new ethers.Wallet(
  process.env.ETHEREUM_ACCOUNT,
  ethers.getDefaultProvider('rinkeby'),
)

async function takeBestOrder(
  signerAmount: string,
  signerToken: string,
  senderToken: string,
) {
  // Fetch Server locators from the Rinkeby Indexer.
  const { locators } = await new Indexer().getLocators(signerToken, senderToken)

  // Iterate to get the best order from all Servers.
  let best: any
  for (const locator of locators) {
    try {
      console.log(`Requesting order from ${locator}...`)
      // Request an order from the Server.
      const order: any = await new Server(locator).getSenderSideOrder(
        signerAmount,
        signerToken,
        senderToken,
        wallet.address,
      )
      // Set to best if the sender amount is lower.
      if (!best || order.sender.amount < best.order.sender.amount) {
        best = { locator, order }
      }
    } catch (error) {
      continue
    }
  }

  if (best) {
    console.log(`Taking from ${best.locator}...`)
    // Swap the order and display an Etherscan link.
    return await new Swap().swap(best.order, wallet)
  } else {
    return null
  }
}

// Request to buy 1 DAI for WETH.
takeBestOrder(
  toAtomicString(new BigNumber(1), rinkebyTokens.DAI.decimals),
  rinkebyTokens.DAI.address,
  rinkebyTokens.WETH.address,
).then(hash => {
  if (hash) {
    console.log(`https://${etherscanDomains[chainIds.RINKEBY]}/tx/${hash}`)
  } else {
    console.log('No valid results found.')
  }
})
