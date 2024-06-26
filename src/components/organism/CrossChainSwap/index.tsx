import { useEffect, useState, useMemo } from "react";
import Decimal from "decimal.js";
import { ButtonVariants, ToasterType } from "../../../app/types/enum";
import Button from "../../atom/Button";
import CrossChainBtnIcon from "../../../assets/img/switch-arrow.svg?react";
import TokenAmountInput from "../../molecule/TokenAmountInput";
import DotToken from "../../../assets/img/dot-token.svg?react";
import AssetHub from "../../../assets/img/asset-hub.svg?react";
import { TokenProps, TokenDecimalsErrorProps } from "../../../app/types";
import { t } from "i18next";
import SwapSelectTokenModal from "../SwapSelectTokenModal";
import { ActionType, TokenSelection, CrosschainTransactionTypes } from "../../../app/types/enum";
import { useAppContext } from "../../../state";
import { LottieMedium } from "../../../assets/loader";
import DestinationWalletAddress from "../../molecule/DestinationWalletAddress";
import CrosschainReviewTransactionModal from "../CrosschainReviewTransactionModal";
import {
  formatDecimalsFromToken,
  formatInputTokenValue,
  formatNumberEnUs,
  getCrossInDestinationFee,
  getCrossOutDestinationFee,
  getPlatform,
  isApiAvailable,
} from "../../../app/util/helper";
import { fetchChainBalance } from "../../../services/polkadotWalletServices";
import TokenIcon from "../../atom/TokenIcon";
import {
  calculateCrosschainMaxAmount,
  calculateOriginFee,
  createCrossInExtrinsic,
  createCrossOutExtrinsic,
  executeCrossIn,
  executeCrossOut,
} from "../../../services/crosschain";
import WarningMessage from "../../atom/WarningMessage";
import dotAcpToast from "../../../app/util/toast";

type CrossChainSwapProps = {
  isPopupEdit?: boolean;
};

type TokenValueProps = {
  tokenValue: string;
};

