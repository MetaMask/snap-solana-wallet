import type { SecurityAlertSimulationValidationResponse } from '../../clients/security-alerts-api/types';

export type TransactionScanStatus = 'SUCCESS' | 'ERROR';

export type TransactionScanAssetChange = {
  type: 'in' | 'out';
  value: number | null;
  price: number | null;
  symbol: string;
  name: string;
  logo: string | null;
  imageSvg: string | null;
};

export type TransactionScanEstimatedChanges = {
  assets: TransactionScanAssetChange[];
};

export type TransactionScanValidation = {
  type: SecurityAlertSimulationValidationResponse['result']['validation']['result_type'] | null;
  reason: SecurityAlertSimulationValidationResponse['result']['validation']['reason'] | null;
};

export type TransactionScanError = {
  type: string | null;
  code: string | null;
};

export type TransactionScanResult = {
  status: TransactionScanStatus;
  estimatedChanges: TransactionScanEstimatedChanges;
  validation: TransactionScanValidation;
  error: TransactionScanError | null;
};

export enum SecurityAlertResponse {
  Benign = 'Benign',
  Warning = 'Warning',
  Malicious = 'Malicious',
}

export enum ScanStatus {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}
