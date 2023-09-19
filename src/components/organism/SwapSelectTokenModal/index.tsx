import { FC } from "react";
import { ReactComponent as DotToken } from "../../../assets/img/dot-token.svg";
import Modal from "../../atom/Modal";
import { TokenProps } from "../../../app/types";

interface SelectTokenPayload {
  id: string;
  assetSymbol: string;
  decimals: string;
  assetTokenBalance: string;
}
interface SwapSelectTokenModalProps {
  open: boolean;
  title: string;
  tokensData: any;
  onClose: () => void;
  onSelect: (tokenData: TokenProps) => void;
}

const SwapSelectTokenModal: FC<SwapSelectTokenModalProps> = ({ open, title, tokensData, onClose, onSelect }) => {
  const handleSelectToken = (payload: SelectTokenPayload) => {
    const assetTokenData: TokenProps = {
      tokenSymbol: payload.assetSymbol,
      tokenId: payload.id,
      decimals: payload.decimals,
      tokenBalance: payload.assetTokenBalance,
    };
    onSelect(assetTokenData);
    onClose();
  };

  return (
    <Modal isOpen={open} onClose={onClose} title={title}>
      <div className="max-h-[504px] overflow-y-auto">
        {tokensData ? (
          <>
            {tokensData?.map((item: any, index: number) => (
              <div key={index} className="group flex min-w-[498px] flex-col hover:rounded-md hover:bg-purple-800">
                <button
                  className="flex items-center gap-3 px-4 py-3"
                  onClick={() =>
                    handleSelectToken({
                      id: item.tokenId,
                      assetSymbol: item.assetTokenMetadata.symbol,
                      decimals: item.assetTokenMetadata.decimals,
                      assetTokenBalance: item.tokenAsset.balance,
                    })
                  }
                >
                  <div>
                    <DotToken width={36} height={36} />
                  </div>
                  <div className="flex flex-col items-start">
                    <div className="text-text-color-header-light group-hover:text-white">
                      {item.assetTokenMetadata.name}
                    </div>
                    <div className="text-small text-text-color-body-light group-hover:text-white">
                      {item.assetTokenMetadata.symbol}
                    </div>
                  </div>
                </button>
              </div>
            ))}
          </>
        ) : (
          <div className="min-w-[498px] pr-6">
            <div className="flex items-center justify-center gap-3 px-4 py-3">No Asset found in wallet</div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SwapSelectTokenModal;