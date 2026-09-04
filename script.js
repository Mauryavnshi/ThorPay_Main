/* ==========================================================================
   ThorPay — app logic
   Works on both index.html (landing, wallet connect only) and app.html
   (full dashboard: balances, swap, bridge, send, history).
   Fill in / verify addresses below before relying on this for anything
   beyond testnet experimentation.
   ========================================================================== */

const CONFIG = {
  chainIdHex: "0x4CEF52",        // 5042002 decimal — Arc Testnet
  chainName: "Arc Testnet",
  rpcUrls: ["https://rpc.testnet.arc.network"],
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 }, // native gas display, 18 decimals
  blockExplorerUrls: ["https://testnet.arcscan.app"],

  // Verified from https://docs.arc.io/arc/references/contract-addresses (Arc Testnet only)
  USDC_ERC20: "0x3600000000000000000000000000000000000000", // 6 decimals — use this for balances/transfers
  EURC_ERC20: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",  // 6 decimals

  // cirBTC — Arc Testnet address (8 decimals, same convention as BTC).
  CIRBTC_ERC20: "0xf0C4a4CE82A5746AbAAd9425360Ab04fbBA432BF",

  // Circle CCTP V2 — testnet TokenMessengerV2 / MessageTransmitterV2 are deployed at
  // the SAME address on every supported testnet (deterministic CREATE2 deployment),
  // verified against Circle's own CCTP Go SDK docs.
  CCTP_DOMAIN_ARC: 26,
  TOKEN_MESSENGER_V2: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
  MESSAGE_TRANSMITTER_V2: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275",

  // Circle StableFX escrow (legacy path — Swap now runs through Circle App Kit instead)
  STABLEFX_ESCROW: "0x867650F5eAe8df91445971f14d89fd84F0C9a9f8",

  // Circle Iris attestation API (testnet)
  IRIS_API: "https://iris-api-sandbox.circle.com",

  // Destination testnets for Bridge. rpcUrls are public read-only endpoints, used to show
  // your destination-chain balance without needing MetaMask to switch networks first.
  bridgeDestinations: {
    ethSepolia: {
      name: "Ethereum Sepolia", domain: 0,
      chainIdHex: "0xaa36a7",
      rpcUrls: ["https://ethereum-sepolia-rpc.publicnode.com"],
      blockExplorerUrls: ["https://sepolia.etherscan.io"],
      nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
      usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
      // cirBTC on Sepolia — not wired into the Bridge flow yet (Bridge only moves
      // USDC through CCTP right now); kept here so it's easy to plug in later.
      cirbtc: "0x3a3fe695F684Bf9b9e43CF43C2b895Ea5e392bB3",
      minFinalityThreshold: 1000 // confirmed/Fast — avoids 13-15min finalized waits on Sepolia
    },
    baseSepolia: {
      name: "Base Sepolia", domain: 6,
      chainIdHex: "0x14a34",
      rpcUrls: ["https://sepolia.base.org"],
      blockExplorerUrls: ["https://sepolia.basescan.org"],
      nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
      usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      minFinalityThreshold: 1000
    },
    arbSepolia: {
      name: "Arbitrum Sepolia", domain: 3,
      chainIdHex: "0x66EEE",
      rpcUrls: ["https://sepolia-rollup.arbitrum.io/rpc"],
      blockExplorerUrls: ["https://sepolia.arbiscan.io"],
      nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
      usdc: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
      explorerTx: (txHash) => "https://sepolia.arbiscan.io/tx/" + txHash,
      minFinalityThreshold: 1000
    }
  },

  // Unified network configuration used by the Bridge (all four supported testnets).
  // A single object is shared across the From and To selectors so any supported
  // route can be picked. Addresses are the OFFICIAL Circle/Arc testnet values:
  //   - CCTP TokenMessengerV2 / MessageTransmitterV2 are CREATE2-deployed at the
  //     SAME address on every supported testnet (verified on Arc, Ethereum Sepolia,
  //     Base Sepolia and Arbitrum Sepolia per Circle's CCTP contract-addresses docs).
  //   - USDC token addresses per Circle's official usdc-contract-addresses docs.
  //   - CCTP domain IDs per Circle's supported-chains-and-domains docs.
  networks: {
    arc: {
      key: "arc",
      name: "Arc Testnet",
      domain: 26,
      chainIdHex: "0x4CEF52",
      rpcUrls: ["https://rpc.testnet.arc.network"],
      blockExplorerUrls: ["https://testnet.arcscan.app"],
      nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 }, // Arc's native gas token IS USDC
      tokenMessenger: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
      messageTransmitter: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275",
      usdc: "0x3600000000000000000000000000000000000000",
      nativeGasIsUsdc: true,
      minFinalityThreshold: 2000, // Arc = instant finality; must use 2000 for IRIS to attest
      explorerTx: (txHash) => "https://testnet.arcscan.app/tx/" + txHash
    },
    arbSepolia: {
      key: "arbSepolia",
      name: "Arbitrum Sepolia",
      domain: 3,
      chainIdHex: "0x66EEE",
      rpcUrls: ["https://sepolia-rollup.arbitrum.io/rpc"],
      blockExplorerUrls: ["https://sepolia.arbiscan.io"],
      nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
      tokenMessenger: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
      messageTransmitter: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275",
      usdc: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
      nativeGasIsUsdc: false,
      minFinalityThreshold: 1000,
      explorerTx: (txHash) => "https://sepolia.arbiscan.io/tx/" + txHash
    },
    baseSepolia: {
      key: "baseSepolia",
      name: "Base Sepolia",
      domain: 6,
      chainIdHex: "0x14a34",
      rpcUrls: ["https://sepolia.base.org"],
      blockExplorerUrls: ["https://sepolia.basescan.org"],
      nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
      tokenMessenger: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
      messageTransmitter: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275",
      usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      nativeGasIsUsdc: false,
      minFinalityThreshold: 1000,
      explorerTx: (txHash) => "https://sepolia.basescan.org/tx/" + txHash
    },
    ethSepolia: {
      key: "ethSepolia",
      name: "Ethereum Sepolia",
      domain: 0,
      chainIdHex: "0xaa36a7",
      rpcUrls: ["https://ethereum-sepolia-rpc.publicnode.com"],
      blockExplorerUrls: ["https://sepolia.etherscan.io"],
      nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
      tokenMessenger: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
      messageTransmitter: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275",
      usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
      nativeGasIsUsdc: false,
      minFinalityThreshold: 1000,
      explorerTx: (txHash) => "https://sepolia.etherscan.io/tx/" + txHash
    }
  },

  // Valid Bridge routes. Every pair here is a supported Circle CCTP direction.
  // Format: { from: <networkKey>, to: <networkKey> }
  bridgeRoutes: [
    { from: "arc", to: "arbSepolia" },
    { from: "arbSepolia", to: "arc" },
    { from: "arc", to: "baseSepolia" },
    { from: "baseSepolia", to: "arc" },
    { from: "arc", to: "ethSepolia" },
    { from: "ethSepolia", to: "arc" }
  ]
};

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

