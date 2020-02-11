import { Indexer, Delegate, ERC20 } from '@airswap/clients'
import { rinkebyTokens, protocols } from '@airswap/constants'
import { toDecimalString } from '@airswap/utils'
import { BigNumber } from 'ethers/utils'

async function getTotalDelegateLiquidity(
  signerToken: string,
  senderToken: string,
) {
  // Fetch Delegate locators from the Rinkeby Indexer for DAI / WETH.
  const { locators } = await new Indexer().getLocators(
    signerToken,
    senderToken,
    protocols.DELEGATE,
  )

  // Iterate through Delegates to get quotes.
  let totalAmountAvailable = new BigNumber(0)
  for (const locator of locators) {
    try {
      // Construct a Delegate.
      const delegate = new Delegate(locator)
      console.log(`Requesting quote from ${locator}...`)

      // Get a quote from the Delegate and check its balance.
      const quote = await delegate.getMaxQuote(senderToken, signerToken)
      const balance = await new ERC20(quote.sender.token).balanceOf(
        await delegate.getWallet(),
      )
      if (balance.lt(quote.sender.amount)) {
        totalAmountAvailable = totalAmountAvailable.add(balance)
      } else {
        totalAmountAvailable = totalAmountAvailable.add(quote.sender.amount)
      }
    } catch (error) {
      continue
    }
  }

  // Convert the amount to decimal and display.
  return toDecimalString(totalAmountAvailable, rinkebyTokens.DAI.decimals)
}

getTotalDelegateLiquidity(
  rinkebyTokens.WETH.address,
  rinkebyTokens.DAI.address,
).then(amount => {
  console.log(`${amount} WETH available for DAI from Delegates on Rinkeby.`)
})
