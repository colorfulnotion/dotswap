import { FC, useEffect, useReducer } from "react";
import { web3Accounts, web3Enable } from "@polkadot/extension-dapp";
import { setupPolkadotApi, getWalletTokensBalance, toUnit } from "../../services/polkadotWalletServices";
import { reducer, initialState } from "../../state/wallet";
import dotAcpToast from "../../helper/toast";

const SwapPage: FC = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { api, selectedAccount, tokenBalances } = state;

  const callApiSetup = async () => {
    try {
      const polkaApi = await setupPolkadotApi();
      dispatch({ type: "SET_API", payload: polkaApi });
    } catch (error) {
      dotAcpToast.error(`Error setting up Polkadot API: ${error}`);
    }
  };

  useEffect(() => {
    callApiSetup();
  }, []);

  const handleConnection = async () => {
    const extensions = await web3Enable("DOT-ACP-UI");
    if (!extensions) {
      throw Error("No Extension");
    }

    const allAccounts = await web3Accounts();

    dispatch({ type: "SET_ACCOUNTS", payload: allAccounts });
    dispatch({ type: "SET_SELECTED_ACCOUNT", payload: allAccounts[0] });

    if (api) {
      try {
        const walletTokens = await getWalletTokensBalance(api, allAccounts[0].address);
        dispatch({ type: "SET_TOKEN_BALANCES", payload: walletTokens });
        dotAcpToast.success("Success");
      } catch (error) {
        dotAcpToast.error(`Error setting token balances: ${error}`);
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-5 py-10">
      <h1>Swap</h1>
      <button className="border-2 p-2" onClick={handleConnection}>
        Connect
      </button>
      <p>Wallet: {selectedAccount?.meta.source}</p>
      <p>Address: {selectedAccount?.address}</p>
      <p>
        Balance: {tokenBalances?.balance ? tokenBalances?.balance.toString() : ""}{" "}
        {tokenBalances?.tokenSymbol ? tokenBalances?.tokenSymbol.toString() : ""}
      </p>
      <p>Assets:</p>
      <div>
        {tokenBalances?.assets?.map((item: any, index: number) => (
          <div key={index}>
            <ul>
              <li>Name: {item.assetTokenMetadata.name}</li>
              <li>
                {toUnit(item.tokenAsset.balance.replace(/[, ]/g, "").toString(), item.assetTokenMetadata.decimals)}{" "}
                {item.assetTokenMetadata.symbol}
              </li>
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};
export default SwapPage;
