import { Indexer, Delegate } from '@airswap/protocols'
import { Quote } from '@airswap/types'
import { chainIds, protocols } from '@airswap/constants'
import TokenMetadata from '@airswap/metadata'
import { toDecimalString, getTotalBySenderAmount } from '@airswap/utils'

async function getDelegateLiquidity(
  signerToken: string,
  senderToken: string,
  senderDecimals: number
) {
  // Fetch Delegate locators from the Rinkeby Indexer
  const { locators } = await new Indexer(chainIds.RINKEBY).getLocators(
    signerToken,
    senderToken,
    protocols.DELEGATE
  )

  // Iterate through Delegates to get quotes
  const quotes: Array<Quote> = []
  for (const locator of locators) {
    try {
      quotes.push(
        await new Delegate(locator).getMaxQuote(signerToken, senderToken)
      )
      console.log(`[ ✓ Quote Received from ${locator} ]`)
    } catch (error) {
      console.log(`[ ✗ Error (${error.code}) ${locator}: ${error.message} ]`)
      continue
    }
  }

  return toDecimalString(getTotalBySenderAmount(quotes), senderDecimals)
}

const metadata = new TokenMetadata(chainIds.RINKEBY)
metadata.fetchKnownTokens().then(() => {
  const DAI = metadata.findTokensBySymbol('DAI').shift()
  const WETH = metadata.findTokensBySymbol('WETH').shift()
  getDelegateLiquidity(DAI.address, WETH.address, WETH.decimals).then(
    amount => {
      console.log(`${amount} DAI available for WETH from Delegates on Rinkeby.`)
    }
  )
})
