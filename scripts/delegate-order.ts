import { Indexer, Delegate, Swap } from '@airswap/clients'
import {
  chainIds,
  rinkebyTokens,
  protocols,
  etherscanDomains,
} from '@airswap/constants'
import { createOrderFromQuote, toAtomicString, signOrder } from '@airswap/utils'
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
  senderAmount: string,
  signerToken: string,
  senderToken: string,
) {
  try {
    // Fetch Delegate locators from the Rinkeby Indexer for DAI / WETH.
    const { locators } = await new Indexer().getLocators(
      signerToken,
      senderToken,
      protocols.DELEGATE,
    )

    // Iterate to get the best order from all Delegates.
    let best: any
    for (const locator of locators) {
      try {
        console.log(`Requesting quote from ${locator}...`)

        // Get a quote from the Delegate and create an order from the quote.
        const quote = await new Delegate(locator).getSignerSideQuote(
          senderAmount,
          senderToken,
          signerToken,
        )
        // Set to best if the sender amount is lower.
        if (!best || quote.signer.amount < best.quote.signer.amount) {
          best = { locator, quote }
        }
      } catch (error) {
        continue
      }
    }

    if (best) {
      console.log(`Taking from ${best.locator}...`)

      const delegate = new Delegate(best.locator)

      const order = createOrderFromQuote(
        best.quote,
        wallet.address,
        await delegate.getWallet(),
      )
      order.signature = await signOrder(order, wallet, Swap.getAddress())

      // Provide to the Delegate and display an Etherscan link.
      return await delegate.provideOrder(order, wallet)
    } else {
      return null
    }
  } catch (error) {
    console.error(error)
  }
}

takeBestOrder(
  toAtomicString(new BigNumber(1), rinkebyTokens.DAI.decimals),
  rinkebyTokens.WETH.address,
  rinkebyTokens.DAI.address,
).then(hash => {
  if (hash) {
    console.log(`https://${etherscanDomains[chainIds.RINKEBY]}/tx/${hash}`)
  } else {
    console.log('No valid results found.')
  }
})
