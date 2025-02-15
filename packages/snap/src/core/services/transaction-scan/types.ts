import type { SecurityAlertSimulationValidationResponse } from '../../clients/security-alerts-api/types';

export type TransactionScanStatus = 'SUCCESS' | 'ERROR';

export type TransactionScanAssetChange = {
  type: 'in' | 'out';
  value: number | null;
  price: number | null;
  symbol: string;
  name: string;
  logo: string | null;
};

export type TransactionScanEstimatedChanges = {
  assets: TransactionScanAssetChange[];
};

export type TransactionScanValidation = {
  type: SecurityAlertSimulationValidationResponse['result']['validation']['result_type'];
  reason: SecurityAlertSimulationValidationResponse['result']['validation']['reason'];
};

export type TransactionScanResult = {
  status: TransactionScanStatus;
  estimatedChanges: TransactionScanEstimatedChanges;
  validation: TransactionScanValidation;
};
