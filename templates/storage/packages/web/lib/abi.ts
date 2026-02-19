// ABI for FileRegistry.sol
// Re-run `npm run compile` in packages/contracts to regenerate if the contract changes.
export const FILE_REGISTRY_ABI = [
  {
    type: "function",
    name: "registerFile",
    stateMutability: "nonpayable",
    inputs: [
      { name: "contentId", type: "string" },
      { name: "filename", type: "string" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "getFiles",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "contentId", type: "string" },
          { name: "filename", type: "string" },
          { name: "timestamp", type: "uint256" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "getFileCount",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "event",
    name: "FileUploaded",
    inputs: [
      { name: "owner", type: "address", indexed: true },
      { name: "contentId", type: "string", indexed: false },
      { name: "filename", type: "string", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
] as const;
