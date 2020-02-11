import { Indexer, Server } from '@airswap/clients'
import { rinkebyTokens } from '@airswap/constants'
import { toDecimalString } from '@airswap/utils'
import { BigNumber } from 'ethers/utils'

async function getTotalServerLiquidity(
  signerToken: string,
  senderToken: string,
) {
  // Fetch Server locators from the Rinkeby Indexer for DAI / WETH.
  const { locators } = await new Indexer().getLocators(signerToken, senderToken)

  // Iterate through Servers to get quotes.
  let totalAmountAvailable = new BigNumber(0)
  for (const locator of locators) {
    try {
      console.log(`Requesting quote from ${locator}...`)
      const quote = await new Server(locator).getMaxQuote(
        signerToken,
        senderToken,
      )
      totalAmountAvailable = totalAmountAvailable.add(quote.signer.amount)
    } catch (error) {
      continue
    }
  }

  // Convert the amount to decimal and display.
  return toDecimalString(totalAmountAvailable, rinkebyTokens.DAI.decimals)
}

getTotalServerLiquidity(
  rinkebyTokens.DAI.address,
  rinkebyTokens.WETH.address,
).then(amount => {
  console.log(`${amount} DAI available for WETH from Delegates on Rinkeby.`)
})
