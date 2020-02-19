import { Indexer, Delegate, Swap } from '@airswap/protocols'
import { chainIds, rinkebyTokens, protocols } from '@airswap/constants'
import {
  createOrderForQuote,
  signOrder,
  getBestByLowestSignerAmount,
  getEtherscanURL,
  toAtomicString,
} from '@airswap/utils'
import { Quote, Order } from '@airswap/types'
import { ethers } from 'ethers'
import { BigNumber } from 'ethers/utils'

import dotenv from 'dotenv'

dotenv.config()
if (!process.env.ETHEREUM_ACCOUNT) {
  throw new Error('ETHEREUM_ACCOUNT must be set')
}

async function takeBestDelegateQuote(
  senderAmount: string,
  senderToken: string,
  signerToken: string,
) {
  // Fetch Server locators from the Rinkeby Indexer
  const { locators } = await new Indexer().getLocators(
    signerToken,
    senderToken,
    protocols.DELEGATE,
  )

  // Iterate through Delegates to get quotes
  const quotes: Array<Quote> = []
  for (let locator of locators) {
    try {
      quotes.push(
        await new Delegate(locator).getSignerSideQuote(
          senderAmount,
          signerToken,
          senderToken,
        ),
      )
    } catch (error) {
      continue
    }
  }

  // Get the best among all returned quotes
  const best = getBestByLowestSignerAmount(quotes)

  if (best) {
    // Load a wallet using ethers.js
    const signer = new ethers.Wallet(
      process.env.ETHEREUM_ACCOUNT || '',
      ethers.getDefaultProvider('rinkeby'),
    )

    // Construct a Delegate using the best locator
    const delegate = new Delegate(best.locator)
    const order: Order = await signOrder(
      createOrderForQuote(best, signer.address, await delegate.getWallet()),
      signer,
      Swap.getAddress(),
    )
    // Provide order to the Delegate
    return await delegate.provideOrder(order, signer)
  }
}

// Request to buy 1 DAI for WETH.
takeBestDelegateQuote(
  toAtomicString(new BigNumber(1), rinkebyTokens.WETH.decimals),
  rinkebyTokens.WETH.address,
  rinkebyTokens.DAI.address,
).then(hash => {
  if (hash) {
    console.log(getEtherscanURL(chainIds.RINKEBY, hash))
  } else {
    console.log('No valid quotes found.')
  }
})
