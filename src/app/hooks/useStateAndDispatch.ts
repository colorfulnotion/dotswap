import { WalletAction } from "../../store/wallet/interface";
import { PoolAction } from "../../store/pools/interface";
import { useEffect, useReducer } from "react";
import {
  initialPoolsState,
  initialSwapState,
  initialWalletState,
  initialCrosschainState,
  poolsReducer,
  swapReducer,
  walletReducer,
  crosschainReducer,
  initialNotificationState,
} from "../../store";
import { setupPolkadotRelayApi, setupPolkadotApi } from "../../services/polkadotWalletServices";
import { ActionType } from "../types/enum";
import dotAcpToast from "../util/toast";
import { SwapAction } from "../../store/swap/interface";
import { CrosschainAction } from "../../store/crosschain/interface";
import { notificationReducer } from "../../store/notifications";
import { NotificationAction } from "../../store/notifications/interface";

const useStateAndDispatch = () => {
  const [walletState, dispatchWallet] = useReducer(walletReducer, initialWalletState);
  const [poolsState, dispatchPools] = useReducer(poolsReducer, initialPoolsState);
  const [swapState, dispatchSwap] = useReducer(swapReducer, initialSwapState);
  const [crosschainState, dispatchCrosschain] = useReducer(crosschainReducer, initialCrosschainState);
  const [notificationState, dispatchNotification] = useReducer(notificationReducer, initialNotificationState);

  const state = { ...walletState, ...poolsState, ...swapState, ...crosschainState, ...notificationState };

  const dispatch = (action: WalletAction | PoolAction | SwapAction | CrosschainAction | NotificationAction) => {
    dispatchWallet(action as WalletAction);
    dispatchPools(action as PoolAction);
    dispatchSwap(action as SwapAction);
    dispatchCrosschain(action as CrosschainAction);
    dispatchNotification(action as NotificationAction);
  };

  useEffect(() => {
    const callApiSetup = async () => {
      try {
        const [api, relayApi] = await Promise.all([setupPolkadotApi(), setupPolkadotRelayApi()]);
        dispatch({ type: ActionType.SET_RELAY_API, payload: relayApi });
        dispatch({ type: ActionType.SET_API, payload: api });
      } catch (error) {
        dotAcpToast.error(`Error setting up Polkadot API: ${error}`);
      }
    };

    callApiSetup();
  }, []);

  return { state, dispatch };
};

export default useStateAndDispatch;