const TOKEN_MESSENGER_V2_ABI = [
  "function depositForBurn(uint256 amount, uint32 destinationDomain, bytes32 mintRecipient, address burnToken, bytes32 destinationCaller, uint256 maxFee, uint32 minFinalityThreshold) external returns (uint64 nonce)"
];

const MESSAGE_TRANSMITTER_V2_ABI = [
  "function receiveMessage(bytes message, bytes attestation) external returns (bool)"
];

let provider, signer, userAddress;
let history = [];
let latestBalances = { USDC: null, EURC: null, CIRBTC: null };
let pendingMint = null;
let pendingBurn = null; // { txHash, dest, amt } — set when attestation isn't ready yet, so "Check attestation again" can retry without re-burning

// Bridge — the currently selected source network key (arc | arbSepolia | baseSepolia | ethSepolia)
let bridgeFromKey = "arc";
// Per-network USDC balances keyed by network key (arc, arbSepolia, baseSepolia, ethSepolia).
// Kept separate so the Bridge's From-balance reflects the selected source chain and is never
// confused with the Arc-only balances shown on the dashboard balance-card.
let bridgeNetworkBalances = {};

function networkByKey(key) {
  return CONFIG.networks[key] || CONFIG.networks.arc;
}

/* -------------------------------------------------------------------------
   Formatting — never show a negative balance. Values under 1 keep enough
   decimal places to still be visible instead of rounding away to "0.00".
   ------------------------------------------------------------------------- */
function formatBal(n) {
  if (n === null || n === undefined || isNaN(n)) return "—";
  if (n <= 0) return "0.00";
  if (n < 1) {
    let s = n.toFixed(8).replace(/0+$/, "");
    if (s.endsWith(".")) s += "00";
    return s;
  }
  return n.toFixed(2);
}

/* -------------------------------------------------------------------------
   Amount inputs — block negative values as the person types, not just on
   submit (the min="0" HTML attribute alone doesn't stop manual typing of "-").
   ------------------------------------------------------------------------- */
["swapFromAmt", "bridgeFromAmt", "sendAmt"].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener("input", () => {
    if (el.value !== "" && Number(el.value) < 0) el.value = "0";
  });
});

/* -------------------------------------------------------------------------
   Tab switching (app.html only — no-ops harmlessly if elements don't exist)
   ------------------------------------------------------------------------- */
document.querySelectorAll("[data-tab]").forEach(el => {
  el.addEventListener("click", () => {
    const tab = el.dataset.tab;
    document.querySelectorAll("nav a[data-tab]").forEach(a => a.classList.toggle("active", a.dataset.tab === tab));
    document.querySelectorAll(".tab-btn").forEach(a => a.classList.toggle("active", a.dataset.tab === tab));
    document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
    const panel = document.getElementById("panel-" + tab);
    if (panel) panel.classList.add("active");
  });
});

/* -------------------------------------------------------------------------
   Wallet connect / disconnect
   ------------------------------------------------------------------------- */
const connectBtn = document.getElementById("connectBtn");
const disconnectBtn = document.getElementById("disconnectBtn");
if (connectBtn) connectBtn.addEventListener("click", connectWallet);
if (disconnectBtn) disconnectBtn.addEventListener("click", disconnectWallet);

async function connectWallet() {
  if (!window.ethereum) {
    alert("MetaMask not found. Please install the MetaMask browser extension first.");
    return;
  }
  try {
    localStorage.removeItem("thorpay_disconnected"); // user explicitly (re)connected

    await window.ethereum.request({ method: "eth_requestAccounts" });
    await ensureArcNetwork();

    provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    signer = provider.getSigner();
    userAddress = await signer.getAddress();

    if (connectBtn) { connectBtn.innerText = userAddress.slice(0, 6) + "..." + userAddress.slice(-4); connectBtn.style.display = "inline-flex"; }
    if (disconnectBtn) disconnectBtn.style.display = "inline-flex";

    const welcome = document.getElementById("welcomeMsg");
    if (welcome) { welcome.innerText = "Welcome back"; welcome.style.color = ""; }

    ["swapBtn", "bridgeBtn", "sendBtn"].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.disabled = false;
    });
    setBtnLabel("swapBtn", "Exchange");
    setBtnLabel("bridgeBtn", "Bridge");
    setBtnLabel("sendBtn", "Send");

    await checkNetwork();
    loadHistory();
    await refreshBalances();
    // Bridge balances + the destination balance follow the currently selected route.
    await refreshBridgeBalances();
  } catch (err) {
    console.error(err);
    alert("Wallet connection failed: " + (err.message || err));
  }
}

function disconnectWallet() {
  provider = null; signer = null; userAddress = null;
  latestBalances = { USDC: null, EURC: null, CIRBTC: null };
  bridgeNetworkBalances = {};
  pendingMint = null;
  pendingBurn = null;
  try { localStorage.setItem("thorpay_disconnected", "1"); } catch (e) {}

  if (connectBtn) connectBtn.innerText = "Connect Wallet";
  if (disconnectBtn) disconnectBtn.style.display = "none";

  updateNetworkPill(false, false);
  const banner = document.getElementById("networkBanner");
  if (banner) banner.style.display = "none";

  // Left clickable on purpose — each button's own click handler now
  // triggers wallet connect first when nothing's connected yet, instead of
  // sitting disabled and eating the click silently.
  setBtnLabel("swapBtn", "Connect wallet to swap");
  setBtnLabel("bridgeBtn", "Connect wallet to bridge");
  setBtnLabel("sendBtn", "Connect wallet to send");
  const mintBtn = document.getElementById("bridgeMintBtn");
  if (mintBtn) mintBtn.style.display = "none";

  setText("usdcBal", "0.00"); setText("eurcBal", "0.00"); setText("totalBalance", "$0.00");
  setText("swapFromBal", "Balance: 0.00"); setText("bridgeFromBal", "Balance: 0.00"); setText("sendBal", "Balance: 0.00");
  setText("bridgeToBal", "Connect your wallet to see this balance");

  const welcome = document.getElementById("welcomeMsg");
  if (welcome) { welcome.innerText = "Welcome to ThorPay"; welcome.style.color = ""; }

  history = [];
  renderHistory();

  // Best-effort permission revoke (EIP-2255) — not every wallet supports this, ignore failures.
  if (window.ethereum && window.ethereum.request) {
    window.ethereum.request({ method: "wallet_revokePermissions", params: [{ eth_accounts: {} }] }).catch(() => {});
  }
}

