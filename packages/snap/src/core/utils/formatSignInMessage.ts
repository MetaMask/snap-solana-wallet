import type { SolanaSignInRequest } from '../services/wallet/structs';

/**
 * Formats a Solana Sign-In message into a string.
 *
 * @param signInParams - The sign-in message parameters.
 * @returns The formatted message as a string.
 */
export function formatSignInMessage(
  signInParams: SolanaSignInRequest['params'],
): string {
  // ${domain} wants you to sign in with your Solana account:
  // ${address}
  //
  // ${statement}
  //
  // URI: ${uri}
  // Version: ${version}
  // Chain ID: ${chain}
  // Nonce: ${nonce}
  // Issued At: ${issued-at}
  // Expiration Time: ${expiration-time}
  // Not Before: ${not-before}
  // Request ID: ${request-id}
  // Resources:
  // - ${resources[0]}
  // - ${resources[1]}
  // ...
  // - ${resources[n]}

  let message = `${signInParams.domain} wants you to sign in with your Solana account:\n`;
  message += `${signInParams.address}`;

  if (signInParams.statement) {
    message += `\n\n${signInParams.statement}`;
  }

  const fields: string[] = [];
  if (signInParams.uri) {
    fields.push(`URI: ${signInParams.uri}`);
  }
  if (signInParams.version) {
    fields.push(`Version: ${signInParams.version}`);
  }
  if (signInParams.chainId) {
    fields.push(`Chain ID: ${signInParams.chainId}`);
  }
  if (signInParams.nonce) {
    fields.push(`Nonce: ${signInParams.nonce}`);
  }
  if (signInParams.issuedAt) {
    fields.push(`Issued At: ${signInParams.issuedAt}`);
  }
  if (signInParams.expirationTime) {
    fields.push(`Expiration Time: ${signInParams.expirationTime}`);
  }
  if (signInParams.notBefore) {
    fields.push(`Not Before: ${signInParams.notBefore}`);
  }
  if (signInParams.requestId) {
    fields.push(`Request ID: ${signInParams.requestId}`);
  }
  if (signInParams.resources) {
    fields.push(`Resources:`);
    for (const resource of signInParams.resources) {
      fields.push(`- ${resource}`);
    }
  }
  if (fields.length) {
    message += `\n\n${fields.join('\n')}`;
  }

  return message;
}
