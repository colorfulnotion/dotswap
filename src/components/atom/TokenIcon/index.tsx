import React from "react";
import DotIcon from "../../../assets/img/dot-token.svg?react";
import DefaultIcon from "../../../assets/img/dot-token.svg?react";
import GuppyIcon from "../../../assets/img/guppy-icon.svg?react";
import KusamaIcon from "../../../assets/img/kusama-icon.svg?react";
import RococoIcon from "../../../assets/img/rococo-icon.svg?react";
import TetherIcon from "../../../assets/img/tether-icon.svg?react";
import UsdCoinIcon from "../../../assets/img/usd-coin-icon.svg?react";

interface IconProps {
  tokenSymbol: string;
  width?: string;
  height?: string;
}

const TokenIcon = ({ tokenSymbol, width = "36px", height = "36px" }: IconProps) => {
  switch (tokenSymbol) {
    case "KSM":
      return <KusamaIcon width={width} height={height} />;
    case "DOT":
      return <DotIcon width={width} height={height} />;
    case "ROC":
      return <RococoIcon width={width} height={height} />;
    case "GUPPY":
      return <GuppyIcon width={width} height={height} />;
    case "USDT":
      return <TetherIcon width={width} height={height} />;
    case "USDt":
      return <TetherIcon width={width} height={height} />;
    case "USDC":
      return <UsdCoinIcon width={width} height={height} />;
    default:
      return <DefaultIcon width={width} height={height} />;
  }
};

export default TokenIcon;
