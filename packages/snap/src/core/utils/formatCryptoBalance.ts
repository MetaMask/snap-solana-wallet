import BigNumber from 'bignumber.js';

const MIN_AMOUNT = 0.000001;
const MAX_SIGNIFICANT_DECIMAL_PLACES = 3;
const ZERO_DISPLAY = '0';
const DEFAULT_PRECISION = new BigNumber(MIN_AMOUNT).decimalPlaces();

/**
 * Formats a number with maximum precision, preserving all decimal places.
 *
 * @param locale - The locale to use for number formatting.
 * @param value - The numeric value to format.
 * @returns The formatted number as a string.
 */
function formatAmount(locale: string, value: number | BigNumber): string {
  const bigNumberValue = new BigNumber(value);
  const numberOfDecimals = bigNumberValue.decimalPlaces();
  const formattedValue = bigNumberValue.toFixed(numberOfDecimals ?? 0);
  const [localeCode] = locale.split('_');

  const [integerPart, fractionalPart] = formattedValue.split('.');
  const formattedIntegerPart = new Intl.NumberFormat(localeCode).format(
    integerPart as unknown as number,
  );

  return fractionalPart
    ? `${formattedIntegerPart}.${fractionalPart}`
    : formattedIntegerPart;
}

/**
 * Formats a token amount with commas and a specified symbol.
 *
 * @param amount - The amount of tokens as a BigNumber.
 * @param locale - The locale to use for number formatting.
 * @returns The formatted token amount with symbol.
 */
export function formatCryptoBalance(
  amount: number | string | BigNumber,
  locale: string,
) {
  const [localeCode] = locale.split('_');

  try {
    const bignumberAmount = new BigNumber(amount);

    if (bignumberAmount.isNaN()) {
      return ZERO_DISPLAY;
    }

    if (bignumberAmount.isZero()) {
      return ZERO_DISPLAY;
    }

    if (bignumberAmount.abs().lt(MIN_AMOUNT)) {
      return `<${formatAmount(locale, MIN_AMOUNT)}`;
    }

    if (bignumberAmount.abs().lt(1)) {
      return new Intl.NumberFormat(localeCode, {
        maximumSignificantDigits: MAX_SIGNIFICANT_DECIMAL_PLACES,
      } as Intl.NumberFormatOptions).format(
        Number(bignumberAmount.toFixed(DEFAULT_PRECISION ?? 0)),
      );
    }

    // Preserve all digits left of the decimal point.
    // Cap the digits right of the decimal point: The more digits present
    // on the left side of the decimal point, the less decimal places
    // we show on the right side.
    const digitsLeftOfDecimal = bignumberAmount
      .abs()
      .integerValue()
      .toString().length;
    const maximumFractionDigits = Math.max(
      0,
      MAX_SIGNIFICANT_DECIMAL_PLACES - digitsLeftOfDecimal + 1,
    );

    const formattedAmount = new Intl.NumberFormat(locale, {
      maximumFractionDigits,
    } as Intl.NumberFormatOptions).format(
      // string is valid parameter for format function
      // for some reason it gives TS issue
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/format#number
      bignumberAmount.toFixed(maximumFractionDigits) as unknown as number,
    );

    return formattedAmount;
  } catch (error) {
    console.error(error);
    return ZERO_DISPLAY;
  }
}
