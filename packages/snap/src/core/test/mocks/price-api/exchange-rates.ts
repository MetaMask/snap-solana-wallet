import type { ExchangeRate, Ticker } from '../../../clients/price-api/types';

/**
 * HEADS UP! Changing this mock MUST involve changing the spot prices mock too!
 * Their values are interdependent and essential for the TokenPricesService tests.
 */
export const MOCK_EXCHANGE_RATES: Record<Ticker, ExchangeRate> = {
  btc: {
    name: 'Bitcoin',
    ticker: 'btc',
    value: 0.000009225522122806664,
    currencyType: 'crypto',
  },
  eth: {
    name: 'Ether',
    ticker: 'eth',
    value: 0.0004032198954215109,
    currencyType: 'crypto',
  },
  ltc: {
    name: 'Litecoin',
    ticker: 'ltc',
    value: 0.011656225789635273,
    currencyType: 'crypto',
  },
  bch: {
    name: 'Bitcoin Cash',
    ticker: 'bch',
    value: 0.001982942950598187,
    currencyType: 'crypto',
  },
  bnb: {
    name: 'Binance Coin',
    ticker: 'bnb',
    value: 0.0015156056764231698,
    currencyType: 'crypto',
  },
  eos: {
    name: 'EOS',
    ticker: 'eos',
    value: 2.056880058128908,
    currencyType: 'crypto',
  },
  xrp: {
    name: 'XRP',
    ticker: 'xrp',
    value: 0.4540842119866674,
    currencyType: 'crypto',
  },
  xlm: {
    name: 'Lumens',
    ticker: 'xlm',
    value: 4.29161071887215,
    currencyType: 'crypto',
  },
  link: {
    name: 'Chainlink',
    ticker: 'link',
    value: 0.07546219704388624,
    currencyType: 'crypto',
  },
  dot: {
    name: 'Polkadot',
    ticker: 'dot',
    value: 0.29389602831032285,
    currencyType: 'crypto',
  },
  yfi: {
    name: 'Yearn.finance',
    ticker: 'yfi',
    value: 0.00019925282680837832,
    currencyType: 'crypto',
  },
  usd: {
    name: 'US Dollar',
    ticker: 'usd',
    value: 1,
    currencyType: 'fiat',
  },
  aed: {
    name: 'United Arab Emirates Dirham',
    ticker: 'aed',
    value: 3.6730349953852555,
    currencyType: 'fiat',
  },
  ars: {
    name: 'Argentine Peso',
    ticker: 'ars',
    value: 1206.0000013561519,
    currencyType: 'fiat',
  },
  aud: {
    name: 'Australian Dollar',
    ticker: 'aud',
    value: 1.5232439935923583,
    currencyType: 'fiat',
  },
  bdt: {
    name: 'Bangladeshi Taka',
    ticker: 'bdt',
    value: 122.29205113607277,
    currencyType: 'fiat',
  },
  bhd: {
    name: 'Bahraini Dinar',
    ticker: 'bhd',
    value: 0.3769909979846017,
    currencyType: 'fiat',
  },
  bmd: {
    name: 'Bermudian Dollar',
    ticker: 'bmd',
    value: 1,
    currencyType: 'fiat',
  },
  brl: {
    name: 'Brazil Real',
    ticker: 'brl',
    value: 5.446300002410629,
    currencyType: 'fiat',
  },
  cad: {
    name: 'Canadian Dollar',
    ticker: 'cad',
    value: 1.3640219988479354,
    currencyType: 'fiat',
  },
  chf: {
    name: 'Swiss Franc',
    ticker: 'chf',
    value: 0.7936309928980179,
    currencyType: 'fiat',
  },
  clp: {
    name: 'Chilean Peso',
    ticker: 'clp',
    value: 923.830001036303,
    currencyType: 'fiat',
  },
  cny: {
    name: 'Chinese Yuan',
    ticker: 'cny',
    value: 7.166700000015684,
    currencyType: 'fiat',
  },
  czk: {
    name: 'Czech Koruna',
    ticker: 'czk',
    value: 20.952984017733154,
    currencyType: 'fiat',
  },
  dkk: {
    name: 'Danish Krone',
    ticker: 'dkk',
    value: 6.339276002611524,
    currencyType: 'fiat',
  },
  eur: {
    name: 'Euro',
    ticker: 'eur',
    value: 0.8496419976174352,
    currencyType: 'fiat',
  },
  gbp: {
    name: 'British Pound Sterling',
    ticker: 'gbp',
    value: 0.7356629966217338,
    currencyType: 'fiat',
  },
  gel: {
    name: 'Georgian Lari',
    ticker: 'gel',
    value: 2.719999997416854,
    currencyType: 'fiat',
  },
  hkd: {
    name: 'Hong Kong Dollar',
    ticker: 'hkd',
    value: 7.84986500616371,
    currencyType: 'fiat',
  },
  huf: {
    name: 'Hungarian Forint',
    ticker: 'huf',
    value: 340.2474533753413,
    currencyType: 'fiat',
  },
  idr: {
    name: 'Indonesian Rupiah',
    ticker: 'idr',
    value: 16212.776418318166,
    currencyType: 'fiat',
  },
  ils: {
    name: 'Israeli New Shekel',
    ticker: 'ils',
    value: 3.3717049952207647,
    currencyType: 'fiat',
  },
  inr: {
    name: 'Indian Rupee',
    ticker: 'inr',
    value: 85.59833408842695,
    currencyType: 'fiat',
  },
  jpy: {
    name: 'Japanese Yen',
    ticker: 'jpy',
    value: 143.9902001614485,
    currencyType: 'fiat',
  },
  krw: {
    name: 'South Korean Won',
    ticker: 'krw',
    value: 1359.3506945328236,
    currencyType: 'fiat',
  },
  kwd: {
    name: 'Kuwaiti Dinar',
    ticker: 'kwd',
    value: 0.30529199289535164,
    currencyType: 'fiat',
  },
  lkr: {
    name: 'Sri Lankan Rupee',
    ticker: 'lkr',
    value: 299.9010793298127,
    currencyType: 'fiat',
  },
  mmk: {
    name: 'Burmese Kyat',
    ticker: 'mmk',
    value: 2098.0000023617336,
    currencyType: 'fiat',
  },
  mxn: {
    name: 'Mexican Peso',
    ticker: 'mxn',
    value: 18.77348001704397,
    currencyType: 'fiat',
  },
  myr: {
    name: 'Malaysian Ringgit',
    ticker: 'myr',
    value: 4.228999997038608,
    currencyType: 'fiat',
  },
  ngn: {
    name: 'Nigerian Naira',
    ticker: 'ngn',
    value: 1532.4200017290473,
    currencyType: 'fiat',
  },
  nok: {
    name: 'Norwegian Krone',
    ticker: 'nok',
    value: 10.109898008254978,
    currencyType: 'fiat',
  },
  nzd: {
    name: 'New Zealand Dollar',
    ticker: 'nzd',
    value: 1.6478669960903807,
    currencyType: 'fiat',
  },
  php: {
    name: 'Philippine Peso',
    ticker: 'php',
    value: 56.376001062558736,
    currencyType: 'fiat',
  },
  pkr: {
    name: 'Pakistani Rupee',
    ticker: 'pkr',
    value: 285.2245003132019,
    currencyType: 'fiat',
  },
  pln: {
    name: 'Polish Zloty',
    ticker: 'pln',
    value: 3.625871995197858,
    currencyType: 'fiat',
  },
  rub: {
    name: 'Russian Ruble',
    ticker: 'rub',
    value: 78.79997408366326,
    currencyType: 'fiat',
  },
  sar: {
    name: 'Saudi Riyal',
    ticker: 'sar',
    value: 3.7501600005365567,
    currencyType: 'fiat',
  },
  sek: {
    name: 'Swedish Krona',
    ticker: 'sek',
    value: 9.55167101005786,
    currencyType: 'fiat',
  },
  sgd: {
    name: 'Singapore Dollar',
    ticker: 'sgd',
    value: 1.2739619998345126,
    currencyType: 'fiat',
  },
  thb: {
    name: 'Thai Baht',
    ticker: 'thb',
    value: 32.40583303378832,
    currencyType: 'fiat',
  },
  try: {
    name: 'Turkish Lira',
    ticker: 'try',
    value: 39.788298041452094,
    currencyType: 'fiat',
  },
  twd: {
    name: 'New Taiwan Dollar',
    ticker: 'twd',
    value: 29.018999031034188,
    currencyType: 'fiat',
  },
  uah: {
    name: 'Ukrainian hryvnia',
    ticker: 'uah',
    value: 41.75092204711494,
    currencyType: 'fiat',
  },
  vef: {
    name: 'Venezuelan bolívar fuerte',
    ticker: 'vef',
    value: 0.10012999775478468,
    currencyType: 'fiat',
  },
  vnd: {
    name: 'Vietnamese đồng',
    ticker: 'vnd',
    value: 26167.73565956473,
    currencyType: 'fiat',
  },
  zar: {
    name: 'South African Rand',
    ticker: 'zar',
    value: 17.638879012711193,
    currencyType: 'fiat',
  },
  xdr: {
    name: 'IMF Special Drawing Rights',
    ticker: 'xdr',
    value: 0.6961849947454656,
    currencyType: 'fiat',
  },
  xag: {
    name: 'Silver - Troy Ounce',
    ticker: 'xag',
    value: 0.02745114996087133,
    currencyType: 'commodity',
  },
  xau: {
    name: 'Gold - Troy Ounce',
    ticker: 'xau',
    value: 0.0002992943887080938,
    currencyType: 'commodity',
  },
  bits: {
    name: 'Bits',
    ticker: 'bits',
    value: 9.225522122806664,
    currencyType: 'crypto',
  },
  sats: {
    name: 'Satoshi',
    ticker: 'sats',
    value: 922.5522122806664,
    currencyType: 'crypto',
  },
  cop: {
    name: 'Colombian Peso',
    ticker: 'cop',
    value: 4020.329999998432,
    currencyType: 'fiat',
  },
  kes: {
    name: 'Kenyan Shilling',
    ticker: 'kes',
    value: 129.20000000184513,
    currencyType: 'fiat',
  },
  ron: {
    name: 'Romanian Leu',
    ticker: 'ron',
    value: 4.302400003896861,
    currencyType: 'fiat',
  },
  dop: {
    name: 'Dominican Peso',
    ticker: 'dop',
    value: 59.421077000552856,
    currencyType: 'fiat',
  },
  crc: {
    name: 'Costa Rican Colón',
    ticker: 'crc',
    value: 505.1511230011281,
    currencyType: 'fiat',
  },
  hnl: {
    name: 'Honduran Lempira',
    ticker: 'hnl',
    value: 26.133209998558144,
    currencyType: 'fiat',
  },
  zmw: {
    name: 'Zambian Kwacha',
    ticker: 'zmw',
    value: 24.02423300185325,
    currencyType: 'fiat',
  },
  svc: {
    name: 'Salvadoran Colón',
    ticker: 'svc',
    value: 8.749590998008589,
    currencyType: 'fiat',
  },
  bam: {
    name: 'Bosnia and Herzegovina Convertible Mark',
    ticker: 'bam',
    value: 1.6618870036093658,
    currencyType: 'fiat',
  },
  pen: {
    name: 'Peruvian Sol',
    ticker: 'pen',
    value: 3.5611860013883123,
    currencyType: 'fiat',
  },
  gtq: {
    name: 'Guatemalan Quetzal',
    ticker: 'gtq',
    value: 7.688288003161476,
    currencyType: 'fiat',
  },
  lbp: {
    name: 'Lebanese Pound',
    ticker: 'lbp',
    value: 89577.29288500333,
    currencyType: 'fiat',
  },
  amd: {
    name: 'Armenian Dram',
    ticker: 'amd',
    value: 384.5100000000923,
    currencyType: 'fiat',
  },
  sol: {
    name: 'Solana',
    ticker: 'sol',
    value: 0.006629188747026665,
    currencyType: 'crypto',
  },
  sei: {
    name: 'Sei Network',
    ticker: 'sei',
    value: 3.571422841670739,
    currencyType: 'crypto',
  },
  sonic: {
    name: 'Sonic',
    ticker: 'sonic',
    value: 3.0932878113426843,
    currencyType: 'crypto',
  },
};
