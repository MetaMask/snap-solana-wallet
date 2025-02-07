import type { SnapComponent } from '@metamask/snaps-sdk/dist/jsx/component.cjs';

import type { SendContext, SendFlowStage } from './types';
import { SendForm } from './views/SendForm/SendForm';
import { SendPending } from './views/SendPending/SendPending';
import { TransactionConfirmation } from './views/TransactionConfirmation/TransactionConfirmation';
import { TransactionFailure } from './views/TransactionFailure/TransactionFailure';
import { TransactionSuccess } from './views/TransactionSuccess/TransactionSuccess';

export type SendProps = {
  context: SendContext;
};

/**
 * Maps each stage of the send flow to its corresponding component.
 */
export const MapStageToComponent: Record<
  SendFlowStage,
  SnapComponent<{ context: SendContext }>
> = {
  'send-form': SendForm,
  'transaction-confirmation': TransactionConfirmation,
  'send-pending': SendPending,
  'transaction-success': TransactionSuccess,
  'transaction-failure': TransactionFailure,
};

/**
 * Main component that controls the complete send flow.
 *
 * It renders the correct component based on the current stage.
 * The stage is set by the various event handlers of each component.
 *
 * @param props - The props for the send flow controller.
 * @param props.context - The context for the send flow.
 * @returns The component for the send flow stage.
 */
export const Send = ({ context }: SendProps) => {
  const stage = context.stage ?? 'send-form';
  const Component = MapStageToComponent[stage];

  return <Component context={context} />;
};
