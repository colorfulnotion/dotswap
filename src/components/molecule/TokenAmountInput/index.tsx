import classNames from "classnames";
import { t } from "i18next";
import { ReactNode, useRef, useState, useEffect, FC } from "react";
import { NumericFormat } from "react-number-format";
import useClickOutside from "../../../app/hooks/useClickOutside";
import { ButtonVariants } from "../../../app/types/enum";
import { LottieSmall } from "../../../assets/loader";
import Button from "../../atom/Button";
import { generateRandomString, getSpotPrice, formatNumberEnUs } from "../../../app/util/helper";
import { formatDecimalsFromToken } from "../../../app/util/helper";
import Decimal from "decimal.js";

type TokenAmountInputProps = {
  tokenText: string;
  tokenBalance?: string;
  tokenId?: string;
  tokenDecimals?: string | undefined;
  disabled?: boolean;
  className?: string;
  tokenIcon?: ReactNode;
  tokenValue?: string;
  labelText?: string;
  selectDisabled?: boolean;
  assetLoading?: boolean;
  withdrawAmountPercentage?: number;
  showUSDValue?: boolean;
  spotPrice?: string;
  onClick: () => void;
  onSetTokenValue: (value: string) => void;
  onMaxClick?: () => void;
  maxVisible?: boolean;
};

const TokenAmountInput: FC<TokenAmountInputProps> = ({
  tokenIcon,
  tokenText,
  tokenBalance,
  tokenId,
  tokenDecimals,
  disabled,
  tokenValue,
  labelText,
  selectDisabled,
  assetLoading,
  withdrawAmountPercentage,
  showUSDValue,
  spotPrice,
  onSetTokenValue,
  onClick,
  onMaxClick,
  maxVisible,
  className = "",
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState<boolean>(false);

  useClickOutside(wrapperRef, () => {
    setIsFocused(false);
  });

  const [tokenPriceUSD, setTokenPriceUSD] = useState<string>("");
  const [spotPriceLoaded, setSpotPriceLoaded] = useState<boolean>(false);

  const formattedTokenBalance =
    tokenId && tokenText && tokenDecimals && tokenBalance
      ? formatDecimalsFromToken(Number(tokenBalance?.replace(/[, ]/g, "")), Number(tokenDecimals).toString()) || "0"
      : tokenBalance || "0";

  useEffect(() => {
    if (!showUSDValue) return;
    setSpotPriceLoaded(false);
    if (spotPrice || spotPrice !== "") {
      setTokenPriceUSD(new Decimal(Number(spotPrice || 0)).mul(Number(formattedTokenBalance || 0)).toFixed(2));
      setSpotPriceLoaded(true);
      return;
    }
    getSpotPrice(tokenText).then((data: string | void) => {
      if (typeof data === "string") {
        setTokenPriceUSD(new Decimal(Number(data)).mul(Number(formattedTokenBalance || 0)).toFixed(2));
        setSpotPriceLoaded(true);
      }
    });
  }, [tokenText, tokenBalance, spotPrice, showUSDValue]);

  const formId = `token-amount-${generateRandomString(4)}`;

  const [inputValueUsd, setInputValueUsd] = useState<string>("");
  useEffect(() => {
    if (inputRef.current?.value !== undefined && inputRef.current?.value !== null && spotPrice && spotPrice !== "") {
      const inputValue = inputRef.current?.value === "." ? "0" : inputRef.current?.value || "0";
      setInputValueUsd(
        formatNumberEnUs(new Decimal(Number(inputValue)).mul(Number(spotPrice || 0)).toNumber(), undefined, true)
      );
    } else {
      setInputValueUsd("");
    }
  }, [inputRef.current?.value, spotPrice, showUSDValue]);

  return (
    <div
      ref={wrapperRef}
      className={classNames(
        `relative flex flex-col items-center justify-start rounded-lg border bg-purple-100 px-4 py-6 dedswap:mb-5 dedswap:rounded-sm dedswap:border-8 dedswap:border-black ${className}`,
        {
          "border-pink": isFocused,
          "border-transparent": !isFocused,
        }
      )}
    >
      <div className="flex w-full">
        <label
          htmlFor={formId}
          className="absolute top-4 text-small font-normal text-gray-200 dedswap:font-open-sans dedswap:font-black dedswap:uppercase dedswap:text-black"
        >
          {labelText}
        </label>
        <NumericFormat
          id={formId}
          getInputRef={inputRef}
          allowNegative={false}
          fixedDecimalScale
          displayType={"input"}
          disabled={disabled || !tokenText}
          placeholder={"0"}
          className={classNames(
            "no-scrollbar w-full basis-auto bg-transparent font-unbounded-variable text-heading-5 font-bold outline-none placeholder:text-gray-200",
            {
              "text-gray-200": !tokenText,
              "text-gray-300": tokenText,
            }
          )}
          onFocus={() => setIsFocused(true)}
          value={tokenValue || "0"}
          isAllowed={({ floatValue }) => {
            if (floatValue) {
              const value = floatValue.toString();
              const [, decimalPart] = value.split(".");
              const decimalCount = decimalPart?.length || 0;
              return decimalCount <= Number(tokenDecimals);
            } else {
              return true;
            }
          }}
          onValueChange={({ floatValue }) => {
            onSetTokenValue(floatValue?.toString() || "");
          }}
        />

        {tokenText ? (
          <Button
            icon={tokenIcon}
            type="button"
            onClick={() => onClick()}
            variant={ButtonVariants.btnSelectGray}
            disabled={disabled || selectDisabled}
            className="h-[42px] basis-2/5 disabled:basis-[23%]"
          >
            {tokenText}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => onClick()}
            variant={ButtonVariants.btnSelectPink}
            className="h-[42px] basis-[57%]"
            disabled={disabled}
          >
            {!disabled ? assetLoading ? <LottieSmall /> : t("button.selectToken") : t("button.selectToken")}
          </Button>
        )}
      </div>
      <div className="flex w-full justify-between">
        {withdrawAmountPercentage ? (
          <span className="hidden text-[13px] tracking-[0.2px] text-black text-opacity-50">
            ({withdrawAmountPercentage}%)
          </span>
        ) : null}
        {inputValueUsd !== "" ? (
          <span className="text-[13px] tracking-[0.2px] text-black text-opacity-50">{inputValueUsd}</span>
        ) : null}
        <div className="flex flex-1 justify-end pr-1 text-medium text-gray-200 dedswap:font-extrabold">
          {t("swapPage.balance")} {formatNumberEnUs(Number(formattedTokenBalance), Number(tokenDecimals)) || 0}
          {showUSDValue ? (
            tokenPriceUSD && spotPriceLoaded ? (
              <span>&nbsp;(${formatNumberEnUs(Number(tokenPriceUSD))})</span>
            ) : (
              <>
                &nbsp;
                <LottieSmall />
              </>
            )
          ) : null}
          {tokenText &&
            onMaxClick &&
            maxVisible &&
            import.meta.env.VITE_ENABLE_EXPERIMENTAL_MAX_TOKENS_SWAP &&
            import.meta.env.VITE_ENABLE_EXPERIMENTAL_MAX_TOKENS_SWAP == "true" && (
              <button
                className="inline-flex h-5 w-11 flex-col items-start justify-start gap-2 px-1.5 uppercase text-pink"
                onClick={onMaxClick}
              >
                {t("button.max")}
              </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default TokenAmountInput;