function setBtnLabel(id, label) {
  const btn = document.getElementById(id);
  if (btn) btn.innerText = label;
}

async function ensureArcNetwork() {
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: CONFIG.chainIdHex }]
    });
  } catch (switchErr) {
    // Different wallets signal "chain not added yet" differently — MetaMask
    // uses error code 4902, but Rabby and others don't always match that
    // exactly. Rather than guess at every wallet's error shape, just always
    // try wallet_addEthereumChain on any switch failure: if the chain is
    // already present, wallets handle that gracefully (switch or no-op)
    // instead of erroring.
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [{
        chainId: CONFIG.chainIdHex,
        chainName: CONFIG.chainName,
        rpcUrls: CONFIG.rpcUrls,
        nativeCurrency: CONFIG.nativeCurrency,
        blockExplorerUrls: CONFIG.blockExplorerUrls
      }]
    });
  }
}

async function switchOrAddChain(dest) {
  try {
    await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: dest.chainIdHex }] });
  } catch (switchErr) {
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [{
        chainId: dest.chainIdHex,
        chainName: dest.name,
        rpcUrls: dest.rpcUrls,
        nativeCurrency: dest.nativeCurrency,
        blockExplorerUrls: dest.blockExplorerUrls
      }]
    });
  }
}

/* -------------------------------------------------------------------------
   Network pill + wrong-network banner
   ------------------------------------------------------------------------- */
function updateNetworkPill(connected, correctChain) {
  const pill = document.getElementById("networkPill");
  if (pill) pill.classList.toggle("disconnected", !(connected && correctChain));
}

async function checkNetwork() {
  const banner = document.getElementById("networkBanner");
  if (!window.ethereum || !userAddress) {
    updateNetworkPill(false, false);
    if (banner) banner.style.display = "none";
    return false;
  }
  try {
    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    const correct = chainId.toLowerCase() === CONFIG.chainIdHex.toLowerCase();
    updateNetworkPill(true, correct);
    if (banner) banner.style.display = correct ? "none" : "flex";
    return correct;
  } catch (e) {
    console.warn("network check failed", e);
    updateNetworkPill(true, false);
    return false;
  }
}

const switchNetworkBtn = document.getElementById("switchNetworkBtn");
if (switchNetworkBtn) {
  switchNetworkBtn.addEventListener("click", async () => {
    try {
      await ensureArcNetwork();
      provider = new ethers.providers.Web3Provider(window.ethereum, "any");
      signer = provider.getSigner();
      await checkNetwork();
      await refreshBalances();
    } catch (e) {
      console.error("switch to Arc failed", e);
    }
  });
}

/* -------------------------------------------------------------------------
   Balances — always read through the ERC-20 interface (6 decimals) per
   Arc's own guidance, rather than the native 18-decimal gas balance.

   Reads go through window.ethereum.request({method:"eth_call"}) directly —
   NOT through ethers' Web3Provider (network detection hangs on Arc's
   unlisted chain ID on some MetaMask builds) and NOT through a raw
   JsonRpcProvider fetch() (blocked by CORS on Arc's public RPC).

   The actual failure seen in testing was neither of those — it was Arc's
   public testnet RPC returning "request limit reached" (error -32011)
   when hit with several eth_call requests in a burst. Two fixes for that:
     1. Decimals are fixed for a known ERC-20 (never change), so they're
        hardcoded below instead of fetched — that alone halves the call
        count for every balance check.
     2. Calls run one at a time with a short gap, and retry with backoff
        specifically on a rate-limit response, instead of firing every
        token's balance check simultaneously.
   ------------------------------------------------------------------------- */
const ERC20_IFACE = new ethers.utils.Interface(ERC20_ABI);
const TOKEN_DECIMALS = {
  [CONFIG.USDC_ERC20.toLowerCase()]: 6,
  [CONFIG.EURC_ERC20.toLowerCase()]: 6
};
if (CONFIG.CIRBTC_ERC20) TOKEN_DECIMALS[CONFIG.CIRBTC_ERC20.toLowerCase()] = 8;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function isRateLimitError(err) {
  const msg = ((err && err.message) || String(err)).toLowerCase();
  return err?.code === -32011 || msg.includes("request limit") || msg.includes("rate limit") || msg.includes("too many requests");
}

async function ethCallViaWallet(tokenAddress, fnName, args = [], attempt = 0) {
  const data = ERC20_IFACE.encodeFunctionData(fnName, args);
  try {
    const result = await window.ethereum.request({
      method: "eth_call",
      params: [{ to: tokenAddress, data }, "latest"]
    });
    return ERC20_IFACE.decodeFunctionResult(fnName, result)[0];
  } catch (err) {
    if (isRateLimitError(err) && attempt < 3) {
      await sleep(600 * (attempt + 1)); // 600ms, 1200ms, 1800ms backoff
      return ethCallViaWallet(tokenAddress, fnName, args, attempt + 1);
    }
    throw err;
  }
}

async function tokenBalance(tokenAddress) {
  const decimals = TOKEN_DECIMALS[tokenAddress.toLowerCase()] ?? 6;
  const raw = await ethCallViaWallet(tokenAddress, "balanceOf", [userAddress]);
  return Number(ethers.utils.formatUnits(raw, decimals));
}

async function readOnlyBalance(rpcUrl, tokenAddress, address) {
  const ro = new ethers.providers.JsonRpcProvider(rpcUrl);
  const c = new ethers.Contract(tokenAddress, ERC20_ABI, ro);
  const [raw, decimals] = await Promise.all([c.balanceOf(address), c.decimals()]);
  return Number(ethers.utils.formatUnits(raw, decimals));
}

