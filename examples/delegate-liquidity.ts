import { Indexer, Delegate } from '@airswap/protocols'
import { Quote } from '@airswap/types'
import { rinkebyTokens, protocols } from '@airswap/constants'
import { toDecimalString, getTotalBySenderAmount } from '@airswap/utils'

async function getDelegateLiquidity(signerToken: string, senderToken: string) {
  // Fetch Delegate locators from the Rinkeby Indexer
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
        await new Delegate(locator).getMaxQuote(signerToken, senderToken),
      )
    } catch (error) {
      continue
    }
  }

  return toDecimalString(
    getTotalBySenderAmount(quotes),
    rinkebyTokens.DAI.decimals,
  )
}

getDelegateLiquidity(
  rinkebyTokens.DAI.address,
  rinkebyTokens.WETH.address,
).then(amount => {
  console.log(`${amount} DAI available for WETH from Delegates on Rinkeby.`)
})
