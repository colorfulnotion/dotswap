import { t } from "i18next";
import { useEffect, useMemo, useState } from "react";
import { NumericFormat } from "react-number-format";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { POOLS_PAGE } from "../../../app/router/routes";
import { ReactComponent as BackArrow } from "../../../assets/img/back-arrow.svg";
import { ReactComponent as DotToken } from "../../../assets/img/dot-token.svg";
import { ActionType, ButtonVariants, LiquidityPageType } from "../../../app/types/enum";
import { calculateSlippageReduce, formatDecimalsFromToken, formatInputTokenValue } from "../../../app/util/helper";
import dotAcpToast from "../../../app/util/toast";
import {
  checkWithdrawPoolLiquidityGasFee,
  getAllPools,
  getPoolReserves,
  removeLiquidity,
} from "../../../services/poolServices";
import { useAppContext } from "../../../state";
import Button from "../../atom/Button";
import TokenAmountInput from "../../molecule/TokenAmountInput";
import SwapAndPoolSuccessModal from "../SwapAndPoolSuccessModal";
import PoolSelectTokenModal from "../PoolSelectTokenModal";
import { LpTokenAsset } from "../../../app/types";
import Decimal from "decimal.js";
import classNames from "classnames";
import { lottieOptions } from "../../../assets/loader";
import Lottie from "react-lottie";

type AssetTokenProps = {
  tokenSymbol: string;
  assetTokenId: string;
  decimals: string;
  assetTokenBalance: string;
};
type NativeTokenProps = {
  nativeTokenSymbol: any; //to do
  nativeTokenDecimals: any; //to do
};
type TokenValueProps = {
  tokenValue: number;
};

