# AirSwap: Taker Example

Two examples of fetching available liquidity:

- [`yarn server:liquidity`](./examples/server-liquidity.ts) to aggregate rinkeby server liquidity for DAI/WETH.
- [`yarn delegate:liquidity`](./examples/delegate-liquidity.ts) to aggregate rinkeby delegate liquidity for DAI/WETH.

Two examples of taking the best available order:

- [`yarn server:order`](./examples/server-order.ts) takes the best order for 1 DAI in WETH.
- [`yarn delegate:order`](./examples/delegate-order.ts) takes the best price for 1 DAI in WETH.
