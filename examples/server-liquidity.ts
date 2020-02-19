import { Indexer, Server } from '@airswap/protocols'
import { toDecimalString, getTotalBySignerAmount } from '@airswap/utils'
import { rinkebyTokens } from '@airswap/constants'
import { Quote } from '@airswap/types'

async function getServerLiquidity(signerToken: string, senderToken: string) {
  // Fetch Server locators from the Rinkeby Indexer
  const { locators } = await new Indexer().getLocators(signerToken, senderToken)

  // Iterate through Servers to get quotes
  const quotes: Array<Quote> = []
  for (let locator of locators) {
    try {
      quotes.push(
        await new Server(locator).getMaxQuote(signerToken, senderToken),
      )
    } catch (error) {
      continue
    }
  }
  return toDecimalString(
    getTotalBySignerAmount(quotes),
    rinkebyTokens.DAI.decimals,
  )
}

getServerLiquidity(rinkebyTokens.DAI.address, rinkebyTokens.WETH.address).then(
  amount => {
    console.log(`${amount} DAI available for WETH from Servers on Rinkeby.`)
  },
)
