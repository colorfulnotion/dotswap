import React, { useEffect, useState, useRef } from "react";
import DownArrow from "../../../assets/img/down-arrow.svg?react";

type AccordionListProps = {
  title?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
  alwaysOpen?: boolean;
  defaultOpen?: boolean;
  nested?: boolean;
};

const AccordionList = ({
  title,
  className = "rounded-2xl",
  children,
  alwaysOpen = false,
  defaultOpen = false,
  nested = false,
}: AccordionListProps) => {
  const accordionElm = useRef<HTMLDivElement>(null);
  const titleElm = useRef<HTMLDivElement>(null);
  const itemsElm = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(defaultOpen || alwaysOpen);
  const [accordionHeight, setAccordionHeight] = useState({ titleElmHeight: 0, itemsElmHeight: 0 });

  const toggleAccordionList = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    setAccordionHeight({
      titleElmHeight: titleElm.current?.clientHeight || 0,
      itemsElmHeight: itemsElm.current?.scrollHeight || 0,
    });
  }, [isOpen, titleElm, itemsElm]);

  return (
    <div>
      <div
        ref={accordionElm}
        className={`flex w-full flex-col overflow-hidden transition-all duration-300 ease-in-out ${className}`}
        data-height={
          isOpen ? accordionHeight.titleElmHeight + accordionHeight.itemsElmHeight : accordionHeight.titleElmHeight
        }
        style={{
          height: alwaysOpen
            ? "100%"
            : isOpen
              ? nested
                ? "100%"
                : accordionHeight.itemsElmHeight + accordionHeight.titleElmHeight
              : title
                ? accordionHeight.titleElmHeight
                : accordionHeight.itemsElmHeight,
        }}
      >
        {title && (
          <div
            ref={titleElm}
            className="flex w-full flex-row justify-between p-8"
            data-height={accordionHeight.titleElmHeight}
          >
            <div className="font-unbounded-variable text-heading-6 font-normal">{title}</div>
            {!alwaysOpen && children && (
              <button
                className={`flex items-center justify-center transition-all duration-300 ease-in-out ${isOpen ? "rotate-180 transform opacity-100" : "opacity-40"}`}
                onClick={() => {
                  toggleAccordionList();
                }}
              >
                <DownArrow />
              </button>
            )}
          </div>
        )}
        {children && (
          <div
            ref={itemsElm}
            className={`flex w-full flex-col overflow-hidden transition-all duration-300 ease-in-out ${!nested ? "px-8 pb-8" : "px-0"} `}
            data-height={accordionHeight.itemsElmHeight}
            style={{ height: isOpen || !title ? "100%" : 0 }}
          >
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default AccordionList;