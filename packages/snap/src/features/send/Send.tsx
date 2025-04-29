import type { SendContext, SendFlowStage } from './types';
import { SendForm } from './views/SendForm/SendForm';
import { SendPending } from './views/SendPending/SendPending';
import { TransactionConfirmation } from './views/TransactionConfirmation/TransactionConfirmation';
import { TransactionFailure } from './views/TransactionFailure/TransactionFailure';
import { TransactionSuccess } from './views/TransactionSuccess/TransactionSuccess';

export type SendProps = {
  context: SendContext;
  inputToAddress?: string;
  inputAmount?: string;
};

/**
 * Maps each stage of the send flow to its corresponding component.
 */
export const MapStageToComponent: Record<
  SendFlowStage,
  ({ context, inputToAddress, inputAmount }: SendProps) => JSX.Element
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
 * @param props.inputToAddress - The input to address for the send flow.
 * @param props.inputAmount - The input amount for the send flow.
 * @returns The component for the send flow stage.
 */
export const Send = ({
  context,
  inputToAddress = undefined,
  inputAmount = undefined,
}: SendProps) => {
  const stage = context.stage ?? 'send-form';
  const Component = MapStageToComponent[stage];

  return (
    <Component
      context={context}
      inputToAddress={inputToAddress as string}
      inputAmount={inputAmount as string}
    />
  );
};
