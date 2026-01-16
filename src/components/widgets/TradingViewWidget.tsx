"use client";

import { useEffect, useRef } from "react";

export default function TradingViewWidget() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any existing content
    containerRef.current.innerHTML = "";

    // Create the widget container
    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container__widget";
    containerRef.current.appendChild(widgetContainer);

    // Create and append the script
    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-market-quotes.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      width: "100%",
      height: "230",
      symbolsGroups: [
        {
          name: "Bonds",
          symbols: [
            { name: "OANDA:XAUUSD", displayName: "Gold" },
            { name: "TVC:SILVER", displayName: "Silver" },
            { name: "FX_IDC:XPDUSD", displayName: "Palladium" },
            { name: "FX_IDC:XPTUSD", displayName: "Platinum" },
          ],
        },
      ],
      showSymbolLogo: true,
      isTransparent: false,
      colorTheme: "dark",
      backgroundColor: "#131722",
      locale: "en",
    });

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, []);

  return (
    <div
      className="tradingview-widget-container"
      ref={containerRef}
      style={{ width: "100%", maxWidth: "450px" }}
    >
      <div className="tradingview-widget-container__widget"></div>
    </div>
  );
}
