import { ApiPromise } from "@polkadot/api";
import { Builder, Extrinsic } from "@paraspell/sdk";
import { getWalletBySource, type WalletAccount } from "@talismn/connect-wallets";
import { Dispatch } from "react";
import { CrosschainAction, CrosschainExtrinsic } from "../../store/crosschain/interface";
import Decimal from "decimal.js";
import { NotificationAction } from "../../store/notifications/interface";
import { ActionType, CrosschainTransactionTypes, ToasterType } from "../../app/types/enum";
import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";
import useGetNetwork from "../../app/hooks/useGetNetwork";
import { calculateMaxAmountForCrossIn, calculateMaxAmountForCrossOut } from "../../app/util/helper";

// Relay chain -> parachain
export const createCrossOutExtrinsic = async (api: ApiPromise, amount: string, destinationAddress: string) => {
  const extrinsic = await Builder(api).to("AssetHubKusama").amount(amount).address(destinationAddress).build();
  return extrinsic;
};

// Parachain -> relay chain
export const createCrossInExtrinsic = async (api: ApiPromise, amount: string, destinationAddress: string) => {
  const extrinsic = await Builder(api).from("AssetHubKusama").amount(amount).address(destinationAddress).build();
  return extrinsic;
};

export const calculateOriginFee = async (account: WalletAccount, extrinsic: CrosschainExtrinsic) => {
  if (extrinsic) {
    const wallet = getWalletBySource(account.wallet?.extensionName);
    if (!wallet?.signer) throw new Error("Wallet signer is not defined.");
    const paymentInfo = await extrinsic.paymentInfo(account.address, { signer: wallet.signer });
    return new Decimal(paymentInfo.partialFee.toString()).dividedBy(Math.pow(10, 12)).toFixed();
  } else {
    return "";
  }
};

export const calculateCrosschainMaxAmount = async (
  freeBalance: string,
  decimals: string,
  crosschainTransactionType: CrosschainTransactionTypes,
  destinationAddress: string,
  api: ApiPromise | null,
  account: WalletAccount
): Promise<string> => {
  let maxAmount = "";
  if (api) {
    let sameFee = false;
    while (!sameFee) {
      const { originFeeA, originFeeB, calculatedMaxAmount } = await recurseMaxAmount(
        freeBalance,
        decimals,
        crosschainTransactionType,
        destinationAddress,
        api,
        account
      );
      if (originFeeA === originFeeB) {
        maxAmount = calculatedMaxAmount;
        sameFee = true;
      }
    }
  }
  return maxAmount;
};

// cross in additional fees for xcm instructions
// 0.0001860629 +
// 0.0002315985 =
// 0.0004176614

const recurseMaxAmount = async (
  tokenAmount: string,
  decimals: string,
  crosschainTransactionType: CrosschainTransactionTypes,
  destinationAddress: string,
  api: ApiPromise,
  account: WalletAccount
): Promise<{ originFeeA: string; originFeeB: string; calculatedMaxAmount: string }> => {
  console.log("tokenAmount", tokenAmount);
  console.log(decimals);
  const tokenAmountDecimal = new Decimal(tokenAmount).times(Math.pow(10, parseInt(decimals))).toFixed();
  console.log("tokenAmountDecimal", tokenAmountDecimal);
  let extrinsic, originFeeA, calculatedMaxAmount;
  if (crosschainTransactionType === CrosschainTransactionTypes.crossIn) {
    extrinsic = await createCrossInExtrinsic(api, tokenAmountDecimal, destinationAddress);
    originFeeA = await calculateOriginFee(account, extrinsic);
    calculatedMaxAmount = calculateMaxAmountForCrossIn(tokenAmount, originFeeA);
  } else {
    extrinsic = await createCrossOutExtrinsic(api, tokenAmountDecimal, destinationAddress);
    originFeeA = await calculateOriginFee(account, extrinsic);
    calculatedMaxAmount = calculateMaxAmountForCrossOut(tokenAmount, originFeeA);
  }
  console.log("originFeeA", originFeeA);
  console.log("calculatedMaxAmount", calculatedMaxAmount);
  const calculatedMaxAmountDecimal = new Decimal(calculatedMaxAmount).times(Math.pow(10, parseInt(decimals))).toFixed();
  console.log("calculatedMaxAmount", calculatedMaxAmountDecimal);
  const verifyingExtrinsic =
    crosschainTransactionType === CrosschainTransactionTypes.crossIn
      ? await createCrossInExtrinsic(api, calculatedMaxAmountDecimal, destinationAddress)
      : await createCrossOutExtrinsic(api, calculatedMaxAmountDecimal, destinationAddress);
  const originFeeB = await calculateOriginFee(account, verifyingExtrinsic);
  console.log("originFeeB", originFeeB);
  return { originFeeA, originFeeB, calculatedMaxAmount };
};