async function refreshBalances() {
  if (!provider || !userAddress) return;

  // One at a time, with a small gap — avoids bursting Arc's public RPC
  // rate limit the way Promise.all's simultaneous requests did.
  let usdc = null, eurc = null, usdcErr = null, eurcErr = null;
  try { usdc = await tokenBalance(CONFIG.USDC_ERC20); } catch (e) { usdcErr = e; console.error("USDC balance fetch failed", e); }
  await sleep(150);
  try { eurc = await tokenBalance(CONFIG.EURC_ERC20); } catch (e) { eurcErr = e; console.error("EURC balance fetch failed", e); }

  latestBalances.USDC = usdc;
  latestBalances.EURC = eurc;

  setText("usdcBal", formatBal(usdc));
  setText("eurcBal", formatBal(eurc));
  setText("totalBalance", "$" + formatBal(Math.max(0, (usdc || 0) + (eurc || 0))));
  setText("sendBal", "Balance: " + formatBal(document.getElementById("sendToken")?.value === "EURC" ? eurc : usdc));

  const welcome = document.getElementById("welcomeMsg");
  if (usdc === null || eurc === null) {
    const reason = usdcErr || eurcErr;
    const reasonMsg = reason ? (reason.message || String(reason)).slice(0, 140) : "unknown error";
    if (welcome) {
      welcome.innerText = "Couldn't load balance — " + reasonMsg;
      welcome.style.color = "var(--red)";
    }
  } else if (welcome) {
    welcome.innerText = "Welcome back";
    welcome.style.color = "";
  }

  // cirBTC — only wired up once Arc publishes a public contract address.
  if (CONFIG.CIRBTC_ERC20) {
    await sleep(150);
    try {
      const cirbtc = await tokenBalance(CONFIG.CIRBTC_ERC20);
      latestBalances.CIRBTC = cirbtc;
      setText("cirbtcBal", formatBal(cirbtc));
      document.getElementById("cirbtcBal")?.classList.remove("disabled");
      setText("cirbtcSub", "Arc Testnet");
    } catch (e) {
      console.error("cirBTC balance fetch failed", e);
    }
  }

  // Swap panel's "Balance: ..." lines (both From and To sides) — depend on
  // whichever token is currently selected in each dropdown (USDC / EURC /
  // cirBTC), so they have to be refreshed here once every balance has been
  // fetched, same as they're refreshed below whenever either dropdown changes.
  updateSwapFromBal();
  updateSwapToBal();

  document.dispatchEvent(new CustomEvent("thorpay:balances"));
}

function updateSwapFromBal() {
  const sel = document.getElementById("swapFromToken");
  const sym = sel ? sel.value : "USDC";
  setText("swapFromBal", "Balance: " + formatBal(latestBalances[sym]));
}
function updateSwapToBal() {
  const sel = document.getElementById("swapToToken");
  const sym = sel ? sel.value : "EURC";
  setText("swapToBal", "Balance: " + formatBal(latestBalances[sym]));
}
const swapFromTokenSel = document.getElementById("swapFromToken");
if (swapFromTokenSel) swapFromTokenSel.addEventListener("change", updateSwapFromBal);
const swapToTokenSel = document.getElementById("swapToToken");
if (swapToTokenSel) swapToTokenSel.addEventListener("change", updateSwapToBal);

/* -------------------------------------------------------------------------
   Bridge balance helpers.

   The Bridge can source from any of the four supported testnets, so its
   "From" and "To" USDC balances must follow the selected route — they are
   read over each network's public RPC (read-only) rather than only what
   MetaMask is currently on, so the numbers always match the chosen chain.
   ------------------------------------------------------------------------- */

function getBridgeToKey() {
  const sel = document.getElementById("bridgeToChain");
  return (sel && sel.value) || "arc";
}

function getBridgeFromKey() {
  const sel = document.getElementById("bridgeFromChain");
  return (sel && sel.value) || bridgeFromKey;
}

function isBridgeRoute(fromKey, toKey) {
  if (fromKey === toKey) return false;
  return CONFIG.bridgeRoutes.some(r => r.from === fromKey && r.to === toKey);
}

async function currentChainId() {
  return (await window.ethereum.request({ method: "eth_chainId" })).toLowerCase();
}

// Is the wallet currently on the given network (by chainIdHex)?
async function isWalletOnNetwork(network) {
  try {
    const cid = await currentChainId();
    return cid === network.chainIdHex.toLowerCase();
  } catch (e) {
    return false;
  }
}

// Read USDC balance for the connected address off a given NETWORK (via its
// public read-only RPC) and cache it in bridgeNetworkBalances[networkKey].
async function fetchBridgeNetworkBalance(networkKey) {
  const net = networkByKey(networkKey);
  if (!userAddress) return null;
  // If the wallet is connected to this exact chain, read through the wallet
  // (next to nothing can go wrong); otherwise read the public RPC.
  try {
    const isWalletNet = await isWalletOnNetwork(net);
    if (isWalletNet && provider) {
      const c = new ethers.Contract(net.usdc, ERC20_ABI, provider);
      const [raw, decimals] = await Promise.all([c.balanceOf(userAddress), c.decimals()]);
      bridgeNetworkBalances[networkKey] = Number(ethers.utils.formatUnits(raw, decimals));
    } else {
      const bal = await readOnlyBalance(net.rpcUrls[0], net.usdc, userAddress);
      bridgeNetworkBalances[networkKey] = bal;
    }
  } catch (e) {
    console.warn("could not read " + net.name + " USDC balance", e);
    bridgeNetworkBalances[networkKey] = null;
  }
  return bridgeNetworkBalances[networkKey];
}

async function refreshBridgeBalances() {
  // From balance = USDC on the selected source network.
  await fetchBridgeNetworkBalance(bridgeFromKey);
  renderBridgeBalances();
}

function renderBridgeBalances() {
  const fromNet = networkByKey(bridgeFromKey);
  const fromBal = bridgeNetworkBalances[bridgeFromKey];
  setText("bridgeFromBal", "Balance: " + formatBal(fromBal) + " USDC");
  setText("bridgeFromNet", fromNet.name);
  setText("bridgeFromNetUsdc", fromNet.name + " · USDC");
  // Refresh the destination balance separately (async, best-effort).
  updateBridgeToBalance();
}

async function updateBridgeToBalance() {
  const toKey = getBridgeToKey();
  const toNet = networkByKey(toKey);
  const el = document.getElementById("bridgeToBal");
  if (!el) return;
  if (!userAddress) { el.innerText = "Connect your wallet to see this balance"; return; }
  try {
    el.innerText = "Checking " + toNet.name + " balance…";
    const bal = await fetchBridgeNetworkBalance(toKey);
    el.innerText = "Balance on " + toNet.name + ": " + formatBal(bal) + " USDC";
  } catch (e) {
    console.error("bridge destination balance fetch failed", e);
    el.innerText = "Couldn't load " + toNet.name + " balance right now";
  }
}

// Populate each network's selector <select>. Called once on load.
function populateBridgeSelectors() {
  const fromSel = document.getElementById("bridgeFromChain");
  const toSel = document.getElementById("bridgeToChain");
  if (fromSel) {
    fromSel.innerHTML = Object.keys(CONFIG.networks)
      .map(k => `<option value="${k}">${CONFIG.networks[k].name}</option>`)
      .join("");
    fromSel.value = bridgeFromKey;
  }
  if (toSel) {
    buildBridgeToOptions();
  }
}

