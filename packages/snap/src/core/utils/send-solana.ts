import web3, { Connection } from '@solana/web3.js';

async function sendSolana() {
  const connection = new web3.Connection(
    '<YOUR_QUICKNODE_URL_HERE>',
    'confirmed',
  );

  const secret = [00, ...00]; // Replace with your secret key
  const from = web3.Keypair.fromSecretKey(new Uint8Array(secret));

  // Generate a random address to send to
  const to = web3.Keypair.generate();

  const transaction = new web3.Transaction().add(
    web3.SystemProgram.transfer({
      fromPubkey: from.publicKey,
      toPubkey: to.publicKey,
      lamports: web3.LAMPORTS_PER_SOL / 100,
    }),
  );

  // Sign transaction, broadcast, and confirm
  const signature = await web3.sendAndConfirmTransaction(
    connection,
    transaction,
    [from],
  );
}
