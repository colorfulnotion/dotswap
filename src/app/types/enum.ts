export const enum ButtonVariants {
  btnPrimaryPinkLg = "btn-primary-pink-lg",
  btnPrimaryPinkSm = "btn-primary-pink-sm",
  btnPrimaryGhostLg = "btn-primary-ghost-lg",
  btnPrimaryGhostSm = "btn-primary-ghost-sm",
  btnSecondaryWhite = "btn-secondary-white",
  btnSecondaryGray = "btn-secondary-gray",
  btnInteractivePink = "btn-interactive-pink",
  btnInteractiveGhost = "btn-interactive-ghost",
  btnInteractiveDisabled = "btn-interactive-disabled",
  btnSelectPink = "btn-select-pink",
  btnSelectGray = "btn-select-gray",
  btnSelectDisabled = "btn-select-disabled",
  btnCloseModal = "btn-close-modal",
}

export enum ActionType {
  SET_API = "SET_API",
  SET_KUSAMA_API = "SET_KUSAMA_API",
  SET_ACCOUNTS = "SET_ACCOUNTS",
  SET_SELECTED_ACCOUNT = "SET_SELECTED_ACCOUNT",
  SET_TOKEN_BALANCES = "SET_TOKEN_BALANCES",
  SET_POOLS = "SET_POOLS",
  SET_SUCCESS_MODAL_OPEN = "SET_SUCCESS_MODAL_OPEN",
  SET_POOL_LIQUIDITY = "SET_POOL_LIQUIDITY",
  SET_POOL_ASSET_TOKEN_DATA = "SET_POOL_ASSET_TOKEN_DATA",
  SET_TRANSFER_GAS_FEES_MESSAGE = "SET_TRANSFER_GAS_FEES_MESSAGE",
  SET_POOL_GAS_FEE = "SET_POOL_GAS_FEE",
  SET_ADD_LIQUIDITY_GAS_FEE = "SET_ADD_LIQUIDITY_GAS_FEE",
  SET_POOLS_CARDS = "SET_POOLS_CARDS",
  SET_SWAP_FINALIZED = "SET_SWAP_FINALIZED",
  SET_POOL_CARD_SELECTED = "SET_POOL_CARD_SELECTED",
  SET_POOLS_TOKEN_METADATA = "SET_POOLS_TOKEN_METADATA",
  SET_SWAP_GAS_FEES_MESSAGE = "SET_SWAP_GAS_FEES_MESSAGE",
  SET_SWAP_GAS_FEE = "SET_SWAP_GAS_FEE",
  SET_CREATE_POOL_LOADING = "SET_CREATE_POOL_LOADING",
  SET_SWAP_LOADING = "SET_SWAP_LOADING",
  SET_ADD_LIQUIDITY_LOADING = "SET_ADD_LIQUIDITY_LOADING",
  SET_WITHDRAW_LIQUIDITY_LOADING = "SET_WITHDRAW_LIQUIDITY_LOADING",
  SET_WALLET_CONNECT_LOADING = "SET_WALLET_CONNECT_LOADING",
  SET_WALLET_EXTENSIONS = "SET_WALLET_EXTENSIONS",
  SET_ASSETS_LIST = "SET_ASSETS_LIST",
  SET_OTHER_ASSETS = "SET_OTHER_ASSETS",
  SET_SWAP_EXACT_IN_TOKEN_AMOUNT = "SET_SWAP_EXACT_IN_TOKEN_AMOUNT",
  SET_SWAP_EXACT_OUT_TOKEN_AMOUNT = "SET_SWAP_EXACT_OUT_TOKEN_AMOUNT",
  SET_EXACT_NATIVE_TOKEN_ADD_LIQUIDITY = "SET_EXACT_NATIVE_TOKEN_ADD_LIQUIDITY",
  SET_EXACT_ASSET_TOKEN_ADD_LIQUIDITY = "SET_EXACT_ASSET_TOKEN_ADD_LIQUIDITY",
  SET_EXACT_NATIVE_TOKEN_WITHDRAW = "SET_EXACT_NATIVE_TOKEN_WITHDRAW",
  SET_EXACT_ASSET_TOKEN_WITHDRAW = "SET_EXACT_ASSET_TOKEN_WITHDRAW",
  SET_ASSET_LOADING = "SET_ASSET_LOADING",
  SET_TOKEN_CAN_NOT_CREATE_WARNING_POOLS = "SET_TOKEN_CAN_NOT_CREATE_WARNING_POOLS",
  SET_TOKEN_CAN_NOT_CREATE_WARNING_SWAP = "SET_TOKEN_CAN_NOT_CREATE_WARNING_SWAP",
  SET_BLOCK_HASH_FINALIZED = "SET_BLOCK_HASH_FINALIZED",
  SET_LP_FEE = "SET_LP_FEE",
  SET_CROSSCHAIN_TRANSFER_FINALIZED = "SET_CROSSCHAIN_TRANSFER_FINALIZED",
  SET_CROSSCHAIN_ORIGIN_CHAIN_FEE = "SET_CROSSCHAIN_ORIGIN_CHAIN_FEE",
  SET_CROSSCHAIN_DESTINATION_CHAIN_FEE = "SET_CROSSCHAIN_DESTINATION_CHAIN_FEE",
  SET_CROSSCHAIN_LOADING = "SET_CROSSCHAIN_LOADING",
  SET_CROSSCHAIN_EXACT_TOKEN_AMOUNT = "SET_CROSSCHAIN_EXACT_TOKEN_AMOUNT",
  SET_CROSSCHAIN_DESTINATION_WALLET_ADDRESS = "SET_CROSSCHAIN_DESTINATION_WALLET_ADDRESS",
  SET_CROSSCHAIN_SELECTED_CHAIN = "SET_CROSSCHAIN_SELECTED_CHAIN",
  SET_CROSSCHAIN_EXTRINSIC = "SET_CROSSCHAIN_EXTRINSIC",
  SET_NATIVE_TOKEN_SPOT_PRICE = "SET_NATIVE_TOKEN_SPOT_PRICE",
  SET_WALLET_BALANCE_USD = "SET_WALLET_BALANCE_USD",
}

export enum TokenSelection {
  TokenA = "tokenA",
  TokenB = "tokenB",
  None = "none",
}

export enum TokenPlaceholder {
  NativeWnd = "WND",
  NativeRococo = "ROC",
}

export enum InputEditedType {
  exactIn = "exactIn",
  exactOut = "exactOut",
}

export enum LiquidityPageType {
  addLiquidity = "addLiquidity",
  removeLiquidity = "removeLiquidity",
}

export enum ServiceResponseStatus {
  Finalized = "Finalized",
}

export enum TokenPosition {
  tokenA = "A",
  tokenB = "B",
}

export enum NetworkKeys {
  Westend = "westend",
  Rococo = "rococo",
  Kusama = "kusama",
}

export enum WalletConnectSteps {
  stepExtensions = "extensions",
  stepAddresses = "addresses",
}

export enum TransactionTypes {
  swap = "swap",
  add = "add",
  withdraw = "withdraw",
  createPool = "createPool",
}

export enum SwapOrPools {
  swap = "swap",
  pools = "pools",
}

export enum CrosschainTransactionTypes {
  crossIn = "crossIn",
  crossOut = "crossOut",
}
