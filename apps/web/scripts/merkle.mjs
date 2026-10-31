// A Merkle tree for XOMRewardVault rounds, built the way the vault checks claims: each leaf is
// keccak256(bytes.concat(keccak256(abi.encode(account, amount)))) and pairs hash sorted (OpenZeppelin MerkleProof).
import { concat, encodeAbiParameters, keccak256 } from "viem";

export const leafOf = (account, amount) => keccak256(keccak256(encodeAbiParameters([{ type: "address" }, { type: "uint256" }], [account, BigInt(amount)])));

const hashPair = (a, b) => keccak256(a.toLowerCase() < b.toLowerCase() ? concat([a, b]) : concat([b, a]));

/** Builds the tree for [{ account, amount }]; returns the root and each entry's proof, in the order given. */
export function buildTree(entries) {
  if (!entries.length) throw new Error("A round needs at least one wallet.");
  const leaves = entries.map((e) => leafOf(e.account, e.amount));
  const sorted = [...leaves].sort((a, b) => (a.toLowerCase() < b.toLowerCase() ? -1 : 1));
  const layers = [sorted];
  while (layers[layers.length - 1].length > 1) {
    const prev = layers[layers.length - 1];
    const next = [];
    for (let i = 0; i < prev.length; i += 2) next.push(i + 1 < prev.length ? hashPair(prev[i], prev[i + 1]) : prev[i]);
    layers.push(next);
  }
  const proofOf = (leaf) => {
    let i = sorted.indexOf(leaf);
    const proof = [];
    for (const layer of layers.slice(0, -1)) {
      const j = i ^ 1;
      if (j < layer.length) proof.push(layer[j]);
      i >>= 1;
    }
    return proof;
  };
  return { root: layers[layers.length - 1][0], proofs: leaves.map(proofOf) };
}

/** What MerkleProof.verify does on chain. */
export const verify = (proof, root, leaf) => proof.reduce((h, p) => hashPair(h, p), leaf).toLowerCase() === root.toLowerCase();
