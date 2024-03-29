import { ActionType, ToasterType } from "../../app/types/enum";

export interface NotificationState {
  notificationType: ToasterType | null;
  notificationTitle?: string | null;
  notificationTransactionDetails?: NotificationTransactionDetails | null;
  notificationChainDetails?: NotificationChainDetails | null;
  notificationMessage?: string | null;
  notificationLink: NotificationLink | null;
}

interface NotificationTransactionDetails {
  fromToken?: NotificationToken | null;
  toToken?: NotificationToken | null;
}

interface NotificationToken {
  symbol: string;
  amount: number;
}

interface NotificationChainDetails {
  originChain: string;
  destinationChain: string;
}

interface NotificationLink {
  text: string;
  href: string;
}

export type NotificationAction =
  | { type: ActionType.SET_NOTIFICATION_TYPE; payload: ToasterType }
  | { type: ActionType.SET_NOTIFICATION_TITLE; payload: string }
  | { type: ActionType.SET_NOTIFICATION_TRANSACTION_DETAILS; payload: NotificationTransactionDetails | null }
  | { type: ActionType.SET_NOTIFICATION_TRANSACTION_FROM; payload: NotificationToken }
  | { type: ActionType.SET_NOTIFICATION_MESSAGE; payload: string }
  | { type: ActionType.SET_NOTIFICATION_TRANSACTION_TO; payload: NotificationToken | null }
  | { type: ActionType.SET_NOTIFICATION_CHAINS_DETAILS; payload: NotificationChainDetails }
  | { type: ActionType.SET_NOTIFICATION_LINK; payload: NotificationLink }
  | { type: ActionType.SET_NOTIFICATION_LINK_TEXT; payload: string }
  | { type: ActionType.SET_NOTIFICATION_LINK_HREF; payload: string };