const CrossChainSwap = ({ isPopupEdit = true }: CrossChainSwapProps) => {
  const { state, dispatch } = useAppContext();

  const {
    tokenBalances,
    api,
    selectedAccount,
    // crosschainFinalized,
    relayApi,
    crosschainExactTokenAmount,
    crosschainOriginChainFee,
    crosschainDestinationChainFee,
    crosschainDestinationWalletAddress,
    crosschainLoading,
    crosschainSelectedChain,
    crosschainExtrinsic,
    assetLoading,
  } = state;

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenProps>({
    tokenSymbol: "",
    tokenId: "0",
    decimals: "",
    tokenBalance: "",
  });

  useEffect(() => {
    setSelectedToken({
      tokenSymbol: "",
      tokenId: "0",
      decimals: "",
      tokenBalance: "",
    });

    handleTokenValueChange("").then();
  }, [api]);

  const existentialDeposit =
    tokenBalances && tokenBalances.existentialDeposit && tokenBalances.existentialDepositRelay
      ? crosschainSelectedChain.chainA.chainType === "Asset Hub"
        ? formatDecimalsFromToken(tokenBalances.existentialDeposit.replace(/[, ]/g, ""), tokenBalances.tokenDecimals)
        : formatDecimalsFromToken(
            tokenBalances.existentialDepositRelay.replace(/[, ]/g, ""),
            tokenBalances.tokenDecimals
          )
      : "0";

  const fetchData = async () => {
    if (!crosschainDestinationWalletAddress || !tokenBalances || !tokenBalances.tokenDecimals || !api || !relayApi)
      return;
    try {
      const [chainA, chainB] = await Promise.all([
        fetchChainBalance(selectedAccount.address, tokenBalances.tokenDecimals?.toString(), api),
        fetchChainBalance(selectedAccount.address, tokenBalances.tokenDecimals?.toString(), relayApi),
      ]);

      if (!chainA || !chainB) return;

      dispatch({
        type: ActionType.SET_TOKEN_BALANCES,
        payload: {
          ...tokenBalances,
          balanceAsset: chainA.balances,
          balanceRelay: chainB.balances,
        },
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const [destinationWalletBalance, setDestinationWalletBalance] = useState<string>("");

  useEffect(() => {
    if (
      !tokenBalances ||
      !selectedAccount ||
      !crosschainDestinationWalletAddress ||
      !relayApi ||
      !api ||
      selectedAccount.address === crosschainDestinationWalletAddress
    )
      return;
    fetchChainBalance(
      crosschainDestinationWalletAddress,
      tokenBalances.tokenDecimals?.toString(),
      crosschainSelectedChain.chainB.chainType === "Relay Chain" ? relayApi : api
    ).then((data) => {
      if (!data) return;
      setDestinationWalletBalance(data.balances.free);
    });
  }, [selectedAccount, crosschainDestinationWalletAddress, crosschainSelectedChain, api, relayApi, tokenBalances]);

  const handleChainSwitch = () => {
    if (crosschainExactTokenAmount === "0") {
      handleTokenValueChange("").then();
    }
    dispatch({
      type: ActionType.SET_CROSSCHAIN_SELECTED_CHAIN,
      payload: {
        chainA: crosschainSelectedChain.chainB,
        chainB: crosschainSelectedChain.chainA,
      },
    });
  };

  useEffect(() => {
    const destinationChainFee =
      crosschainSelectedChain.chainA.chainType === "Asset Hub"
        ? getCrossInDestinationFee()
        : getCrossOutDestinationFee();
    dispatch({
      type: ActionType.SET_CROSSCHAIN_DESTINATION_CHAIN_FEE,
      payload: destinationChainFee,
    });
  }, [crosschainOriginChainFee]);

  const createExtrinsic = async () => {
    let extrinsic = null;
    if (
      !tooManyDecimalsError.isError &&
      selectedToken.tokenBalance !== "" &&
      selectedTokenValue.tokenValue !== "" &&
      selectedTokenValue.tokenValue !== "0"
    ) {
      extrinsic =
        crosschainSelectedChain.chainA.chainType === "Asset Hub" && api
          ? await createCrossInExtrinsic(
              api,
              formatInputTokenValue(selectedTokenValue.tokenValue, selectedToken.decimals),
              crosschainDestinationWalletAddress
            )
          : relayApi
            ? await createCrossOutExtrinsic(
                relayApi,
                formatInputTokenValue(selectedTokenValue.tokenValue, selectedToken.decimals),
                crosschainDestinationWalletAddress
              )
            : null;
    }
    dispatch({ type: ActionType.SET_CROSSCHAIN_EXTRINSIC, payload: extrinsic });
  };

  useEffect(() => {
    if (!api || !relayApi) return;
    createExtrinsic().then();
  }, [
    crosschainExactTokenAmount,
    selectedToken.tokenBalance,
    crosschainSelectedChain,
    api,
    relayApi,
    crosschainDestinationWalletAddress,
  ]);

  const setOriginChainFee = async () => {
    if (api && relayApi) {
      const selectedApi = crosschainSelectedChain.chainA.chainType === "Asset Hub" ? api : relayApi;
      const originChainFee = await calculateOriginFee(selectedApi, selectedAccount, crosschainExtrinsic);
      dispatch({ type: ActionType.SET_CROSSCHAIN_ORIGIN_CHAIN_FEE, payload: originChainFee });
    }
  };

  useEffect(() => {
    if (crosschainExtrinsic) setOriginChainFee().then();
  }, [crosschainExtrinsic]);

  const assetHubChainAvailableBalance = new Decimal(Number(tokenBalances?.balanceAsset?.free || 0)).minus(
    Number(tokenBalances?.balanceAsset?.frozen || 0)
  );
  const relayChainAvailableBalance = new Decimal(Number(tokenBalances?.balanceRelay?.free || 0)).minus(
    Number(tokenBalances?.balanceRelay?.frozen || 0)
  );

  const availableBalanceA =
    crosschainSelectedChain.chainA.chainType === "Asset Hub"
      ? assetHubChainAvailableBalance
      : relayChainAvailableBalance;
  const availableBalanceB =
    crosschainSelectedChain.chainB.chainType === "Asset Hub"
      ? assetHubChainAvailableBalance
      : relayChainAvailableBalance;

  const nativeToken = {
    tokenId: "",
    assetTokenMetadata: {
      symbol: tokenBalances?.tokenSymbol,
      name: tokenBalances?.tokenSymbol,
      decimals: tokenBalances?.tokenDecimals,
    },
    tokenAsset: {
      balance: availableBalanceA.toString(),
    },
  };

  const [tokenSelectionModal, setTokenSelectionModal] = useState<TokenSelection>(TokenSelection.None);
  const [availablePoolToken, setAvailablePoolToken] = useState<TokenProps[]>([]);

  const getTokenA = async () => {
    if (api) {
      const assetTokens = [nativeToken];
      setAvailablePoolToken(assetTokens as any);
    }
  };

  const tokenValue = async (value?: string) => {
    if (value) {
      value = new Decimal(value).toFixed();

      if (value.includes(".")) {
        if (value.split(".")[1].length > parseInt(selectedToken.decimals)) {
          setTooManyDecimalsError({
            tokenSymbol: selectedToken.tokenSymbol,
            isError: true,
            decimalsAllowed: parseInt(selectedToken.decimals),
          });
          return value;
        }
      }

      setTooManyDecimalsError({
        tokenSymbol: "",
        isError: false,
        decimalsAllowed: 0,
      });

      setSelectedTokenValue({ tokenValue: value });
      return value;
    } else {
      setSelectedTokenValue({ tokenValue: "" });
      return "";
    }
  };

  const fillTokenPairsAndOpenModal = (tokenInputSelected: TokenSelection) => {
    if (tokenInputSelected === "tokenA") getTokenA().then();
    setTokenSelectionModal(tokenInputSelected);
  };

  const tokenSelectModal = (tokenData: any) => {
    setSelectedToken((prev) => {
      return {
        ...prev,
        [tokenSelectionModal]: tokenData,
      };
    });
  };

  const [tooManyDecimalsError, setTooManyDecimalsError] = useState<TokenDecimalsErrorProps>({
    tokenSymbol: "",
    isError: false,
    decimalsAllowed: 0,
  });

  const [selectedTokenValue, setSelectedTokenValue] = useState<TokenValueProps>({ tokenValue: "" });

  const [maxValue, setMaxValue] = useState<string>("");
  const [isGreaterThanMax, setIsGreaterThanMax] = useState<boolean>(false);

  useEffect(() => {
    if (
      !selectedToken.tokenSymbol ||
      !selectedToken.tokenBalance ||
      !crosschainSelectedChain ||
      !selectedAccount ||
      !api ||
      !relayApi ||
      !crosschainDestinationWalletAddress ||
      !existentialDeposit
    )
      return;

    calculateCrosschainMaxAmount(
      availableBalanceA.toString(),
      selectedToken.decimals,
      crosschainSelectedChain.chainA.chainType === "Asset Hub"
        ? CrosschainTransactionTypes.crossIn
        : CrosschainTransactionTypes.crossOut,
      crosschainDestinationWalletAddress,
      crosschainSelectedChain.chainA.chainType === "Asset Hub" ? api : relayApi,
      existentialDeposit,
      selectedAccount
    ).then((value) => {
      setMaxValue(value);
    });
  }, [
    selectedToken.tokenSymbol,
    selectedToken.tokenBalance,
    selectedToken.decimals,
    crosschainSelectedChain,
    selectedAccount,
    api,
    relayApi,
    crosschainDestinationWalletAddress,
    existentialDeposit,
  ]);

  const tokenBalanceDecimal = new Decimal(Number(maxValue) || 0);

  const getCrosschainButtonProperties = useMemo(() => {
    const tokenDecimals = new Decimal(selectedTokenValue.tokenValue || 0);
    if (tokenBalances?.assets) {
      if (selectedToken.tokenSymbol === "") {
        return { label: t("button.selectToken"), disabled: true };
      }
      if (tokenDecimals.lte(0) || crosschainExactTokenAmount === "" || crosschainExactTokenAmount === "0") {
        return { label: t("button.enterAmount"), disabled: true };
      }
      if (
        selectedToken.tokenSymbol === nativeToken.assetTokenMetadata.symbol &&
        (tokenDecimals.gt(tokenBalanceDecimal) ||
          tokenDecimals.minus(Number(crosschainOriginChainFee) || 0).lt(0) ||
          tokenDecimals
            .minus(Number(crosschainOriginChainFee) || 0)
            .minus(Number(crosschainDestinationChainFee) || 0)
            .lt(0))
      ) {
        return {
          label: t("button.insufficientTokenAmount", { token: nativeToken.assetTokenMetadata.symbol }),
          disabled: true,
        };
      }
      if (
        selectedToken.tokenSymbol !== nativeToken.assetTokenMetadata.symbol &&
        tokenDecimals.gt(
          formatDecimalsFromToken(selectedToken.tokenBalance.replace(/[, ]/g, ""), selectedToken.decimals)
        )
      ) {
        return {
          label: t("button.insufficientTokenAmount", { token: selectedToken.tokenSymbol }),
          disabled: true,
        };
      }
      if (
        selectedToken.tokenSymbol === nativeToken.assetTokenMetadata.symbol &&
        tokenDecimals.lt(tokenBalanceDecimal) &&
        !tooManyDecimalsError.isError
      ) {
        return {
          label: t(`button.${crosschainSelectedChain.chainA.chainType !== "Relay Chain" ? "crossIn" : "crossOut"}`),
          disabled: false,
        };
      }
      if (
        selectedToken.tokenSymbol !== nativeToken.assetTokenMetadata.symbol &&
        tokenDecimals.gt(0) &&
        !tooManyDecimalsError.isError
      ) {
        return {
          label: t(`button.${crosschainSelectedChain.chainA.chainType !== "Relay Chain" ? "crossIn" : "crossOut"}`),
          disabled: false,
        };
      }
      if (tokenDecimals.gt(0) && !tooManyDecimalsError.isError) {
        return {
          label: t(`button.${crosschainSelectedChain.chainA.chainType !== "Relay Chain" ? "crossIn" : "crossOut"}`),
          disabled: false,
        };
      }
    } else {
      return { label: t("button.connectWallet"), disabled: true };
    }

    return { label: t("button.selectToken"), disabled: true };
  }, [
    selectedAccount?.address,
    tooManyDecimalsError.isError,
    tokenBalances?.balanceAsset,
    selectedToken.decimals,
    selectedToken.tokenBalance,
    selectedToken.tokenSymbol,
    crosschainExactTokenAmount,
    crosschainSelectedChain.chainA.chainType,
    crosschainLoading,
    selectedTokenValue.tokenValue,
    crosschainSelectedChain,
    maxValue,
  ]);

  useEffect(() => {
    if (Object.keys(selectedAccount).length === 0) {
      setSelectedTokenValue({ tokenValue: "" });
      setSelectedToken({
        tokenSymbol: "",
        tokenId: "0",
        decimals: "",
        tokenBalance: "",
      });
    }
  }, [selectedAccount]);

  useEffect(() => {
    if (!selectedToken.tokenSymbol && !assetLoading) {
      setSelectedToken({
        tokenSymbol: nativeToken.assetTokenMetadata.symbol || "",
        tokenId: "",
        decimals: nativeToken.assetTokenMetadata.decimals || "",
        tokenBalance: nativeToken.tokenAsset.balance?.toString() || "",
      });
      tokenSelectModal(nativeToken);
    }
  }, [assetLoading, api, selectedAccount]);

  // maxTriggered flag is set to true when the user clicks on the max button
  // This will calculate the max amount that can be transferred based on the available balance
  // And update the input field with the calculated amount after which the extrinsic will be created
  // and the origin chain fee will be calculated
  const handleTokenValueChange = async (value: string, maxTriggered?: boolean) => {
    let payloadTokenValue = "";
    setIsGreaterThanMax(false);
    if (maxTriggered) {
      const isApiReady = api && relayApi && (await isApiAvailable(api, relayApi));
      if (!isApiReady) {
        dotAcpToast.error(t("error.api.notReady"), undefined, null);
        return;
      }
      payloadTokenValue = await tokenValue(
        await calculateCrosschainMaxAmount(
          value,
          selectedToken.decimals,
          crosschainSelectedChain.chainA.chainType === "Asset Hub"
            ? CrosschainTransactionTypes.crossIn
            : CrosschainTransactionTypes.crossOut,
          crosschainDestinationWalletAddress,
          crosschainSelectedChain.chainA.chainType === "Asset Hub" ? api : relayApi,
          existentialDeposit,
          selectedAccount
        )
      );
    } else {
      payloadTokenValue = await tokenValue(value);
    }
    dispatch({ type: ActionType.SET_CROSSCHAIN_EXACT_TOKEN_AMOUNT, payload: payloadTokenValue });

    if (
      payloadTokenValue !== "0" &&
      payloadTokenValue !== "" &&
      //   Number(payloadTokenValue) < availableBalanceA.toNumber() &&
      Number(payloadTokenValue) > tokenBalanceDecimal.toNumber()
    ) {
      setIsGreaterThanMax(true);
    }

    const destinationChainFee =
      crosschainSelectedChain.chainA.chainType === "Asset Hub"
        ? getCrossInDestinationFee()
        : getCrossOutDestinationFee();
    dispatch({
      type: ActionType.SET_CROSSCHAIN_DESTINATION_CHAIN_FEE,
      payload: destinationChainFee,
    });
  };

  const handleMaxClick = () => {
    handleTokenValueChange(availableBalanceA.toString(), true).then();
  };

  const handleCrosschain = () => {
    dispatch({ type: ActionType.SET_CROSSCHAIN_LOADING, payload: true });
    setReviewModalOpen(true);
  };

  const handleCrosschainExec = async () => {
    const isApiReady = api && relayApi && (await isApiAvailable(api, relayApi));
    if (!isApiReady) {
      dotAcpToast.error(t("error.api.notReady"), undefined, null);
      return;
    }
    setReviewModalOpen(false);
    if (crosschainExtrinsic) {
      dispatch({
        type: ActionType.REMOVE_NOTIFICATION,
        payload: "crosschain",
      });
      dispatch({
        type: ActionType.ADD_NOTIFICATION,
        payload: {
          id: "crosschain",
          notificationModalOpen: true,
          notificationPercentage: 1,
          notificationAction: crosschainSelectedChain.chainA.chainType === "Asset Hub" ? "Cross in" : "Cross out",
          notificationType: ToasterType.PENDING,
          notificationTitle: t("modal.notifications.transactionInitiatedTitle", {
            platform: getPlatform(),
          }),
          notificationMessage: "Please proceed in your wallet",
          notificationChainDetails: {
            originChain: crosschainSelectedChain.chainA.chainName + " " + crosschainSelectedChain.chainA.chainType,
            destinationChain: crosschainSelectedChain.chainB.chainType,
          },
          notificationTransactionDetails: {
            fromToken: {
              symbol: selectedToken.tokenSymbol,
              amount: parseFloat(crosschainExactTokenAmount),
            },
          },
          notificationLink: null,
        },
      });
      if (crosschainSelectedChain.chainA.chainType === "Relay Chain" && relayApi) {
        await executeCrossOut(relayApi, selectedAccount, crosschainExtrinsic, dispatch)
          .then(() => {
            fetchData();
            dispatch({ type: ActionType.SET_CROSSCHAIN_LOADING, payload: false });
          })
          .catch((error) => {
            dispatch({ type: ActionType.SET_CROSSCHAIN_LOADING, payload: false });
            console.error("Error executing crosschain:", error);
          })
          .finally(() => {
            setSelectedTokenValue({ tokenValue: "" });
          });
      } else if (crosschainSelectedChain.chainB.chainType === "Relay Chain" && api) {
        await executeCrossIn(api, selectedAccount, crosschainExtrinsic, dispatch)
          .then(() => {
            fetchData();
            dispatch({ type: ActionType.SET_CROSSCHAIN_LOADING, payload: false });
          })
          .catch((error) => {
            dispatch({ type: ActionType.SET_CROSSCHAIN_LOADING, payload: false });
            console.error("Error executing crosschain:", error);
          })
          .finally(() => {
            setSelectedTokenValue({ tokenValue: "" });
          });
      } else {
        // TODO: implement teleportation across parachains here
      }
    }
  };

  const destinationChainFee = new Decimal(Number(crosschainDestinationChainFee)).toString();

  const originChainFee = new Decimal(Number(crosschainOriginChainFee)).toString();

  return (
    <div className="flex w-full max-w-[552px] flex-col items-center justify-center gap-5">
      <div className="relative flex w-full gap-7 rounded-2xl bg-white p-8 dedswap:rounded-sm dedswap:border-8 dedswap:border-black dedswap:bg-opacity-80">
        <div className="flex basis-1/2 items-center gap-1 rounded-lg bg-purple-100 px-4 py-6 dedswap:rounded-sm dedswap:border-8 dedswap:border-black dedswap:bg-white">
          <div className="flex items-center justify-center">
            {crosschainSelectedChain.chainA.chainType === "Asset Hub" ? (
              <AssetHub width={37} height={35} />
            ) : (
              <DotToken width={37} height={35} />
            )}
          </div>
          <div className="flex flex-1 flex-col items-start justify-center">
            <div className="text-small font-normal leading-[13.2px] tracking-[.3px] text-gray-100 dedswap:font-extrabold dedswap:uppercase">
              {t("crosschainPage.from")}
            </div>
            <div className="text-left text-base font-normal leading-[19.2px] tracking-[.2px] dedswap:font-extrabold">
              {crosschainSelectedChain.chainA.chainName + " " + crosschainSelectedChain.chainA.chainType}
            </div>
          </div>
        </div>
        <div className="flex basis-1/2 items-center gap-1 rounded-lg bg-purple-100 px-4 py-6 dedswap:rounded-sm dedswap:border-8 dedswap:border-black dedswap:bg-white">
          <div className="flex flex-1 flex-col items-end justify-center">
            <div className="text-small font-normal leading-[13.2px] tracking-[.3px] text-gray-100 dedswap:font-extrabold dedswap:uppercase">
              {t("crosschainPage.to")}
            </div>
            <div className="text-right text-base font-normal leading-[19.2px] tracking-[.2px] dedswap:font-extrabold">
              {crosschainSelectedChain.chainB.chainName + " " + crosschainSelectedChain.chainB.chainType}
            </div>
          </div>
          <div className="flex items-center justify-center">
            {crosschainSelectedChain.chainB.chainType === "Relay Chain" ? (
              <DotToken width={37} height={35} />
            ) : (
              <AssetHub width={37} height={35} />
            )}
          </div>
        </div>
        <button
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 dedswap:rounded-md dedswap:border-8 dedswap:border-black dedswap:bg-white"
          onClick={() => {
            handleChainSwitch();
          }}
          disabled={!selectedAccount || crosschainLoading || !tokenBalances?.assets}
        >
          <CrossChainBtnIcon className="-rotate-90 hover:rotate-90 hover:cursor-pointer" width={42} height={42} />
        </button>
      </div>
      <div className="flex w-full flex-col gap-[14px] rounded-2xl bg-white p-8 dedswap:rounded-sm dedswap:border-8 dedswap:border-black dedswap:bg-opacity-80">
        <div className="flex w-full flex-col gap-[6px]">
          <div>
            <TokenAmountInput
              tokenText={selectedToken?.tokenSymbol}
              tokenBalance={
                selectedToken.tokenBalance ? availableBalanceA.toFixed(Number(selectedToken.decimals)).toString() : "0"
              }
              showUSDValue={selectedToken.tokenBalance !== ""}
              spotPrice={selectedToken.tokenId !== "" ? "0" : tokenBalances?.spotPrice}
              tokenId={selectedToken?.tokenId}
              tokenDecimals={selectedToken?.decimals}
              labelText={t("crosschainPage.transfer")}
              tokenIcon={<TokenIcon tokenSymbol={selectedToken.tokenSymbol} width={"24px"} height={"24px"} />}
              tokenValue={selectedTokenValue?.tokenValue}
              onClick={() => fillTokenPairsAndOpenModal(TokenSelection.TokenA)}
              onSetTokenValue={(value) => {
                handleTokenValueChange(value).then();
              }}
              disabled={!selectedAccount || crosschainLoading || !tokenBalances?.assets}
              selectDisabled={true}
              assetLoading={assetLoading}
              onMaxClick={handleMaxClick}
              maxVisible={true}
              className="dedswap:mb-0"
            />
          </div>
          <DestinationWalletAddress
            chainName={crosschainSelectedChain.chainB.chainName + " " + crosschainSelectedChain.chainB.chainType}
            isPopupEdit={isPopupEdit}
          />

          <div>
            <Button
              onClick={() => {
                handleCrosschain();
              }}
              disabled={getCrosschainButtonProperties.disabled || crosschainLoading}
              variant={ButtonVariants.btnInteractivePink}
            >
              {!selectedAccount || crosschainLoading ? <LottieMedium /> : getCrosschainButtonProperties.label}
            </Button>
          </div>
        </div>
        {selectedTokenValue.tokenValue !== "" &&
        selectedTokenValue.tokenValue !== "0" &&
        !tooManyDecimalsError.isError &&
        selectedToken.tokenBalance !== "" ? (
          <div className="flex w-full flex-col gap-3 rounded-2xl bg-purple-50 px-4 py-3 dedswap:rounded-sm dedswap:border-8 dedswap:border-black dedswap:bg-white dedswap:font-open-sans dedswap:font-extrabold">
            <div className="flex w-full items-center justify-between text-medium">
              <div className="capitalize text-gray-300">{t("crosschainPage.originChainFee")}</div>
              <span className="text-gray-400">
                ~ {formatNumberEnUs(Number(originChainFee), Number(selectedToken.decimals))} {selectedToken.tokenSymbol}
              </span>
            </div>
            <div className="flex w-full items-center justify-between text-medium">
              <div className="capitalize text-gray-300">{t("crosschainPage.destinationChainFee")}</div>
              <span className="text-gray-400">
                ~ {formatNumberEnUs(Number(destinationChainFee), Number(selectedToken.decimals))}{" "}
                {selectedToken.tokenSymbol}
              </span>
            </div>
            <div className="flex w-full items-center justify-between text-medium tracking-[.2px]">
              <div className="text-gray-300">{t("crosschainPage.route")}</div>
              <div className="flex items-center justify-center gap-[2px] rounded-full bg-pink px-1 py-[2px]">
                <DotToken width={16} height={16} />
                <span className="text-white">XCM</span>
              </div>
            </div>
          </div>
        ) : null}
      </div>
      <SwapSelectTokenModal
        open={tokenSelectionModal === TokenSelection.TokenA}
        title={t("modal.selectToken")}
        tokensData={availablePoolToken}
        onClose={() => setTokenSelectionModal(TokenSelection.None)}
        onSelect={(tokenData) => {
          setSelectedToken(tokenData);
          tokenSelectModal(tokenData);
        }}
        selected={selectedToken}
        showBalance={false}
      />
      <CrosschainReviewTransactionModal
        open={reviewModalOpen}
        tokenSymbol={selectedToken.tokenSymbol}
        tokenDecimals={selectedToken.decimals}
        nativeChainName={crosschainSelectedChain.chainA.chainName + " " + crosschainSelectedChain.chainA.chainType}
        destinationChainName={crosschainSelectedChain.chainB.chainType}
        destinationBalance={
          selectedAccount.address !== crosschainDestinationWalletAddress
            ? destinationWalletBalance
            : availableBalanceB.toString()
        }
        transactionType={
          crosschainSelectedChain.chainA.chainType === "Asset Hub"
            ? CrosschainTransactionTypes.crossIn
            : CrosschainTransactionTypes.crossOut
        }
        onClose={() => {
          dispatch({ type: ActionType.SET_CROSSCHAIN_LOADING, payload: false });
          setReviewModalOpen(false);
        }}
        onConfirmTransaction={() => {
          handleCrosschainExec().then();
        }}
      />
      <WarningMessage
        show={
          (selectedTokenValue.tokenValue === "" && crosschainExactTokenAmount === "0") ||
          //   (maxValue === "0" && !isGreaterThanMax) ||
          (selectedTokenValue.tokenValue !== "" &&
            crosschainExactTokenAmount !== "0" &&
            new Decimal(Number(selectedTokenValue.tokenValue) || 0).lt(
              new Decimal(Number(crosschainOriginChainFee) || 0).plus(
                new Decimal(Number(crosschainDestinationChainFee) || 0)
              )
            ))
        }
        message={t("crosschainPage.insufficientBalanceWarning")}
      />
      <WarningMessage
        show={
          isGreaterThanMax &&
          selectedTokenValue.tokenValue !== "" &&
          selectedTokenValue.tokenValue !== "0" &&
          crosschainExactTokenAmount !== "0" &&
          maxValue !== "0"
        }
        message={`${t("crosschainPage.isGreaterThanMaxWarning")} ${maxValue} ${selectedToken.tokenSymbol}`}
      />
    </div>
  );
};

export default CrossChainSwap;
