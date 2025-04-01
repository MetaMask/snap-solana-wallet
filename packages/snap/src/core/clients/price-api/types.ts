export type PriceApiClientConfig = {
  baseUrl: string;
};

export enum CryptoTicker {
  BTC = 'btc',
  ETH = 'eth',
  LTC = 'ltc',
  BCH = 'bch',
  BNB = 'bnb',
  EOS = 'eos',
  XRP = 'xrp',
  XLM = 'xlm',
  LINK = 'link',
  DOT = 'dot',
  YFI = 'yfi',
  BITS = 'bits',
  SATS = 'sats',
}

export enum FiatTicker {
  USD = 'usd',
  AED = 'aed',
  ARS = 'ars',
  AUD = 'aud',
  BDT = 'bdt',
  BHD = 'bhd',
  BMD = 'bmd',
  BRL = 'brl',
  CAD = 'cad',
  CHF = 'chf',
  CLP = 'clp',
  CNY = 'cny',
  CZK = 'czk',
  DKK = 'dkk',
  EUR = 'eur',
  GBP = 'gbp',
  GEL = 'gel',
  HKD = 'hkd',
  HUF = 'huf',
  IDR = 'idr',
  ILS = 'ils',
  INR = 'inr',
  JPY = 'jpy',
  KRW = 'krw',
  KWD = 'kwd',
  LKR = 'lkr',
  MMK = 'mmk',
  MXN = 'mxn',
  MYR = 'myr',
  NGN = 'ngn',
  NOK = 'nok',
  NZD = 'nzd',
  PHP = 'php',
  PKR = 'pkr',
  PLN = 'pln',
  RUB = 'rub',
  SAR = 'sar',
  SEK = 'sek',
  SGD = 'sgd',
  THB = 'thb',
  TRY = 'try',
  TWD = 'twd',
  UAH = 'uah',
  VEF = 'vef',
  VND = 'vnd',
  ZAR = 'zar',
  XDR = 'xdr',
}

export enum CommodityTicker {
  XAG = 'xag',
  XAU = 'xau',
}

export type Ticker = FiatTicker | CryptoTicker | CommodityTicker;

export type ExchangeRate = {
  name: string;
  ticker: Ticker;
  value: number;
  currencyType: 'fiat' | 'crypto' | 'commodity';
};