// Rebuild the To-options so only valid routes are offered from the current source.
function buildBridgeToOptions() {
  const toSel = document.getElementById("bridgeToChain");
  if (!toSel) return;
  const fromKey = getBridgeFromKey();
  const options = CONFIG.bridgeRoutes
    .filter(r => r.from === fromKey)
    .map(r => {
      const net = CONFIG.networks[r.to];
      return `<option value="${r.to}" data-valid="1">${net.name}</option>`;
    })
    .join("");
  toSel.innerHTML = options;
  // Select the first valid destination, or keep current if still valid.
  if (!CONFIG.bridgeRoutes.some(r => r.from === fromKey && r.to === toSel.value)) {
    toSel.value = toSel.options[0] ? toSel.options[0].value : "";
  }
  if (toSel.options.length === 0) {
    toSel.innerHTML = `<option value="">No valid destination</option>`;
  }
}

// Keep From and To selectors consistent so the route is always valid, and
// re-render the balances/network hints for the new route.
function syncBridgeSelectors() {
  buildBridgeToOptions();
  const fromNet = networkByKey(getBridgeFromKey());
  const toNet = networkByKey(getBridgeToKey());
  setText("bridgeFromNet", fromNet.name);
  setText("bridgeToNet", toNet.name);
  setText("bridgeFromNetUsdc", fromNet.name + " · USDC");
  document.getElementById("bridgeRouteLine") && (document.getElementById("bridgeRouteLine").innerText = fromNet.name + " → " + toNet.name);
  document.getElementById("bridgeToNetUsdc") && (document.getElementById("bridgeToNetUsdc").innerText = toNet.name + " · USDC");
  updateBridgeToBalance();
  fetchBridgeNetworkBalance(getBridgeFromKey()).then(renderBridgeBalances);
}

// Reverse button — swap From and To (both directions are always supported).
function reverseBridgeRoute() {
  const fromSel = document.getElementById("bridgeFromChain");
  const toSel = document.getElementById("bridgeToChain");
  if (!fromSel || !toSel) return;
  const newFrom = toSel.value;
  if (!newFrom) return;
  bridgeFromKey = newFrom;
  fromSel.value = newFrom;
  syncBridgeSelectors();
}

const bridgeFromChainSel = document.getElementById("bridgeFromChain");
if (bridgeFromChainSel) {
  bridgeFromChainSel.addEventListener("change", () => {
    bridgeFromKey = getBridgeFromKey();
    syncBridgeSelectors();
    bridgeFromChainSel.blur();
  });
}
const bridgeFlipBtn = document.getElementById("bridgeFlip");
if (bridgeFlipBtn) bridgeFlipBtn.addEventListener("click", reverseBridgeRoute);

populateBridgeSelectors();
syncBridgeSelectors();

/* -------------------------------------------------------------------------
   Bridge balances follow the selected route (see helpers below).
   ------------------------------------------------------------------------- */

function setText(id, txt) {
  const el = document.getElementById(id);
  if (el) el.innerText = txt;
}

/* -------------------------------------------------------------------------
   Percentage quick-fill buttons — uses the balance of whatever token is
   actually selected in that panel (was always USDC before, even on Send
   with EURC selected).
   ------------------------------------------------------------------------- */
document.querySelectorAll(".pct span").forEach(el => {
  el.addEventListener("click", () => {
    if (!userAddress) return;
    const panel = el.closest(".panel").id;
    let sym = "USDC";
    if (panel === "panel-send") sym = document.getElementById("sendToken")?.value || "USDC";
    const full = latestBalances[sym];
    if (full === null || full === undefined) return;
    const pct = Number(el.dataset.pct) / 100;
    const val = (full * pct).toFixed(6);
    if (panel === "panel-swap") {
      setValue("swapFromAmt", val);
      document.getElementById("swapFromAmt")?.dispatchEvent(new Event("input"));
    }
    if (panel === "panel-send") setValue("sendAmt", val);
  });
});

function setValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

/* -------------------------------------------------------------------------
   Swap flip
   ------------------------------------------------------------------------- */
const swapFlip = document.getElementById("swapFlip");
if (swapFlip) {
  swapFlip.addEventListener("click", () => {
    const a = document.getElementById("swapFromToken");
    const b = document.getElementById("swapToToken");
    const tmp = a.value; a.value = b.value; b.value = tmp;
    a.dispatchEvent(new Event("change"));
    b.dispatchEvent(new Event("change"));
  });
}

/* -------------------------------------------------------------------------
   Swap — real execution lives in the ES module script at the bottom of
   app.html (Circle App Kit SDK via esm.sh, needs `type="module"`). This
   file stays a classic script for browser compatibility with the rest
   of the app, and exposes the bits that module script needs below via
   window.ThorPay.
   ------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------
   Bridge (CCTP V2) — REAL cross-chain USDC bridging between Arc Testnet and
   Arbitrum Sepolia / Base Sepolia / Ethereum Sepolia, in BOTH directions.

   Protocol: Circle's official CCTP V2 contracts (burn-and-mint). The testnet
   TokenMessengerV2 / MessageTransmitterV2 are CREATE2-deployed at the SAME
   address on every supported testnet (verified from Circle's official CCTP
   contract-addresses + Arc's own docs), so one shared address works as both
   source and destination across all four chains.

   Flow (identical for every route, both directions):
     1. Validate wallet + switch to the SOURCE chain.
     2. Approve TokenMessengerV2 to spend USDC on the source chain.
     3. depositForBurn(...) on the source chain -> burns USDC, emits the
        CCTP message (Circle attests to it via Iris).
     4. Wait for the burn tx to confirm.
     5. Poll Circle Iris for the attestation (message + signature).
     6. Switch to the DESTINATION chain and receiveMessage(...) -> mints USDC.
     7. Done — show the destination tx + explorer links.

   Honest states: nothing is marked "completed" until receiveMessage() has a
   confirmed receipt on the destination chain.

   ETH: CCTP moves USDC ONLY — it does not bridge native ETH. ARC's native gas
   token IS USDC, and there is no official CCTP native-ETH bridge for these
   testnet routes, so native ETH bridging is intentionally NOT offered.
   ------------------------------------------------------------------------- */

// ETH is NOT bridged via CCTP — keep the token selector USDC-only and label
// it honestly in the UI (see bridgeTokenUsdcNote). No ETH option is offered.
const bridgeFromTokenSel = document.getElementById("bridgeFromToken");
if (bridgeFromTokenSel) bridgeFromTokenSel.value = "USDC";

// TO-amount preview: CCTP "Standard Transfer" runs with maxFee=0, so the
// minted amount equals the burned amount (before any min-fee). Mirror it
// live as the person types so the disabled TO field never looks stale.
const bridgeFromAmtEl = document.getElementById("bridgeFromAmt");
const bridgeToAmtEl = document.getElementById("bridgeToAmt");
if (bridgeFromAmtEl && bridgeToAmtEl) {
  bridgeFromAmtEl.addEventListener("input", () => {
    const v = bridgeFromAmtEl.value;
    bridgeToAmtEl.value = (v && Number(v) > 0) ? v : "";
  });
}

