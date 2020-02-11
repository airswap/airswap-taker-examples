# AirSwap: Taker Example

Two examples of fetching available liquidity:

- [`yarn server:liquidity`](./scripts/server-liquidity.ts) to aggregate rinkeby server liquidity for DAI/WETH.
- [`yarn delegate:liquidity`](./scripts/delegate-liquidity.ts) to aggregate rinkeby delegate liquidity for DAI/WETH.

Two examples of taking the best available order:

- [`yarn server:order`](./scripts/server-order.ts) takes the best order for 1 DAI in WETH.
- [`yarn delegate:order`](./scripts/delegate-order.ts) takes the best price for 1 DAI in WETH.