const WithdrawPoolLiquidity = () => {
  const { state, dispatch } = useAppContext();

  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const {
    tokenBalances,
    api,
    selectedAccount,
    pools,
    transferGasFeesMessage,
    successModalOpen,
    withdrawLiquidityLoading,
    exactNativeTokenWithdraw,
    exactAssetTokenWithdraw,
  } = state;

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedTokenA, setSelectedTokenA] = useState<NativeTokenProps>({
    nativeTokenSymbol: "",
    nativeTokenDecimals: "",
  });
  const [selectedTokenB, setSelectedTokenB] = useState<AssetTokenProps>({
    tokenSymbol: "",
    assetTokenId: "",
    decimals: "",
    assetTokenBalance: "",
  });
  const [selectedTokenNativeValue, setSelectedTokenNativeValue] = useState<TokenValueProps>({ tokenValue: 0 });
  const [selectedTokenAssetValue, setSelectedTokenAssetValue] = useState<TokenValueProps>({ tokenValue: 0 });
  const [nativeTokenWithSlippage, setNativeTokenWithSlippage] = useState<TokenValueProps>({ tokenValue: 0 });
  const [assetTokenWithSlippage, setAssetTokenWithSlippage] = useState<TokenValueProps>({ tokenValue: 0 });
  const [slippageAuto, setSlippageAuto] = useState<boolean>(true);
  const [slippageValue, setSlippageValue] = useState<number | undefined>(15);
  const [lpTokensAmountToBurn, setLpTokensAmountToBurn] = useState<string>("");
  const [minimumTokenAmountExceeded, setMinimumTokenAmountExceeded] = useState<boolean>(false);

  const nativeTokenValue = formatInputTokenValue(
    selectedTokenNativeValue.tokenValue,
    selectedTokenA?.nativeTokenDecimals
  )
    .toLocaleString()
    ?.replace(/[, ]/g, "");
  const assetTokenValue = formatInputTokenValue(selectedTokenAssetValue.tokenValue, selectedTokenB.decimals)
    .toLocaleString()
    ?.replace(/[, ]/g, "");

  const navigateToPools = () => {
    navigate(POOLS_PAGE);
  };

  const populateAssetToken = () => {
    pools?.forEach((pool: any) => {
      if (pool?.[0]?.[1]?.interior?.X2) {
        if (pool?.[0]?.[1]?.interior?.X2?.[1]?.GeneralIndex?.replace(/[, ]/g, "").toString() === params?.id) {
          if (params?.id) {
            const tokenAlreadySelected = tokenBalances?.assets?.find((token: any) => {
              if (params?.id) {
                return token.tokenId === params?.id.toString();
              }
            });
            if (tokenAlreadySelected) {
              setSelectedTokenB({
                tokenSymbol: tokenAlreadySelected?.assetTokenMetadata?.symbol,
                assetTokenId: params?.id,
                decimals: tokenAlreadySelected?.assetTokenMetadata?.decimals,
                assetTokenBalance: tokenAlreadySelected?.tokenAsset?.balance,
              });
            }
          }
        }
      }
    });
  };

  const handlePool = async () => {
    try {
      if (api) {
        await removeLiquidity(
          api,
          selectedTokenB.assetTokenId,
          selectedAccount,
          lpTokensAmountToBurn,
          nativeTokenWithSlippage.tokenValue.toString(),
          assetTokenWithSlippage.tokenValue.toString(),
          selectedTokenA.nativeTokenDecimals,
          selectedTokenB.decimals,
          dispatch
        );
      }
    } catch (error) {
      dotAcpToast.error(`Error: ${error}`);
    }
  };

  const handleWithdrawPoolLiquidityGasFee = async () => {
    if (api)
      await checkWithdrawPoolLiquidityGasFee(
        api,
        selectedTokenB.assetTokenId,
        selectedAccount,
        lpTokensAmountToBurn,
        nativeTokenWithSlippage.tokenValue.toString(),
        assetTokenWithSlippage.tokenValue.toString(),
        dispatch
      );
  };

  const closeSuccessModal = async () => {
    dispatch({ type: ActionType.SET_SUCCESS_MODAL_OPEN, payload: false });
    if (api) await getAllPools(api);
    navigateToPools();
  };

  const getWithdrawButtonProperties = useMemo(() => {
    if (tokenBalances?.assets) {
      if (selectedTokenA && selectedTokenB) {
        if (minimumTokenAmountExceeded) {
          return { label: t("button.minimumTokenAmountExceeded"), disabled: true };
        } else {
          return { label: t("button.withdraw"), disabled: false };
        }
      }
    } else {
      return { label: t("button.connectWallet"), disabled: true };
    }

    return { label: "", disabled: true };
  }, [selectedTokenA.nativeTokenDecimals, selectedTokenB.decimals, minimumTokenAmountExceeded]);

  const getNativeAndAssetTokensFromPool = async () => {
    if (api) {
      const res: any = await getPoolReserves(api, selectedTokenB.assetTokenId);

      const assetTokenInfo: any = await api.query.assets.asset(selectedTokenB.assetTokenId);
      const assetTokenInfoMinBalance = assetTokenInfo.toHuman().minBalance?.replace(/[, ]/g, "");

      const lpTokenTotalAsset: any = await api.query.poolAssets.asset(location?.state?.lpTokenId);

      const lpTotalAssetSupply = lpTokenTotalAsset.toHuman()?.supply?.replace(/[, ]/g, "");

      const lpTokenUserAccount = await api.query.poolAssets.account(
        location?.state?.lpTokenId,
        selectedAccount?.address
      );
      const lpTokenUserAsset = lpTokenUserAccount.toHuman() as LpTokenAsset;
      const lpTokenUserAssetBalance = parseInt(lpTokenUserAsset?.balance?.replace(/[, ]/g, ""));

      setLpTokensAmountToBurn(lpTokenUserAssetBalance.toFixed(0));

      if (res && slippageValue) {
        const nativeTokenInPool = new Decimal(res[0]?.replace(/[, ]/g, ""));
        const nativeTokenOut = nativeTokenInPool
          .mul(new Decimal(lpTokenUserAssetBalance).toNumber())
          .dividedBy(new Decimal(lpTotalAssetSupply).toNumber())
          .floor()
          .toNumber();

        const assetInPool = new Decimal(res[1]?.replace(/[, ]/g, ""));
        const assetOut = assetInPool
          .mul(new Decimal(lpTokenUserAssetBalance).toNumber())
          .dividedBy(new Decimal(lpTotalAssetSupply).toNumber())
          .floor()
          .toNumber();

        const nativeTokenOutFormatted = formatDecimalsFromToken(nativeTokenOut, selectedTokenA?.nativeTokenDecimals);
        const assetOutFormatted = formatDecimalsFromToken(assetOut, selectedTokenB?.decimals);

        const nativeTokenOutSlippage = calculateSlippageReduce(nativeTokenOutFormatted, slippageValue);
        const nativeTokenOutSlippageFormatted = formatInputTokenValue(
          nativeTokenOutSlippage,
          selectedTokenA?.nativeTokenDecimals
        );

        const assetOutSlippage = calculateSlippageReduce(assetOutFormatted, slippageValue);
        const assetOutSlippageFormatted = formatInputTokenValue(assetOutSlippage, selectedTokenB?.decimals);

        setMinimumTokenAmountExceeded(assetInPool.sub(assetOut).lessThanOrEqualTo(assetTokenInfoMinBalance));

        setSelectedTokenNativeValue({
          tokenValue: formatDecimalsFromToken(nativeTokenOut, selectedTokenA?.nativeTokenDecimals),
        });

        setNativeTokenWithSlippage({ tokenValue: parseInt(nativeTokenOutSlippageFormatted) });

        setSelectedTokenAssetValue({ tokenValue: formatDecimalsFromToken(assetOut, selectedTokenB?.decimals) });
        setAssetTokenWithSlippage({ tokenValue: parseInt(assetOutSlippageFormatted) });
      }
    }
  };

  useEffect(() => {
    if (tokenBalances) {
      setSelectedTokenA({
        nativeTokenSymbol: tokenBalances?.tokenSymbol as NativeTokenProps,
        nativeTokenDecimals: tokenBalances?.tokenDecimals as NativeTokenProps,
      });
    }
  }, [tokenBalances]);

  useEffect(() => {
    if (nativeTokenValue && assetTokenValue) {
      handleWithdrawPoolLiquidityGasFee();
    }
  }, [nativeTokenValue, assetTokenValue]);

  useEffect(() => {
    dispatch({ type: ActionType.SET_TRANSFER_GAS_FEES_MESSAGE, payload: "" });
  }, []);

  useEffect(() => {
    if (selectedTokenB.assetTokenId) {
      getNativeAndAssetTokensFromPool();
    }
  }, [selectedTokenB.assetTokenId]);

  useEffect(() => {
    if (params?.id) {
      populateAssetToken();
    }
  }, [params?.id]);

  useEffect(() => {
    getNativeAndAssetTokensFromPool();
  }, [slippageValue]);

  return (
    <div className="relative flex w-full max-w-[460px] flex-col items-center gap-1.5 rounded-2xl bg-white p-5">
      <button className="absolute left-[18px] top-[18px]" onClick={navigateToPools}>
        <BackArrow width={24} height={24} />
      </button>
      <h3 className="heading-6 font-unbounded-variable font-normal">
        {location?.state?.pageType === LiquidityPageType.removeLiquidity
          ? t("poolsPage.removeLiquidity")
          : t("poolsPage.addLiquidity")}
      </h3>
      <hr className="mb-0.5 mt-1 w-full border-[0.7px] border-gray-50" />
      <TokenAmountInput
        tokenText={selectedTokenA?.nativeTokenSymbol}
        labelText={t("poolsPage.withdrawalAmount")}
        tokenIcon={<DotToken />}
        tokenValue={selectedTokenNativeValue?.tokenValue}
        onClick={() => null}
        onSetTokenValue={() => null}
        selectDisabled={true}
        disabled={true}
      />
      <TokenAmountInput
        tokenText={selectedTokenB?.tokenSymbol}
        labelText={t("poolsPage.withdrawalAmount")}
        tokenIcon={<DotToken />}
        tokenValue={selectedTokenAssetValue?.tokenValue}
        onClick={() => setIsModalOpen(true)}
        onSetTokenValue={() => null}
        selectDisabled={true}
        disabled={true}
      />
      <div className="mt-1 text-small">{transferGasFeesMessage}</div>

      <div className="flex w-full flex-col gap-2 rounded-lg bg-purple-50 px-4 py-6">
        <div className="flex w-full justify-between text-medium font-normal text-gray-200">
          <div className="flex">{t("tokenAmountInput.slippageTolerance")}</div>
          <span>{slippageValue}%</span>
        </div>
        <div className="flex w-full gap-2">
          <div className="flex w-full basis-8/12 rounded-xl bg-white p-1 text-large font-normal text-gray-400">
            <button
              className={classNames("flex basis-1/2 justify-center rounded-lg px-4 py-3", {
                "bg-white": !slippageAuto,
                "bg-purple-100": slippageAuto,
              })}
              onClick={() => {
                setSlippageAuto(true);
              }}
            >
              {t("tokenAmountInput.auto")}
            </button>
            <button
              className={classNames("flex basis-1/2 justify-center rounded-lg px-4 py-3", {
                "bg-white": slippageAuto,
                "bg-purple-100": !slippageAuto,
              })}
              onClick={() => setSlippageAuto(false)}
            >
              {t("tokenAmountInput.custom")}
            </button>
          </div>
          <div className="flex basis-1/3">
            <div className="relative flex">
              <NumericFormat
                value={slippageValue}
                onValueChange={({ floatValue }) => setSlippageValue(floatValue)}
                fixedDecimalScale={true}
                thousandSeparator={false}
                allowNegative={false}
                className="w-full rounded-lg bg-purple-100 p-2 text-large  text-gray-200 outline-none"
                placeholder="15"
                disabled={slippageAuto || withdrawLiquidityLoading}
              />
              <span className="absolute bottom-1/3 right-2 text-medium text-gray-100">%</span>
            </div>
          </div>
        </div>
      </div>

      <Button
        onClick={() => (getWithdrawButtonProperties.disabled ? null : handlePool())}
        variant={ButtonVariants.btnInteractivePink}
        disabled={getWithdrawButtonProperties.disabled || withdrawLiquidityLoading}
      >
        {withdrawLiquidityLoading ? (
          <Lottie options={lottieOptions} height={30} width={30} />
        ) : (
          getWithdrawButtonProperties.label
        )}
      </Button>

      <PoolSelectTokenModal
        onSelect={setSelectedTokenB}
        onClose={() => setIsModalOpen(false)}
        open={isModalOpen}
        title={t("button.selectToken")}
      />

      <SwapAndPoolSuccessModal
        open={successModalOpen}
        onClose={closeSuccessModal}
        contentTitle={t("modal.removeFromPool.successfulWithdrawal")}
        actionLabel={t("modal.removeFromPool.withdrawal")}
        tokenA={{
          value: exactNativeTokenWithdraw,
          symbol: selectedTokenA.nativeTokenSymbol,
          icon: <DotToken />,
        }}
        tokenB={{
          value: exactAssetTokenWithdraw,
          symbol: selectedTokenB.tokenSymbol,
          icon: <DotToken />,
        }}
      />
    </div>
  );
};

export default WithdrawPoolLiquidity;
