import { showDialog, createInterface } from '../../core/utils/interface';
import { SendForm } from './components/SendForm/SendForm';

/**
 * Renders the send form interface.
 * @returns A promise that resolves when the interface is created.
 */
export async function renderSend() {
  const id = await createInterface(<SendForm />, {});

  return showDialog(id);
}