async function setupCallAndSign(
  walletAccount: WalletAccount,
  extrinsic: Extrinsic,
  dispatch: Dispatch<CrosschainAction | NotificationAction>
) {
  const wallet = getWalletBySource(walletAccount.wallet?.extensionName);
  if (!wallet?.signer) throw new Error("Wallet signer is not defined.");
  return await extrinsic
    .signAsync(walletAccount.address, { signer: wallet.signer })
    .then((res) => {
      dispatch({ type: ActionType.SET_NOTIFICATION_TYPE, payload: ToasterType.PENDING });
      dispatch({ type: ActionType.SET_NOTIFICATION_TITLE, payload: "Pending" });
      dispatch({
        type: ActionType.SET_NOTIFICATION_MESSAGE,
        payload: "Transaction is processing. You can close this modal anytime.",
      });

      return res;
    })
    .catch((err) => {
      dispatch({
        type: ActionType.SET_NOTIFICATION_DATA,
        payload: {
          notificationModalOpen: true,
          notificationType: ToasterType.ERROR,
          notificationTitle: "Error",
          notificationMessage: err.message || "Error executing crosschain",
          notificationTransactionDetails: null,
          notificationChainDetails: null,
          notificationLink: null,
        },
      });
    });
}

async function sendTransaction(
  extrinsic: SubmittableExtrinsic<"promise", ISubmittableResult>,
  api: ApiPromise,
  dispatch: Dispatch<CrosschainAction | NotificationAction>,
  subScanURL: string
) {
  return new Promise((resolve, reject) => {
    extrinsic.send(({ status, dispatchError, txHash }) => {
      if (status.isFinalized) {
        if (dispatchError) {
          if (dispatchError.isModule) {
            const { docs, name, section } = api.registry.findMetaError(dispatchError.asModule);
            reject(new Error(`${section}.${name}: ${docs.join(" ")}`));
          } else {
            reject(new Error(dispatchError.toString()));
          }
        } else {
          dispatch({ type: ActionType.SET_CROSSCHAIN_TRANSFER_FINALIZED, payload: true });
          dispatch({ type: ActionType.SET_NOTIFICATION_TYPE, payload: ToasterType.SUCCESS });
          dispatch({ type: ActionType.SET_NOTIFICATION_TITLE, payload: "Success" });
          dispatch({ type: ActionType.SET_NOTIFICATION_MESSAGE, payload: null });
          dispatch({
            type: ActionType.SET_NOTIFICATION_LINK_HREF,
            payload: `${subScanURL}/extrinsic/${txHash.toString()}`,
          });
          resolve(txHash.toString());
        }
      }
    });
  });
}

export const executeCrossOut = async (
  api: ApiPromise,
  walletAccount: WalletAccount,
  extrinsic: Extrinsic,
  dispatch: Dispatch<CrosschainAction | NotificationAction>
) => {
  const signer = await setupCallAndSign(walletAccount, extrinsic, dispatch);
  const { relaySubscanUrl } = useGetNetwork();
  if (!signer || !relaySubscanUrl) return;
  return await sendTransaction(signer, api, dispatch, relaySubscanUrl);
};

export const executeCrossIn = async (
  api: ApiPromise,
  account: WalletAccount,
  extrinsic: Extrinsic,
  dispatch: Dispatch<CrosschainAction | NotificationAction>
) => {
  const signer = await setupCallAndSign(account, extrinsic, dispatch);
  const { assethubSubscanUrl } = useGetNetwork();
  if (!signer || !assethubSubscanUrl) return;
  return await sendTransaction(signer, api, dispatch, assethubSubscanUrl);
};
