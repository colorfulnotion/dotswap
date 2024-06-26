import { FC } from "react";
import WarningIcon from "../../../assets/img/warning-icon.svg?react";

type WarningMessageProps = {
  message: string;
  show: boolean;
};

const WarningMessage: FC<WarningMessageProps> = ({ message, show }) => {
  const linkify = (text: string) => {
    // Regex pattern to match a more complete and strict URL structure
    const urlRegex = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/gi;
    return text.split(" ").map((part, index) =>
      urlRegex.test(part) ? (
        <a key={index} href={part} target="_blank" rel="noopener noreferrer">
          {" "}
          URL
        </a>
      ) : (
        " " + part
      )
    );
  };

  return show ? (
    <div className="flex items-center justify-center gap-5 rounded-2xl bg-yellow-100 p-6 font-inter text-sm font-normal">
      <WarningIcon />
      <span>{linkify(message)}</span>
    </div>
  ) : null;
};

export default WarningMessage;
