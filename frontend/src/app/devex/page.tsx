"use client";

import React, { useState } from "react";
import { DollarSign, Calculator, AlertTriangle, CheckCircle, Info, ArrowLeftRight, CreditCard, Building2, FileText, Landmark, Crown, ToggleLeft, ToggleRight, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

// Cashout method definitions with fee metadata
const CASHOUT_METHODS = [
  {
    id: "paypal",
    name: "PayPal",
    icon: CreditCard,
    feeText: "2% fee (max. $20.00 USD)",
    processingTime: "3-5 business days",
    minAmount: "$100 USD",
    description: "Fastest option for most developers. Sent directly to your PayPal account.",
  },
  {
    id: "wire",
    name: "Wire Transfer",
    icon: Landmark,
    feeText: "$25.00 USD flat fee",
    processingTime: "5-10 business days",
    minAmount: "$1,000 USD",
    description: "Best for large payouts. Wire transfer sent directly to your bank account.",
  },
  {
    id: "check",
    name: "Check",
    icon: FileText,
    feeText: "$3.00 USD handling fee",
    processingTime: "10-20 business days",
    minAmount: "$100 USD",
    description: "Physical paper check mailed to your address.",
  },
  {
    id: "tipalti",
    name: "Tipalti (eCheck)",
    icon: Building2,
    feeText: "$1.50 USD transaction fee",
    processingTime: "3-7 business days",
    minAmount: "$100 USD",
    description: "Electronic check via the Tipalti system directly to your bank account.",
  },
];

export default function DevExPage() {
  const [activeTab, setActiveTab] = useState<"devex" | "transfer">("devex");
  
  // DevEx Calculator State
  const [robux, setRobux] = useState<string>("100000");
  const [usd, setUsd] = useState<string>("350");
  const [selectedMethod, setSelectedMethod] = useState<string>("paypal");

  // Transfer Calculator State
  const [transferRobux, setTransferRobux] = useState<string>("10000");
  const [hasPremium, setHasPremium] = useState<boolean>(false);
  const [transferMode, setTransferMode] = useState<"send" | "receive">("send");

  // Constants
  const DEVEX_RATE = 0.0035;
  const MIN_ELIGIBLE_ROBUX = 30000;
  const BUYING_RATE = 0.0125;
  const TAX_RATE = 30; // Locked at 30% as requested

  // Dynamic Payout Fee Calculation
  const getMethodFee = (methodId: string, amountUsd: number) => {
    if (amountUsd <= 0) return 0;
    switch (methodId) {
      case "paypal":
        return Math.min(amountUsd * 0.02, 20.0);
      case "wire":
        return 25.0;
      case "check":
        return 3.0;
      case "tipalti":
        return 1.5;
      default:
        return 0.0;
    }
  };

  // Helper functions for formatting numbers with commas in inputs
  const formatInputNumber = (val: string) => {
    if (!val) return "";
    const clean = val.replace(/[^\d.]/g, "");
    const parts = clean.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    if (parts.length > 2) {
      return parts[0] + "." + parts[1];
    }
    return parts.join(".");
  };

  const handleRobuxChange = (val: string) => {
    const rawVal = val.replace(/,/g, "");
    if (rawVal !== "" && isNaN(Number(rawVal))) return;
    setRobux(rawVal);
    const num = parseFloat(rawVal);
    if (!isNaN(num)) {
      setUsd((num * DEVEX_RATE).toFixed(2));
    } else {
      setUsd("");
    }
  };

  const handleUsdChange = (val: string) => {
    const rawVal = val.replace(/,/g, "");
    if (rawVal !== "" && isNaN(Number(rawVal))) return;
    setUsd(rawVal);
    const num = parseFloat(rawVal);
    if (!isNaN(num)) {
      setRobux(Math.round(num / DEVEX_RATE).toString());
    } else {
      setRobux("");
    }
  };

  const handleTransferRobuxChange = (val: string) => {
    const rawVal = val.replace(/,/g, "");
    if (rawVal !== "" && isNaN(Number(rawVal))) return;
    setTransferRobux(rawVal);
  };

  const applyPreset = (presetRobux: number) => {
    setRobux(presetRobux.toString());
    setUsd((presetRobux * DEVEX_RATE).toFixed(2));
  };

  const currentRobux = parseFloat(robux) || 0;
  const currentUsd = parseFloat(usd) || 0;
  const estimatedTax = currentUsd * (TAX_RATE / 100);
  const paymentMethodFee = getMethodFee(selectedMethod, currentUsd);
  const netEarnings = Math.max(0, currentUsd - estimatedTax - paymentMethodFee);
  const platformSpread = Math.max(0, (currentRobux * BUYING_RATE) - currentUsd);

  const isEligible = currentRobux >= MIN_ELIGIBLE_ROBUX;

  // Transfer Calculations
  const transferAmount = parseFloat(transferRobux) || 0;
  const marketplaceFeeRate = hasPremium ? 10 : 30; // Reduced from 30% to 10% with Premium

  let p2pSentAmount = 0;
  let p2pTaxAmount = 0;
  let p2pReceivedAmount = 0;

  let marketPriceAmount = 0;
  let marketFeeAmount = 0;
  let marketEarnedAmount = 0;

  if (transferMode === "send") {
    p2pSentAmount = transferAmount;
    p2pTaxAmount = Math.floor(transferAmount * 0.30);
    p2pReceivedAmount = Math.max(0, p2pSentAmount - p2pTaxAmount);

    marketPriceAmount = transferAmount;
    marketFeeAmount = Math.floor(transferAmount * (marketplaceFeeRate / 100));
    marketEarnedAmount = Math.max(0, marketPriceAmount - marketFeeAmount);
  } else {
    p2pReceivedAmount = transferAmount;
    p2pSentAmount = Math.ceil(transferAmount / 0.70);
    p2pTaxAmount = p2pSentAmount - p2pReceivedAmount;

    marketEarnedAmount = transferAmount;
    marketPriceAmount = Math.ceil(transferAmount / ((100 - marketplaceFeeRate) / 100));
    marketFeeAmount = marketPriceAmount - marketEarnedAmount;
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(num);
  };

  const activeMethod = CASHOUT_METHODS.find((m) => m.id === selectedMethod) || CASHOUT_METHODS[0];

  return (
    <main className="relative flex-1 bg-background text-foreground py-xl px-gutter overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="container-max z-10 relative">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-lg border-b border-outline-variant/30 pb-lg">
          <div>
            <div className="flex items-center gap-xs text-primary mb-xs">
              <Calculator className="w-5 h-5" />
              <span className="text-label-caps font-semibold">Financial Analytics</span>
            </div>
            <h1 className="text-headline-lg font-bold">DevEx & Fee Calculator</h1>
            <p className="text-body-md text-on-surface-variant mt-xs">
              Calculate Roblox Developer Exchange (DevEx) payouts, transaction fees, and Robux transfer taxes.
            </p>
          </div>
        </div>

        {/* Tab Selection Switcher */}
        <div className="flex gap-xs p-1 bg-surface-container-lowest/60 border border-outline-variant/30 rounded-xl w-fit mb-lg">
          <button
            onClick={() => setActiveTab("devex")}
            className={`px-md py-sm rounded-lg text-body-sm font-semibold transition-all duration-200 cursor-pointer flex items-center gap-xs ${
              activeTab === "devex"
                ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_10px_rgba(0,175,244,0.08)]"
                : "text-on-surface-variant hover:text-foreground hover:bg-surface-container-high/30 border border-transparent"
            }`}
          >
            <DollarSign className="w-4 h-4" />
            DevEx Calculator
          </button>
          <button
            onClick={() => setActiveTab("transfer")}
            className={`px-md py-sm rounded-lg text-body-sm font-semibold transition-all duration-200 cursor-pointer flex items-center gap-xs ${
              activeTab === "transfer"
                ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_10px_rgba(0,175,244,0.08)]"
                : "text-on-surface-variant hover:text-foreground hover:bg-surface-container-high/30 border border-transparent"
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
            Robux Transfer Tax
          </button>
        </div>

        {/* Tab 1: DevEx Calculator */}
        {activeTab === "devex" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg animate-fade-in">
            {/* Left Column: Inputs, Presets, Methods */}
            <div className="lg:col-span-2 space-y-lg">
              {/* Exchange Parameters */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-body-md font-bold">Exchange Parameters</CardTitle>
                  <CardDescription>Enter values in either Robux or USD to compute the conversion.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-md">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-md items-center">
                    {/* Robux Input */}
                    <div className="space-y-xs">
                      <label className="text-label-caps text-on-surface-variant font-semibold">Robux Amount</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="e.g. 100,000"
                          value={formatInputNumber(robux)}
                          onChange={(e) => handleRobuxChange(e.target.value)}
                          className="w-full pl-md pr-16 py-sm rounded-lg bg-surface-container/60 border border-outline-variant focus:border-primary focus:outline-none text-data-lg font-mono transition-all"
                        />
                        <span className="absolute inset-y-0 right-0 pr-md flex items-center text-body-sm font-semibold text-primary pointer-events-none font-mono">
                          R$
                        </span>
                      </div>
                    </div>

                    {/* Icon Separator */}
                    <div className="hidden md:flex justify-center mt-md text-on-surface-variant">
                      <ArrowLeftRight className="w-5 h-5" />
                    </div>

                    {/* USD Input */}
                    <div className="space-y-xs">
                      <label className="text-label-caps text-on-surface-variant font-semibold">Equivalent USD</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="e.g. 350"
                          value={formatInputNumber(usd)}
                          onChange={(e) => handleUsdChange(e.target.value)}
                          className="w-full pl-10 pr-md py-sm rounded-lg bg-surface-container/60 border border-outline-variant focus:border-primary focus:outline-none text-data-lg font-mono transition-all"
                        />
                        <span className="absolute inset-y-0 left-0 pl-md flex items-center text-body-sm font-semibold text-amber-400 pointer-events-none font-mono">
                          $
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Presets List */}
                  <div className="pt-md border-t border-outline-variant/30">
                    <span className="text-body-sm text-on-surface-variant block mb-sm">Quick presets (Robux):</span>
                    <div className="flex flex-wrap gap-sm">
                      {[30000, 100000, 250000, 1000000, 5000000, 10000000].map((val) => (
                        <button
                          key={val}
                          onClick={() => applyPreset(val)}
                          className="px-md py-xs rounded bg-surface-container-high/60 hover:bg-surface-container-highest hover:border-primary border border-outline-variant text-body-sm font-mono transition-all cursor-pointer"
                        >
                          {formatNumber(val)} R$
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cashout Method Selector */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-body-md font-bold">Payout Method</CardTitle>
                  <CardDescription>Choose how you want to receive your DevEx payout to calculate transaction fees.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-md">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-sm">
                    {CASHOUT_METHODS.map((method) => {
                      const Icon = method.icon;
                      const isActive = selectedMethod === method.id;
                      return (
                        <button
                          key={method.id}
                          onClick={() => setSelectedMethod(method.id)}
                          className={`flex flex-col items-center gap-xs p-md rounded-lg border transition-all text-center cursor-pointer ${
                            isActive
                              ? "bg-primary/10 border-primary/40 text-primary shadow-[0_0_12px_rgba(0,175,244,0.1)]"
                              : "bg-surface-container/40 border-outline-variant/40 text-on-surface-variant hover:border-outline-variant hover:bg-surface-container"
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${isActive ? "text-primary" : ""}`} />
                          <span className="text-xs font-semibold">{method.name}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Method Details */}
                  <div className="p-md rounded-lg bg-surface-container/30 border border-outline-variant/30 space-y-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-xs">
                        {React.createElement(activeMethod.icon, { className: "w-4 h-4 text-primary" })}
                        <span className="text-body-sm font-bold text-foreground">{activeMethod.name}</span>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-bold font-mono">
                        {activeMethod.feeText}
                      </span>
                    </div>
                    <p className="text-body-sm text-on-surface-variant">{activeMethod.description}</p>
                    <div className="grid grid-cols-3 gap-sm pt-sm border-t border-outline-variant/20">
                      <div>
                        <span className="text-[10px] text-on-surface-variant block uppercase tracking-wider font-semibold">Fee Rate</span>
                        <span className="text-xs font-semibold text-foreground">{activeMethod.feeText}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-on-surface-variant block uppercase tracking-wider font-semibold">Processing</span>
                        <span className="text-xs font-semibold text-foreground">{activeMethod.processingTime}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-on-surface-variant block uppercase tracking-wider font-semibold">Minimum</span>
                        <span className="text-xs font-semibold text-foreground">{activeMethod.minAmount}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Platform Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-body-md font-bold">Platform Economic Spread</CardTitle>
                  <CardDescription>Comparison of what this Robux costs to buy vs. what it pays out.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-md">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                    <div className="p-md rounded-lg bg-surface-container-high/30 border border-outline-variant/40">
                      <span className="text-body-sm text-on-surface-variant block mb-xs">Robux Purchase Cost (Est.)</span>
                      <span className="text-headline-sm font-bold font-mono text-red-400">{formatCurrency(currentRobux * BUYING_RATE)}</span>
                      <p className="text-[11px] text-on-surface-variant mt-xs">Cost at commercial purchase rate ($0.0125/R$)</p>
                    </div>
                    <div className="p-md rounded-lg bg-surface-container-high/30 border border-outline-variant/40">
                      <span className="text-body-sm text-on-surface-variant block mb-xs">Your Cashout Share (DevEx)</span>
                      <span className="text-headline-sm font-bold font-mono text-emerald-400">{formatCurrency(currentUsd)}</span>
                      <p className="text-[11px] text-on-surface-variant mt-xs">Value paid out at exchange rate ($0.0035/R$)</p>
                    </div>
                  </div>

                  <div className="p-md rounded-lg bg-primary/5 border border-primary/20 flex gap-sm items-start">
                    <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div className="text-body-sm text-on-surface-variant">
                      Roblox retains a spread of <strong className="text-foreground font-mono">{formatCurrency(platformSpread)}</strong> (approx. 72%) to cover global cloud hosting, multiplayer infrastructure, app store fees, platform moderation, and operational costs.
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Payout Summary & Eligibility */}
            <div className="space-y-lg">
              {/* Eligibility Widget */}
              <Card className={`border-l-4 ${isEligible ? "border-l-emerald-500 bg-emerald-500/5" : "border-l-amber-500 bg-amber-500/5"}`}>
                <CardHeader className="pb-xs">
                  <CardTitle className="text-body-sm font-bold flex items-center gap-xs">
                    {isEligible ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                        <span className="text-emerald-400">Eligible for Cashout</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                        <span className="text-amber-400">Below Cashout Threshold</span>
                      </>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-sm">
                  <p className="text-body-sm text-on-surface-variant leading-relaxed">
                    Roblox requires a minimum threshold of <strong className="text-foreground font-mono">{formatNumber(MIN_ELIGIBLE_ROBUX)} Robux</strong> to be eligible for a Developer Exchange transaction.
                  </p>
                  {!isEligible && (
                    <div className="text-xs bg-amber-500/10 text-amber-400 p-sm rounded border border-amber-500/20 font-semibold font-mono">
                      You need {formatNumber(MIN_ELIGIBLE_ROBUX - currentRobux)} more Robux to meet the DevEx requirements.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Financial Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-body-md font-bold">Estimated Net Earnings</CardTitle>
                  <CardDescription>Estimation of taxes and net payouts after transaction fees.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-md">
                  {/* Tax withholding locked information */}
                  <div className="flex justify-between items-center p-sm rounded-lg bg-surface-container/30 border border-outline-variant/30">
                    <span className="text-body-sm font-medium text-foreground">Withholding Tax Rate</span>
                    <span className="font-mono text-xs font-bold text-red-400 bg-red-400/10 border border-red-400/20 px-2 py-0.5 rounded">
                      {TAX_RATE}% Fixed
                    </span>
                  </div>

                  {/* Visual breakdown progress bar */}
                  <div className="space-y-xs pt-xs">
                    <div className="flex h-2.5 rounded-full overflow-hidden bg-surface-container-highest">
                      <div 
                        className="bg-emerald-400 h-full transition-all duration-300" 
                        style={{ width: `${currentUsd > 0 ? (netEarnings / currentUsd) * 100 : 100}%` }}
                      />
                      <div 
                        className="bg-red-400 h-full transition-all duration-300" 
                        style={{ width: `${currentUsd > 0 ? (estimatedTax / currentUsd) * 100 : 0}%` }}
                      />
                      <div 
                        className="bg-amber-400 h-full transition-all duration-300" 
                        style={{ width: `${currentUsd > 0 ? (paymentMethodFee / currentUsd) * 100 : 0}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-on-surface-variant font-mono">
                      <span className="flex items-center gap-xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                        Net ({currentUsd > 0 ? Math.round((netEarnings / currentUsd) * 100) : 100}%)
                      </span>
                      <span className="flex items-center gap-xs">
                        <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                        Tax ({TAX_RATE}%)
                      </span>
                      {paymentMethodFee > 0 && (
                        <span className="flex items-center gap-xs">
                          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                          Fee ({currentUsd > 0 ? Math.round((paymentMethodFee / currentUsd) * 100) : 0}%)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Calculation Stack */}
                  <div className="space-y-sm pt-md border-t border-outline-variant/30 font-mono text-body-sm">
                    <div className="flex justify-between text-on-surface-variant">
                      <span>Gross Cashout:</span>
                      <span className="text-foreground">{formatCurrency(currentUsd)}</span>
                    </div>
                    <div className="flex justify-between text-on-surface-variant">
                      <span>Tax Withheld ({TAX_RATE}%):</span>
                      <span className="text-red-400">-{formatCurrency(estimatedTax)}</span>
                    </div>
                    <div className="flex justify-between text-on-surface-variant">
                      <span>{activeMethod.name} Fee:</span>
                      <span className="text-amber-400">-{formatCurrency(paymentMethodFee)}</span>
                    </div>
                    <div className="flex justify-between text-headline-sm font-bold pt-sm border-t border-dashed border-outline-variant/40">
                      <span className="font-sans text-foreground">Net Payout:</span>
                      <span className="text-emerald-400 font-bold">{formatCurrency(netEarnings)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cashout Method Summary Details */}
              <Card>
                <CardHeader className="pb-xs">
                  <CardTitle className="text-body-sm font-bold flex items-center gap-xs">
                    {React.createElement(activeMethod.icon, { className: "w-4 h-4 text-primary" })}
                    <span>Payout via {activeMethod.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-sm">
                  <div className="text-body-sm text-on-surface-variant space-y-xs">
                    <div className="flex justify-between">
                      <span>Processing time:</span>
                      <span className="text-foreground font-semibold">{activeMethod.processingTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Transaction fee:</span>
                      <span className="text-foreground font-semibold">{activeMethod.feeText}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Minimum payout:</span>
                      <span className="text-foreground font-semibold">{activeMethod.minAmount}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Tab 2: Robux Transfer Tax */}
        {activeTab === "transfer" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg animate-fade-in">
            {/* Left Column: Transfer Input, Premium status */}
            <div className="lg:col-span-2 space-y-lg">
              <Card>
                <CardHeader>
                  <CardTitle className="text-body-md font-bold">Robux Transfer Parameters</CardTitle>
                  <CardDescription>Configure if you want to calculate based on amount sent or target amount received.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-md">
                  {/* Mode Switcher */}
                  <div className="grid grid-cols-2 gap-sm p-1 bg-surface-container-lowest/60 border border-outline-variant/30 rounded-xl">
                    <button
                      onClick={() => setTransferMode("send")}
                      className={`py-sm rounded-lg text-body-sm font-semibold transition-all duration-200 cursor-pointer flex items-center justify-center gap-xs ${
                        transferMode === "send"
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "text-on-surface-variant hover:text-foreground border border-transparent"
                      }`}
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      I Want to Send...
                    </button>
                    <button
                      onClick={() => setTransferMode("receive")}
                      className={`py-sm rounded-lg text-body-sm font-semibold transition-all duration-200 cursor-pointer flex items-center justify-center gap-xs ${
                        transferMode === "receive"
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "text-on-surface-variant hover:text-foreground border border-transparent"
                      }`}
                    >
                      <ArrowDownLeft className="w-4 h-4" />
                      Recipient Receives...
                    </button>
                  </div>

                  {/* Transfer Input */}
                  <div className="space-y-xs">
                    <label className="text-label-caps text-on-surface-variant font-semibold">
                      {transferMode === "send" ? "Robux to Transfer (Gross)" : "Target Robux to Receive (Net)"}
                    </label>
                    <div className="relative mb-xs">
                      <input
                        type="text"
                        placeholder="e.g. 10,000"
                        value={formatInputNumber(transferRobux)}
                        onChange={(e) => handleTransferRobuxChange(e.target.value)}
                        className="w-full pl-md pr-16 py-sm rounded-lg bg-surface-container/60 border border-outline-variant focus:border-primary focus:outline-none text-data-lg font-mono transition-all"
                      />
                      <span className="absolute inset-y-0 right-0 pr-md flex items-center text-body-sm font-semibold text-primary pointer-events-none font-mono">
                        R$
                      </span>
                    </div>

                    {/* Presets for transfer */}
                    <div className="flex flex-wrap gap-xs pt-1">
                      {[1000, 5000, 10000, 50000, 100000].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setTransferRobux(val.toString())}
                          className="px-sm py-xs rounded bg-surface-container-high/60 hover:bg-surface-container-highest hover:border-primary border border-outline-variant text-body-sm font-mono transition-all cursor-pointer"
                        >
                          {formatNumber(val)} R$
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Premium Toggle */}
                  <div className="flex items-center justify-between p-md rounded-lg bg-surface-container/30 border border-outline-variant/30">
                    <div className="flex items-center gap-xs">
                      <Crown className={`w-5 h-5 ${hasPremium ? "text-amber-400" : "text-on-surface-variant/40"}`} />
                      <div>
                        <span className="text-body-sm font-bold block text-foreground">Roblox Premium (Seller)</span>
                        <span className="text-xs text-on-surface-variant block mt-0.5">Reduces marketplace item sale commission</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setHasPremium(!hasPremium)}
                      className="flex items-center gap-xs text-body-sm font-mono cursor-pointer"
                    >
                      {hasPremium ? (
                        <ToggleRight className="w-8 h-8 text-primary" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-on-surface-variant/40" />
                      )}
                    </button>
                  </div>

                  {hasPremium && (
                    <div className="p-md rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs text-on-surface-variant">
                      <div className="flex items-start gap-xs">
                        <Info className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong className="text-amber-400">Roblox Premium Active:</strong> Marketplace fee reduced from 30% to <strong className="text-foreground">10%</strong> for item sales. 
                          The <strong className="text-foreground">transfer tax remains 30%</strong> for direct player-to-player gamepass/donation transfers.
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Comparative Results */}
            <div className="space-y-lg">
              <Card>
                <CardHeader>
                  <CardTitle className="text-body-md font-bold">Transfer & Fee Results</CardTitle>
                  <CardDescription>How much Robux is received under different transfer scenarios.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-md">
                  {/* Scenario 1: Player-to-Player Transfer */}
                  <div className="p-md rounded-lg bg-surface-container/40 border border-outline-variant/30 space-y-sm">
                    <span className="text-xs px-2 py-0.5 rounded bg-red-400/10 text-red-400 border border-red-400/20 font-bold font-mono">
                      Direct P2P Transfer (30% Tax)
                    </span>
                    <p className="text-xs text-on-surface-variant leading-normal">
                      {transferMode === "send" 
                        ? "Standard transaction fee applied when donating or transferring Robux directly."
                        : "How much you need to send so they receive the target amount."}
                    </p>
                    <div className="space-y-xs pt-xs font-mono text-body-sm">
                      <div className={`flex justify-between ${transferMode === "receive" ? "text-primary font-bold" : "text-on-surface-variant"}`}>
                        <span>You Must Send:</span>
                        <span className={transferMode === "receive" ? "text-primary font-bold" : ""}>{formatNumber(p2pSentAmount)} R$</span>
                      </div>
                      <div className="flex justify-between text-red-400">
                        <span>Tax Withheld (30%):</span>
                        <span>-{formatNumber(p2pTaxAmount)} R$</span>
                      </div>
                      <div className={`flex justify-between text-body-md font-bold pt-sm border-t border-outline-variant/20 ${transferMode === "send" ? "text-emerald-400 font-bold" : "text-foreground"}`}>
                        <span>Recipient Gets:</span>
                        <span className={transferMode === "send" ? "text-emerald-400 font-bold" : ""}>{formatNumber(p2pReceivedAmount)} R$</span>
                      </div>
                    </div>
                  </div>

                  {/* Scenario 2: Marketplace / Gamepass Sale */}
                  <div className="p-md rounded-lg bg-surface-container/40 border border-outline-variant/30 space-y-sm">
                    <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-bold font-mono">
                      Marketplace / Item Sale ({marketplaceFeeRate}% Fee)
                    </span>
                    <p className="text-xs text-on-surface-variant leading-normal">
                      {transferMode === "send"
                        ? "Roblox marketplace fee applied when users purchase your custom items, clothing, or gamepasses."
                        : "How much you must set the item price so you receive the target amount."}
                    </p>
                    <div className="space-y-xs pt-xs font-mono text-body-sm">
                      <div className={`flex justify-between ${transferMode === "receive" ? "text-primary font-bold" : "text-on-surface-variant"}`}>
                        <span>Required List Price:</span>
                        <span className={transferMode === "receive" ? "text-primary font-bold" : ""}>{formatNumber(marketPriceAmount)} R$</span>
                      </div>
                      <div className="flex justify-between text-red-400">
                        <span>Marketplace Fee ({marketplaceFeeRate}%):</span>
                        <span>-{formatNumber(marketFeeAmount)} R$</span>
                      </div>
                      <div className={`flex justify-between text-body-md font-bold pt-sm border-t border-outline-variant/20 ${transferMode === "send" ? "text-emerald-400 font-bold" : "text-foreground"}`}>
                        <span>Creator Earns:</span>
                        <span className={transferMode === "send" ? "text-emerald-400 font-bold" : ""}>{formatNumber(marketEarnedAmount)} R$</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