// Max button — fill From-amount with the full USDC balance on the source chain.
function bridgeMax() {
  if (!userAddress) return;
  const bal = bridgeNetworkBalances[getBridgeFromKey()];
  if (bal === null || bal === undefined) return;
  const amtEl = document.getElementById("bridgeFromAmt");
  if (!amtEl) return;
  amtEl.value = bal > 0 ? bal.toFixed(6) : "0";
  amtEl.dispatchEvent(new Event("input"));
}
const bridgeMaxBtn = document.getElementById("bridgeMax");
if (bridgeMaxBtn) bridgeMaxBtn.addEventListener("click", bridgeMax);

/* -- Wallet/network validation + switching for the bridge ----------------- */

function userRejected(error) {
  const code = error && (error.code || (error.error && error.error.code));
  return code === 4001 || code === -32002 && false || (typeof error === "string" && /user rejected|user denied/i.test(error))
    || (error && /user rejected|user denied/i.test(String(error.message || "")));
}

function setBridgeStatus(cls, text) {
  const el = document.getElementById("bridgeStatus");
  if (!el) return;
  el.className = "status" + (cls ? " " + cls : "");
  el.innerText = text;
}
function setBridgeProgress(text) {
  const el = document.getElementById("bridgeProgress");
  if (!el) return;
  el.style.display = text ? "block" : "none";
  if (text) el.innerText = text;
}

// Ensure the wallet is connected and on the given SOURCE network. Returns true
// if ready to proceed. If it's on the wrong chain, offers a switch and waits.
async function ensureBridgeSourceNetwork(network) {
  if (!signer) {
    setBridgeStatus("", "Connecting wallet…");
    await connectWallet();
    if (!signer) { setBridgeStatus("err", "Connect your wallet first."); return false; }
  }
  const onNet = await isWalletOnNetwork(network);
  if (onNet) return true;

  setBridgeStatus("err", "Wrong network — switch your wallet to " + network.name + " to bridge from it.");
  try {
    await switchOrAddChain(network);
    // Reconnect the signer to the newly selected chain before proceeding.
    provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    signer = provider.getSigner();
    await checkNetwork();
    return true;
  } catch (switchErr) {
    if (userRejected(switchErr)) {
      setBridgeStatus("err", "Network switch rejected. Bridge cancelled — switch to " + network.name + " and try again.");
    } else {
      setBridgeStatus("err", "Couldn't switch to " + network.name + ": " + (switchErr.message || String(switchErr)));
    }
    return false;
  }
}

// Try to estimate the native gas needed for two txns (approve+burn on the
// source chain) and warn the user early if it looks short. Read-only best effort.
async function checkBridgeNativeGas(network) {
  try {
    const amtUnits = 130000 + 250000; // ~approve + depositForBurn
    const price = await provider.getGasPrice();
    const needed = price.mul(amtUnits);
    const raw = await provider.getBalance(userAddress);
    if (raw.lt(needed)) {
      const sym = network.nativeCurrency.symbol;
      return "Low " + sym + " balance for gas — you may need " + sym + " to pay the bridge fees. " +
        (network.nativeGasIsUsdc ? "On Arc, gas IS USDC (already held as USDC)." : "Fund it from a faucet.");
    }
  } catch (e) { /* best-effort gas estimate; don't block the bridge */ }
  return "";
}

