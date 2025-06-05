A scenario file represents a sample transacting situation. Each scenario describes a sample "real world" transaction message, as well as relevant or derived data like:

- The transaction message
- Its base64 encoded version
- The signer account
- The signed transaction
- The signature

All of the above are expected to match together, and the unit tests in `TransactionHelper.test.ts` verify this fact.
