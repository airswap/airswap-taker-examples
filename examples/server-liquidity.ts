import { Indexer, Server } from '@airswap/protocols'
import { Quote } from '@airswap/types'
import { chainIds } from '@airswap/constants'
import TokenMetadata from '@airswap/metadata'
import { toDecimalString, getTotalBySignerAmount } from '@airswap/utils'

async function getServerLiquidity(
  signerToken: string,
  senderToken: string,
  signerDecimals: number
) {
  // Fetch Server locators from the Rinkeby Indexer
  const { locators } = await new Indexer(chainIds.RINKEBY).getLocators(
    signerToken,
    senderToken
  )

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
  return toDecimalString(getTotalBySignerAmount(quotes), signerDecimals)
}

const metadata = new TokenMetadata(chainIds.RINKEBY)
metadata.fetchKnownTokens().then(() => {
  const DAI = metadata.findTokensBySymbol('DAI').shift()
  const WETH = metadata.findTokensBySymbol('WETH').shift()
  getServerLiquidity(DAI.address, WETH.address, DAI.decimals).then(amount => {
    console.log(`\n${amount} DAI available for WETH from Servers on Rinkeby.\n`)
  })
})