async function pollAttestation(sourceDomain, txHash, attempts = 16, delayMs = 8000) {
  for (let i = 0; i < attempts; i++) {
    try {
      const url = `${CONFIG.IRIS_API}/v2/messages/${sourceDomain}?transactionHash=${txHash}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const msg = data && data.messages && data.messages[0];
        if (msg && msg.attestation && msg.attestation !== "PENDING") {
          return msg;
        }
      }
    } catch (e) {
      console.warn("attestation poll failed", e);
    }
    await new Promise(r => setTimeout(r, delayMs));
  }
  return null;
}

/* -- Bridge execution ----------------------------------------------------- */

const bridgeBtn = document.getElementById("bridgeBtn");
if (bridgeBtn) {
  bridgeBtn.addEventListener("click", async () => {
    const fromSel = document.getElementById("bridgeFromChain");
    const toSel = document.getElementById("bridgeToChain");
    const fromKey = getBridgeFromKey();
    const toKey = getBridgeToKey();
    const fromNetwork = networkByKey(fromKey);
    const toNetwork = networkByKey(toKey);

    try {
      setBridgeProgress("");
      document.getElementById("bridgeMintBtn").style.display = "none";
      document.getElementById("bridgeRetryBtn").style.display = "none";
      pendingMint = null;
      pendingBurn = null;

      if (!isBridgeRoute(fromKey, toKey)) {
        setBridgeStatus("err", "Unsupported route — pick a valid source/destination pair.");
        return;
      }

      const amt = document.getElementById("bridgeFromAmt").value;
      if (!amt || Number(amt) <= 0) { setBridgeStatus("err", "Enter an amount."); return; }

      // Ensure wallet is connected + on the source chain before anything else.
      if (!(await ensureBridgeSourceNetwork(fromNetwork))) return;

      // Balance check against the SOURCE chain's USDC.
      const fromBalance = await fetchBridgeNetworkBalance(fromKey);
      if (fromBalance !== null && Number(amt) > fromBalance) {
        setBridgeStatus("err", "Insufficient USDC — you have " + formatBal(fromBalance) + " USDC on " + fromNetwork.name + ".");
        return;
      }

      const gasNote = await checkBridgeNativeGas(fromNetwork);
      if (gasNote) setBridgeProgress(gasNote);

      bridgeBtn.disabled = true;
      const usdcAddr = fromNetwork.usdc;
      const messengerAddr = fromNetwork.tokenMessenger;
      const destinationDomain = toNetwork.domain;

      const usdc = new ethers.Contract(usdcAddr, ERC20_ABI, signer);
      const decimals = await usdc.decimals();
      const amountUnits = ethers.utils.parseUnits(amt, decimals);

      // 1) Approval (do it every time — CCTP collapses the amount, and it's
      //    cheap on testnet; handling rejects cleanly is the point).
      setBridgeStatus("", "Step 1/4 — approving USDC on " + fromNetwork.name + "…");
      setBridgeProgress("Approving TokenMessengerV2 to spend USDC…");
      const approveTx = await usdc.approve(messengerAddr, amountUnits);
      setBridgeStatus("ok", "Approval request sent — waiting for confirmation…");
      await approveTx.wait();
      setBridgeProgress("Approval confirmed.");

      // 2) Burn on the source chain.
      setBridgeStatus("", "Step 2/4 — burning USDC on " + fromNetwork.name + "…");
      setBridgeProgress("Submitting depositForBurn…");
      const messenger = new ethers.Contract(messengerAddr, TOKEN_MESSENGER_V2_ABI, signer);
      const mintRecipient = ethers.utils.hexZeroPad(userAddress, 32);
      const destinationCaller = ethers.utils.hexZeroPad("0x0000000000000000000000000000000000000000", 32);
      const maxFee = 0; // Standard Transfer (no upfront fee)
      const minFinalityThreshold = fromNetwork.minFinalityThreshold || 1000;

      const burnTx = await messenger.depositForBurn(
        amountUnits, destinationDomain, mintRecipient, usdcAddr,
        destinationCaller, maxFee, minFinalityThreshold
      );
      setBridgeStatus("", "Step 3/4 — waiting for burn confirmation on " + fromNetwork.name + "…");
      const burnReceipt = await burnTx.wait();
      const burnTxHash = burnReceipt.transactionHash;
      setBridgeProgress("Burned. Tx: " + burnTxHash + "\nWaiting for Circle's attestation (Iris)…");

      // 3) Attestation — poll Iris using the SOURCE chain's domain.
      setBridgeStatus("", "Step 4/4 — waiting for Circle's attestation (can take a minute or two)…");
      const attestation = await pollAttestation(fromNetwork.domain, burnTxHash);

      addHistory("BRIDGE", amt + " USDC → " + toNetwork.name, burnTxHash);

      if (attestation && attestation.message && attestation.attestation) {
        pendingMint = {
          message: attestation.message,
          attestation: attestation.attestation,
          fromNetwork,
          toNetwork,
          amount: amt
        };
        setBridgeStatus("ok", "Burn confirmed + attested! Click “Complete mint on destination chain” below to finish.");
        setBridgeProgress(
          "Burn tx: " + burnTxHash + "\nAttestation ready. Your USDC isn't on " + toNetwork.name +
          " yet — click below to mint (MetaMask will switch to " + toNetwork.name + ")."
        );
        document.getElementById("bridgeMintBtn").style.display = "block";
        document.getElementById("bridgeRetryBtn").style.display = "none";
        pendingBurn = null;
      } else {
        pendingBurn = { txHash: burnTxHash, fromNetwork, toNetwork, amount: amt };
        setBridgeStatus("err", "Burned on " + fromNetwork.name + " — attestation isn't ready yet. Nothing is lost. Click “Check attestation again” in a minute.");
        setBridgeProgress(
          "Burn tx: " + burnTxHash + "\nCircle's testnet attestation can take a few minutes — use the button to check again, no need to re-burn."
        );
        document.getElementById("bridgeRetryBtn").style.display = "block";
      }

      await fetchBridgeNetworkBalance(fromKey);
      renderBridgeBalances();
    } catch (err) {
      console.error(err);
      if (userRejected(err)) {
        setBridgeStatus("err", "Transaction rejected in wallet. No USDC moved — you can try again.");
      } else {
        setBridgeStatus("err", "Bridge failed: " + (err.message || String(err)));
      }
    } finally {
      bridgeBtn.disabled = false;
    }
  });
}

const bridgeRetryBtn = document.getElementById("bridgeRetryBtn");
if (bridgeRetryBtn) {
  bridgeRetryBtn.addEventListener("click", async () => {
    if (!pendingBurn) return;
    bridgeRetryBtn.disabled = true;
    setBridgeStatus("", "Checking attestation again…");
    try {
      const attestation = await pollAttestation(pendingBurn.fromNetwork ? pendingBurn.fromNetwork.domain : CONFIG.networks.arc.domain, pendingBurn.txHash, 3, 5000);
      if (attestation && attestation.message && attestation.attestation) {
        pendingMint = {
          message: attestation.message,
          attestation: attestation.attestation,
          fromNetwork: pendingBurn.fromNetwork,
          toNetwork: pendingBurn.toNetwork,
          amount: pendingBurn.amount
        };
        setBridgeStatus("ok", "Attestation ready! Click below to finish minting on " + pendingBurn.toNetwork.name + ".");
        document.getElementById("bridgeMintBtn").style.display = "block";
        bridgeRetryBtn.style.display = "none";
        pendingBurn = null;
      } else {
        setBridgeStatus("err", "Still not ready — Circle's testnet attestation can take a few minutes. Try again shortly.");
      }
    } catch (err) {
      console.error(err);
      setBridgeStatus("err", "Check failed: " + (err.message || String(err)));
    } finally {
      bridgeRetryBtn.disabled = false;
    }
  });
}

const bridgeMintBtn = document.getElementById("bridgeMintBtn");
if (bridgeMintBtn) {
  bridgeMintBtn.addEventListener("click", async () => {
    if (!pendingMint) return;
    const dest = pendingMint.toNetwork;
    bridgeMintBtn.disabled = true;
    try {
      setBridgeStatus("", "Switching wallet to " + dest.name + "…");
      await switchOrAddChain(dest);
      const destProvider = new ethers.providers.Web3Provider(window.ethereum, "any");
      const destSigner = destProvider.getSigner();
      const transmitter = new ethers.Contract(dest.messageTransmitter, MESSAGE_TRANSMITTER_V2_ABI, destSigner);

      setBridgeStatus("", "Minting " + pendingMint.amount + " USDC on " + dest.name + "…");
      const tx = await transmitter.receiveMessage(pendingMint.message, pendingMint.attestation);
      const receipt = await tx.wait();

      setBridgeStatus("ok", "Minted on " + dest.name + "! Tx: " + receipt.transactionHash);
      setBridgeProgress("Mint confirmed: " + receipt.transactionHash);
      addHistory("BRIDGE-MINT", "Minted " + pendingMint.amount + " USDC on " + dest.name, receipt.transactionHash);

      // Refresh the destination balance now that USDC arrived there.
      updateBridgeToBalance();

      // Switch back to Arc so the rest of the app (swap/send/balances) keeps
      // working in its default network.
      await ensureArcNetwork();
      provider = new ethers.providers.Web3Provider(window.ethereum, "any");
      signer = provider.getSigner();
      await checkNetwork();
      await refreshBalances();

      pendingMint = null;
      bridgeMintBtn.style.display = "none";
      document.getElementById("bridgeRetryBtn").style.display = "none";
    } catch (err) {
      console.error(err);
      if (userRejected(err)) {
        setBridgeStatus("err", "Mint rejected in wallet. Your USDC was burned and attested — you can retry the mint from the History note or by starting a new bridge with the same burn tx hash.");
      } else {
        setBridgeStatus("err", "Mint failed: " + (err.message || String(err)));
      }
    } finally {
      bridgeMintBtn.disabled = false;
    }
  });
}
/* -------------------------------------------------------------------------
   Send — real ERC-20 transfer (USDC or EURC) through the ERC-20 interface.
   ------------------------------------------------------------------------- */
const sendBtn = document.getElementById("sendBtn");
const sendTokenSel = document.getElementById("sendToken");
if (sendTokenSel) sendTokenSel.addEventListener("change", () => {
  setText("sendBal", "Balance: " + formatBal(latestBalances[sendTokenSel.value]));
});

if (sendBtn) {
  sendBtn.addEventListener("click", async () => {
    const statusEl = document.getElementById("sendStatus");
    if (!signer) {
      try {
        statusEl.className = "status"; statusEl.innerText = "Connecting wallet\u2026";
        await connectWallet();
      } catch (err) {
        statusEl.className = "status err"; statusEl.innerText = "Wallet connection failed: " + (err.message || err);
        return;
      }
      if (!signer) { statusEl.className = "status err"; statusEl.innerText = "Connect your wallet first."; return; }
    }

    const to = document.getElementById("sendTo").value.trim();
    const amt = document.getElementById("sendAmt").value;
    const tokenSymbol = document.getElementById("sendToken").value;

    if (!ethers.utils.isAddress(to)) { statusEl.className = "status err"; statusEl.innerText = "Enter a valid address."; return; }
    if (!amt || Number(amt) <= 0) { statusEl.className = "status err"; statusEl.innerText = "Enter an amount."; return; }

    const available = latestBalances[tokenSymbol];
    if (available !== null && Number(amt) > available) {
      statusEl.className = "status err";
      statusEl.innerText = "Insufficient balance. You have " + formatBal(available) + " " + tokenSymbol + " available.";
      return;
    }

    const tokenAddress = tokenSymbol === "USDC" ? CONFIG.USDC_ERC20 : CONFIG.EURC_ERC20;

    try {
      statusEl.className = "status"; statusEl.innerText = "Waiting for MetaMask confirmation...";
      const c = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
      const decimals = await c.decimals();
      const tx = await c.transfer(to, ethers.utils.parseUnits(amt, decimals));
      await tx.wait();

      statusEl.className = "status ok"; statusEl.innerText = "Sent! Tx: " + tx.hash;
      addHistory("SEND", amt + " " + tokenSymbol + " → " + to.slice(0, 6) + "..." + to.slice(-4), tx.hash);
      await refreshBalances();
    } catch (err) {
      console.error(err);
      statusEl.className = "status err"; statusEl.innerText = "Error: " + (err.message || err);
    }
  });
}

/* -------------------------------------------------------------------------
   History — persisted per-wallet-address in localStorage, so it survives
   disconnect → reconnect (and page reloads), not just the current session.
   ------------------------------------------------------------------------- */
function historyKey(addr) { return "thorpay_history_" + addr.toLowerCase(); }

function loadHistory() {
  if (!userAddress) { history = []; renderHistory(); return; }
  try {
    const raw = localStorage.getItem(historyKey(userAddress));
    history = raw ? JSON.parse(raw) : [];
  } catch (e) {
    history = [];
  }
  renderHistory();
}

function addHistory(type, desc, txHash) {
  history.unshift({ type, desc, txHash, time: new Date().toLocaleString() });
  history = history.slice(0, 50);
  if (userAddress) {
    try { localStorage.setItem(historyKey(userAddress), JSON.stringify(history)); } catch (e) { console.warn("history save failed", e); }
  }
  renderHistory();
}

function renderHistory() {
  const el = document.getElementById("historyList");
  if (!el) return;
  if (!userAddress) {
    el.innerHTML = '<div class="status">Connect your wallet to see your history.</div>';
    return;
  }
  if (history.length === 0) {
    el.innerHTML = '<div class="status">No transactions yet for this wallet.</div>';
    return;
  }
  el.innerHTML = history.map(h => `
    <div class="hist-item">
      <div class="htype ${h.type}">${h.type}</div>
      <div class="hamt">${h.desc}</div>
      <div style="color:var(--muted);font-size:11px;margin-top:4px;">${h.time}</div>
      <a href="${CONFIG.blockExplorerUrls[0]}/tx/${h.txHash}" target="_blank">View on explorer</a>
    </div>
  `).join("");
}

/* -------------------------------------------------------------------------
   React to account/network changes — updates state in place instead of
   reloading the page, so an in-flight balance fetch never gets cut off.
   ------------------------------------------------------------------------- */
if (window.ethereum) {
  window.ethereum.on("accountsChanged", async (accounts) => {
    if (!accounts || accounts.length === 0) {
      disconnectWallet();
      return;
    }
    provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    signer = provider.getSigner();
    userAddress = accounts[0];
    if (connectBtn) connectBtn.innerText = userAddress.slice(0, 6) + "..." + userAddress.slice(-4);
    loadHistory();
    await checkNetwork();
    await refreshBalances();
    await refreshBridgeBalances();
  });

  window.ethereum.on("chainChanged", async () => {
    if (!userAddress) return; // not connected yet — nothing to update
    provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    signer = provider.getSigner();
    const correct = await checkNetwork();
    if (correct) await refreshBalances();
    await refreshBridgeBalances();
  });
}

/* -------------------------------------------------------------------------
   Auto-reconnect on load — if MetaMask is already authorized for this site
   and the user hasn't explicitly disconnected, silently restore the
   connection and load balances without a second click. eth_accounts
   (unlike eth_requestAccounts) never prompts, so this is safe to call on
   every page load.
   ------------------------------------------------------------------------- */
(async function autoReconnect() {
  if (!window.ethereum || !connectBtn) return;
  if (localStorage.getItem("thorpay_disconnected") === "1") return;
  try {
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    if (accounts && accounts.length > 0) {
      await connectWallet();
    }
  } catch (e) {
    console.warn("auto-reconnect skipped", e);
  }
})();

/* -------------------------------------------------------------------------
   Expose wallet state + shared helpers for the App Kit swap module script
   in app.html (that script is type="module" and can't reliably see this
   classic script's top-level let/const bindings, so it reads window.ThorPay
   instead).
   ------------------------------------------------------------------------- */
window.ThorPay = {
  getUserAddress: () => userAddress,
  getSigner: () => signer,
  connectWallet,
  getBalance: (symbol) => latestBalances[symbol] ?? null,
  formatBal,
  refreshBalances,
  addHistory,
  getGasPrice: async () => {
    const hex = await window.ethereum.request({ method: "eth_gasPrice" });
    return ethers.BigNumber.from(hex);
  },
  nativeDecimals: CONFIG.nativeCurrency.decimals,
  explorerTxUrl: (txHash) => CONFIG.blockExplorerUrls[0] + "/tx/" + txHash
};
