import { SolMethod } from '@metamask/keyring-api';
import { type SnapComponent } from '@metamask/snaps-sdk/jsx';

import { type ConfirmationContext } from './types';
import { ConfirmTransaction } from './views/ConfirmTransaction/ConfirmTransation';

export type ConfirmationProps = {
  context: ConfirmationContext;
};

const MapMethodToComponent: Record<
  SolMethod,
  SnapComponent<{ context: ConfirmationContext }>
> = {
  [SolMethod.SendAndConfirmTransaction]: ConfirmTransaction,
  [SolMethod.SignAndSendTransaction]: ConfirmTransaction,
  [SolMethod.SignTransaction]: ConfirmTransaction,
  [SolMethod.SignMessage]: ConfirmTransaction,
  [SolMethod.SignIn]: ConfirmTransaction,
};

/**
 * Main component that controls the complete confirmation flow.
 *
 * It renders the correct component based on the current stage.
 * The stage is set by the various event handlers of each component.
 *
 * @param props - The props for the confirmation flow controller.
 * @param props.context - The context for the confirmation flow.
 * @returns The component for the confirmation flow stage.
 */
export const Confirmation = ({ context }: ConfirmationProps) => {
  const Component = MapMethodToComponent[context.method];

  return <Component context={context} />;
};
