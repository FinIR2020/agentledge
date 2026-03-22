/**
 * Hedera Client — singleton connection to Hedera testnet
 */
import { Client, AccountId, PrivateKey, Hbar } from "@hashgraph/sdk";
import dotenv from "dotenv";
dotenv.config();

const accountId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID);
const privateKey = PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY); // auto-detects ECDSA or ED25519

const client = Client.forTestnet();
client.setOperator(accountId, privateKey);
client.setDefaultMaxTransactionFee(new Hbar(10));
client.setDefaultMaxQueryPayment(new Hbar(5));

export { client, accountId, privateKey };
