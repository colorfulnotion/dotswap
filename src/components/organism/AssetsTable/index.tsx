import AccordionAssetItem from "../../molecule/AccordionAssetItem";
import AccordionList from "../../molecule/AccordionList";
import { useAppContext } from "../../../state";
import { Dispatch, useEffect, useState } from "react";
import { whitelist } from "../../../whitelist";
import AssetItemChild from "../../molecule/AccordionAssetItem/AssetItemChild";
import Modal from "../../atom/Modal";
import SwapTokens from "../SwapTokens";
import { formatDecimalsFromToken, formatNumberEnUs, getAssetTokenSpotPrice } from "../../../app/util/helper";
import { AssetListToken } from "../../../app/types";
import { ActionType } from "../../../app/types/enum";
import ConnectWallet from "../ConnectWallet";
import { LottieLarge } from "../../../assets/loader";
import LocalStorage from "../../../app/util/localStorage.ts";
import { WalletAction } from "../../../store/wallet/interface.ts";
import { t } from "i18next";
import Decimal from "decimal.js";
import Tooltip from "../../atom/Tooltip/index.tsx";

const AssetsTable = () => {
  const { state, dispatch } = useAppContext();

  const { tokenBalances, api, assetLoading, assetsList, otherAssets, walletBalanceUSD, selectedAccount } = state;

  const walletConnected = LocalStorage.get("wallet-connected");

  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [swapTokenId, setSwapTokenId] = useState("");

  const updateSpotPrice = async (tokens: AssetListToken[]) => {
    const newTokens = await Promise.all(
      tokens.map(async (token: AssetListToken) => {
        if (token.tokenId !== "1984" && token.tokenId !== "1337") {
          // get price from pool instead of spot price
          if (!api || !tokenBalances) return token;

          const spotPrice = await getAssetTokenSpotPrice(
            api,
            token.tokenId,
            token.assetTokenMetadata.decimals,
            tokenBalances
          );

          return {
            ...token,
            spotPrice: spotPrice.toString() || "0",
          };
        }

        return token;
      })
    );

    return newTokens;
  };

  const calculateBalance = async (tokens: AssetListToken[], dispatch: Dispatch<WalletAction>) => {
    let totalUsdBalance = 0;

    tokens.map((token: AssetListToken) => {
      const formattedBalance =
        token.tokenId === tokens[0].tokenId
          ? token.tokenAsset.totalBalance
          : formatDecimalsFromToken(
              Number(token.tokenAsset.balance?.replace(/[, ]/g, "")),
              token.assetTokenMetadata.decimals as string
            );

      const totalBalance = Number(formattedBalance || "0");

      const usdTotalBalance = new Decimal(token.spotPrice || "0").times(totalBalance).toNumber();

      totalUsdBalance += usdTotalBalance;

      return token;
    });

    dispatch({ type: ActionType.SET_WALLET_BALANCE_USD, payload: totalUsdBalance });
  };

  const setTokens = async () => {
    if (tokenBalances && tokenBalances.assets && api) {
      const balance = new Decimal(tokenBalances.balanceAsset.free).minus(tokenBalances.balanceAsset.frozen);
      const relayBalance = new Decimal(tokenBalances.balanceRelay.free).minus(tokenBalances.balanceRelay.frozen);
      const totalBalance = new Decimal(tokenBalances.balanceAsset.free)
        .plus(tokenBalances.balanceRelay.free)
        .plus(tokenBalances.balanceAsset.reserved)
        .plus(tokenBalances.balanceRelay.reserved);
      const nativeToken: AssetListToken = {
        tokenId: "",
        assetTokenMetadata: {
          symbol: tokenBalances.tokenSymbol,
          name: tokenBalances.tokenSymbol,
          decimals: tokenBalances.tokenDecimals,
        },
        tokenAsset: {
          balance: balance.toString(),
          relayBalance: relayBalance.toString(),
          totalBalance: totalBalance.toString(),
        },
        spotPrice: tokenBalances.spotPrice,
      };

      const otherTokens = tokenBalances.assets.filter(
        (token: AssetListToken) => token.tokenId !== nativeToken.tokenId && !whitelist.includes(token.tokenId)
      );

      const whitelistedTokens = tokenBalances.assets.filter(
        (token: AssetListToken) => token.tokenId === nativeToken.tokenId || whitelist.includes(token.tokenId)
      );

      const whitelistedTokensUpdated = await updateSpotPrice(whitelistedTokens);
      const assetTokens = [nativeToken, ...whitelistedTokensUpdated];

      await calculateBalance(assetTokens, dispatch);

      dispatch({ type: ActionType.SET_ASSETS_LIST, payload: assetTokens });
      dispatch({ type: ActionType.SET_OTHER_ASSETS, payload: otherTokens });
    }
  };

  useEffect(() => {
    if (!tokenBalances || !selectedAccount.address) return;
    setTokens().then();
  }, [tokenBalances, selectedAccount.address]);

  const handleSwapModal = (tokenId: string) => {
    if (!tokenId) return;
    setSwapTokenId(tokenId);
    setSwapModalOpen(!swapModalOpen);
  };

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex w-full justify-between px-8 py-4 dedswap:text-white">
        <div className="flex flex-col items-start justify-center">
          <div className="flex items-center gap-2">
            <div className="font-titillium-web text-heading-6 font-semibold leading-[24px] text-dark-300 dedswap:text-white">
              {t("dashboardPage.myTotalAssets")}
            </div>
            <Tooltip message={t("dashboardPage.totalAssetsTooltip")} invertedStyle={true} />
          </div>
          <div className="font-titillium-web text-heading-3 font-semibold leading-[48px]">
            {!walletConnected ? "$0.00" : "$" + formatNumberEnUs(Number(walletBalanceUSD) || 0)}
          </div>
        </div>
        <div className="flex flex-col items-start justify-center">
          <div className="flex items-center gap-2 font-titillium-web text-heading-6 font-semibold leading-[24px] text-dark-300 dedswap:text-white">
            {tokenBalances?.tokenSymbol} {t("dashboardPage.price")}
            <Tooltip message={t("dashboardPage.tokenPriceTooltip")} invertedStyle={true} />
          </div>
          <div className="font-titillium-web text-heading-3 font-semibold leading-[48px]">
            {!walletConnected ? "$0.00" : "$" + formatNumberEnUs(Number(tokenBalances?.spotPrice || 0))}
          </div>
        </div>
      </div>
      {assetsList.length === 0 ? (
        <div className="flex w-full flex-1 flex-col gap-6">
          <div className="mb-4 flex flex-1 flex-col items-center justify-center gap-6 rounded-2xl bg-white dedswap:rounded-none dedswap:bg-opacity-80 dedswap:outline dedswap:outline-8 dedswap:outline-black">
            <div className="font-unbounded-variable text-medium font-normal text-dark-300 dedswap:font-open-sans dedswap:text-large dedswap:font-extrabold">
              {walletConnected ? t("dashboardPage.loadingAssets") : t("dashboardPage.connectWallet")}
            </div>
            <div className="flex w-full flex-col items-center justify-center gap-4">
              {walletConnected ? (
                <LottieLarge />
              ) : (
                <div className="flex">
                  <ConnectWallet />
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6 dedswap:gap-0 dedswap:bg-[#FFFFFFCC] dedswap:outline dedswap:outline-8 dedswap:outline-black">
          <AccordionList
            title={t("dashboardPage.assetList")}
            nested
            alwaysOpen
            className="rounded-t-2xl bg-white dedswap:rounded-none dedswap:bg-opacity-80"
          >
            {assetsList &&
              assetsList.length > 0 &&
              assetsList.map((token: AssetListToken) => {
                return (
                  <AccordionAssetItem
                    key={token.tokenId}
                    token={token}
                    handleSwapModal={(tokenId) => {
                      handleSwapModal(tokenId);
                    }}
                  >
                    {token.tokenId === "" ? (
                      <div className="flex w-full flex-col gap-2">
                        <AssetItemChild
                          tokenSymbol={token.assetTokenMetadata.symbol}
                          tokenSpotPrice={token.spotPrice}
                          isRelayChain
                        />
                        <AssetItemChild
                          tokenSymbol={token.assetTokenMetadata.symbol}
                          tokenSpotPrice={token.spotPrice}
                        />
                      </div>
                    ) : null}
                  </AccordionAssetItem>
                );
              })}
          </AccordionList>

          <AccordionList
            nested
            title={t("dashboardPage.otherAssets")}
            className="rounded-b-2xl bg-white dedswap:rounded-none dedswap:bg-opacity-80"
          >
            {assetLoading ? (
              <div className="flex flex-col items-center justify-center py-8">{t("dashboardPage.loadingAssets")}</div>
            ) : otherAssets.length > 0 ? (
              otherAssets.map((token: AssetListToken) => {
                return <AccordionAssetItem key={token.tokenId} token={token} />;
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-8 dedswap:font-open-sans dedswap:font-extrabold">
                {t("dashboardPage.noAssets")}
              </div>
            )}
          </AccordionList>
        </div>
      )}

      <Modal
        isOpen={swapModalOpen}
        disableOverlayClick={true}
        classNames="rounded-2xl border border-gray-10 bg-white shadow-modal-box-shadow dedswap:bg-transparent dedswap:shadow-none dedswap:border-none"
        onClose={() => {
          setSwapModalOpen(!swapModalOpen);
        }}
      >
        <SwapTokens tokenId={swapTokenId} />
      </Modal>
    </div>
  );
};
export default AssetsTable;
