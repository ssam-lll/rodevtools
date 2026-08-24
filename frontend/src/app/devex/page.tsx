"use client";

import React, { useState } from "react";
import { 
  Calculator, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  ArrowLeftRight, 
  CreditCard, 
  Building2, 
  FileText, 
  Landmark, 
  Crown, 
  ToggleLeft, 
  ToggleRight, 
  ArrowUpRight, 
  ArrowDownLeft,
  DollarSign
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

// Cashout method definitions with fee metadata
const CASHOUT_METHODS = [
  {
    id: "paypal",
    name: "PayPal",
    icon: CreditCard,
    feeText: "2% fee (max. $20 USD)",
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
    description: "Best for high-volume payouts. Wire transfer sent directly to your bank account.",
  },
  {
    id: "tipalti",
    name: "Tipalti (eCheck)",
    icon: Building2,
    feeText: "$1.50 USD transaction fee",
    processingTime: "3-7 business days",
    minAmount: "$100 USD",
    description: "Electronic direct check via the Tipalti payment portal into your bank account.",
  },
  {
    id: "check",
    name: "Physical Check",
    icon: FileText,
    feeText: "$3.00 USD handling fee",
    processingTime: "10-20 business days",
    minAmount: "$100 USD",
    description: "Physical paper check mailed to your registered postal address.",
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
  const TAX_RATE = 30; // 30% US withholding tax baseline

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
  const marketplaceFeeRate = hasPremium ? 10 : 30;

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
    <main className="relative flex-1 bg-background text-foreground p-6 md:p-8">
      <div className="container-max z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-outline-variant/30 pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-sans">Calculator</h1>
            <p className="text-body-sm text-on-surface-variant mt-1">
              Calculate DevEx payouts, payment method fees, and Robux transaction taxes.
            </p>
          </div>

          {/* Mode Tabs */}
          <div className="flex items-center gap-1 p-1 bg-surface-container border border-outline-variant rounded-lg self-start md:self-auto">
            <button
              onClick={() => setActiveTab("devex")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "devex"
                  ? "bg-surface-container-highest text-foreground border border-outline/50 shadow-sm"
                  : "text-on-surface-variant hover:text-foreground border border-transparent"
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>DevEx Cashout</span>
            </button>
            <button
              onClick={() => setActiveTab("transfer")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "transfer"
                  ? "bg-surface-container-highest text-foreground border border-outline/50 shadow-sm"
                  : "text-on-surface-variant hover:text-foreground border border-transparent"
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Transfer Tax (30% / 10%)</span>
            </button>
          </div>
        </div>

        {/* Tab 1: DevEx Calculator */}
        {activeTab === "devex" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
            
            {/* Left Column (Inputs & Payout Method) - 7 cols */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Conversion Inputs */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-bold">DevEx Conversion</CardTitle>
                  <CardDescription>Enter Robux or USD to calculate based on the current official rate ($0.0035/R$).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    
                    {/* Robux Input */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Robux Amount</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="100,000"
                          value={formatInputNumber(robux)}
                          onChange={(e) => handleRobuxChange(e.target.value)}
                          className="w-full pl-3 pr-12 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high focus:bg-surface-container-high border border-outline-variant focus:border-zinc-500 focus:outline-none text-base font-mono transition-all font-semibold"
                        />
                        <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-bold text-foreground pointer-events-none font-mono">
                          R$
                        </span>
                      </div>
                    </div>

                    {/* USD Equivalent Input */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Gross USD</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="350.00"
                          value={formatInputNumber(usd)}
                          onChange={(e) => handleUsdChange(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high focus:bg-surface-container-high border border-outline-variant focus:border-zinc-500 focus:outline-none text-base font-mono transition-all font-semibold"
                        />
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-on-surface-variant pointer-events-none font-mono">
                          $
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Preset Buttons */}
                  <div className="pt-2">
                    <span className="text-xs text-on-surface-variant block mb-2 font-medium">Quick Presets:</span>
                    <div className="flex flex-wrap gap-2">
                      {[30000, 100000, 250000, 500000, 1000000, 5000000, 10000000].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => applyPreset(val)}
                          className={`px-2.5 py-1 rounded text-xs font-mono transition-all cursor-pointer border ${
                            currentRobux === val
                              ? "bg-foreground text-background font-bold border-foreground"
                              : "bg-surface-container hover:bg-surface-container-high border-outline-variant text-on-surface-variant hover:text-foreground"
                          }`}
                        >
                          {val === 30000 ? "30K (Min)" : `${formatNumber(val / 1000)}K`} R$
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cashout Method Selector */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-bold">Payout Method & Fees</CardTitle>
                  <CardDescription>Select your payout channel to factor in processing fees.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {CASHOUT_METHODS.map((method) => {
                      const Icon = method.icon;
                      const isActive = selectedMethod === method.id;
                      return (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setSelectedMethod(method.id)}
                          className={`flex flex-col items-start p-3 rounded-lg border transition-all text-left cursor-pointer ${
                            isActive
                              ? "bg-surface-container-highest border-outline text-foreground shadow-sm"
                              : "bg-surface-container border-outline-variant text-on-surface-variant hover:border-outline hover:bg-surface-container-high"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full mb-2">
                            <Icon className={`w-4 h-4 ${isActive ? "text-foreground" : "text-on-surface-variant"}`} />
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-surface-container-high">
                              {method.name === "PayPal" ? "2%" : method.name === "Wire Transfer" ? "$25" : method.name === "Physical Check" ? "$3" : "$1.50"}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-foreground block">{method.name}</span>
                          <span className="text-[10px] text-on-surface-variant mt-0.5 leading-tight line-clamp-1">{method.processingTime}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Method Summary details */}
                  <div className="p-3.5 rounded-lg bg-surface-container border border-outline-variant flex flex-col sm:flex-row justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                        <activeMethod.icon className="w-3.5 h-3.5 text-foreground" />
                        <span>{activeMethod.name} Details</span>
                      </div>
                      <p className="text-on-surface-variant leading-relaxed text-[11px]">{activeMethod.description}</p>
                    </div>
                    <div className="flex sm:flex-col justify-between sm:justify-center items-end shrink-0 text-[11px] border-t sm:border-t-0 sm:border-l border-outline-variant/40 pt-2 sm:pt-0 sm:pl-4">
                      <span className="text-on-surface-variant">Fee: <strong className="text-foreground font-mono">{activeMethod.feeText}</strong></span>
                      <span className="text-on-surface-variant">Min: <strong className="text-foreground font-mono">{activeMethod.minAmount}</strong></span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Economic Spread Context */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-bold">Roblox vs. Developer Revenue Share</CardTitle>
                  <CardDescription>Comparison of commercial Robux purchase cost vs. DevEx developer cashout.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-surface-container/30 border border-outline-variant/30">
                      <span className="text-[11px] text-on-surface-variant block mb-1">Commercial Purchase Cost ($0.0125/R$)</span>
                      <span className="text-base font-bold text-foreground font-mono">{formatCurrency(currentRobux * BUYING_RATE)}</span>
                    </div>
                    <div className="p-3 rounded-lg bg-surface-container/30 border border-outline-variant/30">
                      <span className="text-[11px] text-on-surface-variant block mb-1">Developer DevEx Share ($0.0035/R$)</span>
                      <span className="text-base font-bold text-primary font-mono">{formatCurrency(currentUsd)}</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-surface-container/30 border border-outline-variant/20 flex gap-2 items-start text-xs text-on-surface-variant leading-relaxed">
                    <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>
                      Roblox retains approximately <strong>72% ({formatCurrency(platformSpread)})</strong> to cover multiplayer hosting, client distribution, payment gateway fees, and moderation.
                    </span>
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* Right Column (Receipt & Payout Summary) - 5 cols */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Below minimum threshold warning if applicable */}
              {!isEligible && (
                <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 text-amber-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    Minimum DevEx threshold is <strong>{formatNumber(MIN_ELIGIBLE_ROBUX)} R$</strong> (${(MIN_ELIGIBLE_ROBUX * DEVEX_RATE).toFixed(2)} USD).
                  </span>
                </div>
              )}

              {/* Net Payout Summary Card */}
              <Card className="border-outline-variant/60 shadow-md">
                <CardHeader className="pb-3 border-b border-outline-variant/30">
                  <CardTitle className="text-base font-bold">Payout Summary</CardTitle>
                  <CardDescription>Estimated payout after taxes and processing fees.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5 pt-4">
                  
                  {/* Big Hero Value */}
                  <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/40 text-center">
                    <span className="text-xs text-on-surface-variant uppercase tracking-wider block mb-1">Estimated Take-Home (USD)</span>
                    <div className="text-3xl font-bold font-mono text-emerald-400">
                      {formatCurrency(netEarnings)}
                    </div>
                    <span className="text-[11px] text-on-surface-variant/80 mt-1 block">
                      From {formatNumber(currentRobux)} Robux gross conversion
                    </span>
                  </div>

                  {/* Distribution Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex h-2 rounded-full overflow-hidden bg-surface-container-highest">
                      <div 
                        className="bg-emerald-400 h-full transition-all duration-300" 
                        style={{ width: `${currentUsd > 0 ? (netEarnings / currentUsd) * 100 : 100}%` }}
                        title="Net Payout"
                      />
                      <div 
                        className="bg-red-400 h-full transition-all duration-300" 
                        style={{ width: `${currentUsd > 0 ? (estimatedTax / currentUsd) * 100 : 0}%` }}
                        title="Withholding Tax"
                      />
                      <div 
                        className="bg-amber-400 h-full transition-all duration-300" 
                        style={{ width: `${currentUsd > 0 ? (paymentMethodFee / currentUsd) * 100 : 0}%` }}
                        title="Method Fee"
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-on-surface-variant font-mono">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                        Net ({currentUsd > 0 ? Math.round((netEarnings / currentUsd) * 100) : 100}%)
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                        Tax ({TAX_RATE}%)
                      </span>
                      {paymentMethodFee > 0 && (
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                          Fee ({currentUsd > 0 ? Math.round((paymentMethodFee / currentUsd) * 100) : 0}%)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Itemized Calculation List */}
                  <div className="space-y-2 pt-2 border-t border-outline-variant/30 text-xs">
                    <div className="flex justify-between text-on-surface-variant">
                      <span>Gross DevEx Amount:</span>
                      <span className="text-foreground font-semibold font-mono">{formatCurrency(currentUsd)}</span>
                    </div>
                    <div className="flex justify-between text-red-400">
                      <span>Tax Withheld (Fixed {TAX_RATE}%):</span>
                      <span className="font-mono">-{formatCurrency(estimatedTax)}</span>
                    </div>
                    <div className="flex justify-between text-amber-400">
                      <span>{activeMethod.name} Fee:</span>
                      <span className="font-mono">-{formatCurrency(paymentMethodFee)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold pt-3 border-t border-dashed border-outline-variant/40 text-foreground">
                      <span className="font-sans">Final Net Payout:</span>
                      <span className="text-emerald-400 font-mono">{formatCurrency(netEarnings)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>

          </div>
        )}

        {/* Tab 2: Robux Transfer Tax */}
        {activeTab === "transfer" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
            
            {/* Left Column: Transfer Controls (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-bold">Transfer Calculator</CardTitle>
                  <CardDescription>Calculate transaction fees for direct Robux transfers or item sales.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  {/* Mode Selector */}
                  <div className="grid grid-cols-2 gap-2 p-1 bg-surface-container border border-outline-variant/30 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setTransferMode("send")}
                      className={`py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        transferMode === "send"
                          ? "bg-surface-container-high text-primary border border-outline-variant/50 shadow-sm"
                          : "text-on-surface-variant hover:text-foreground border border-transparent"
                      }`}
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>I Want to Send...</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTransferMode("receive")}
                      className={`py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        transferMode === "receive"
                          ? "bg-surface-container-high text-primary border border-outline-variant/50 shadow-sm"
                          : "text-on-surface-variant hover:text-foreground border border-transparent"
                      }`}
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                      <span>Recipient Receives...</span>
                    </button>
                  </div>

                  {/* Transfer Robux Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                      {transferMode === "send" ? "Robux to Transfer (Gross)" : "Target Robux to Receive (Net)"}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="10,000"
                        value={formatInputNumber(transferRobux)}
                        onChange={(e) => handleTransferRobuxChange(e.target.value)}
                        className="w-full pl-3 pr-12 py-2 rounded-lg bg-surface-container-high/40 border border-outline-variant/50 focus:border-primary focus:outline-none text-base font-mono transition-all font-semibold"
                      />
                      <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-bold text-primary pointer-events-none font-mono">
                        R$
                      </span>
                    </div>

                    {/* Presets */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {[1000, 5000, 10000, 50000, 100000].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setTransferRobux(val.toString())}
                          className="px-2.5 py-1 rounded bg-surface-container-high/40 hover:bg-surface-container-highest border border-outline-variant/40 text-xs font-mono text-on-surface-variant hover:text-foreground transition-all cursor-pointer"
                        >
                          {formatNumber(val)} R$
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Premium Seller Toggle */}
                  <div className="flex items-center justify-between p-3.5 rounded-lg bg-surface-container/40 border border-outline-variant/30">
                    <div className="flex items-center gap-2">
                      <Crown className={`w-4 h-4 ${hasPremium ? "text-amber-400" : "text-on-surface-variant/40"}`} />
                      <div>
                        <span className="text-xs font-bold block text-foreground">Roblox Premium (Seller)</span>
                        <span className="text-[11px] text-on-surface-variant block mt-0.5">Lowers marketplace item commission from 30% to 10%</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setHasPremium(!hasPremium)}
                      className="cursor-pointer text-primary transition-transform active:scale-95"
                    >
                      {hasPremium ? (
                        <ToggleRight className="w-7 h-7 text-primary" />
                      ) : (
                        <ToggleLeft className="w-7 h-7 text-on-surface-variant/40" />
                      )}
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Comparative Transfer Results (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <Card>
                <CardHeader className="pb-3 border-b border-outline-variant/30">
                  <CardTitle className="text-base font-bold">Calculation Results</CardTitle>
                  <CardDescription>Net Robux received under different transfer scenarios.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  
                  {/* Scenario 1: P2P Transfer */}
                  <div className="p-3.5 rounded-lg bg-surface-container/40 border border-outline-variant/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">Direct Player-to-Player</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-red-400/10 text-red-400 border border-red-400/20 font-bold font-mono">
                        30% Tax
                      </span>
                    </div>
                    <div className="space-y-1 pt-1 font-mono text-xs">
                      <div className="flex justify-between text-on-surface-variant">
                        <span>You Send:</span>
                        <span className="text-foreground font-semibold">{formatNumber(p2pSentAmount)} R$</span>
                      </div>
                      <div className="flex justify-between text-red-400">
                        <span>Roblox Tax (30%):</span>
                        <span>-{formatNumber(p2pTaxAmount)} R$</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold pt-2 border-t border-outline-variant/20 text-emerald-400">
                        <span>Recipient Gets:</span>
                        <span>{formatNumber(p2pReceivedAmount)} R$</span>
                      </div>
                    </div>
                  </div>

                  {/* Scenario 2: Marketplace Sale */}
                  <div className="p-3.5 rounded-lg bg-surface-container/40 border border-outline-variant/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">Marketplace / Item Sale</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-bold font-mono">
                        {marketplaceFeeRate}% Fee
                      </span>
                    </div>
                    <div className="space-y-1 pt-1 font-mono text-xs">
                      <div className="flex justify-between text-on-surface-variant">
                        <span>Required List Price:</span>
                        <span className="text-foreground font-semibold">{formatNumber(marketPriceAmount)} R$</span>
                      </div>
                      <div className="flex justify-between text-red-400">
                        <span>Marketplace Cut ({marketplaceFeeRate}%):</span>
                        <span>-{formatNumber(marketFeeAmount)} R$</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold pt-2 border-t border-outline-variant/20 text-emerald-400">
                        <span>Creator Earns:</span>
                        <span>{formatNumber(marketEarnedAmount)} R$</span>
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
