import { Indexer, Server } from '@airswap/protocols'
import { Quote } from '@airswap/types'
import { rinkebyTokens } from '@airswap/constants'
import { toDecimalString, getTotalBySignerAmount } from '@airswap/utils'

async function getServerLiquidity(signerToken: string, senderToken: string) {
  // Fetch Server locators from the Rinkeby Indexer
  const { locators } = await new Indexer().getLocators(signerToken, senderToken)

  // Iterate through Servers to get quotes
  const quotes: Array<Quote> = []
  for (const locator of locators) {
    try {
      quotes.push(
        await new Server(locator).getMaxQuote(signerToken, senderToken)
      )
      console.log(`[ ✓ Quote Received from ${locator} ]`)
    } catch (error) {
      console.log(`[ ✗ Error (${error.code}) ${locator}: ${error.message} ]`)
      continue
    }
  }
  return toDecimalString(
    getTotalBySignerAmount(quotes),
    rinkebyTokens.DAI.decimals
  )
}

getServerLiquidity(rinkebyTokens.DAI.address, rinkebyTokens.WETH.address).then(
  amount => {
    console.log(`\n${amount} DAI available for WETH from Servers on Rinkeby.\n`)
  }
)
