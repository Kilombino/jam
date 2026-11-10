<p align="center"><img src="docs/assets/jam-xbt-logo.jpg" alt="JoinBlaket + Jam" width="260"></p>

<h1 align="center">JoinBlaket + Jam</h1>

<p align="center"><strong>CoinJoin on Bitcoin (BLAKE2b)</strong> · Jam <code>v2.0.0-beta.4-xbt3</code> · JoinBlaket <code>0.43.0-xbt1</code></p>

**JoinBlaket** is JoinMarket adapted to the Bitcoin (BLAKE2b) chain: the fork [Kilombino/joinblaket](https://github.com/Kilombino/joinblaket) (branch `xbt`), a small, auditable patch on top of JoinMarket-NG. **Jam** (this repo) is its web wallet. Together they let you CoinJoin: mix your coins with other people's to gain privacy. It only works on BLAKE2b and refuses to start against a node on the SHA-256 chain (Spamchain).

The code and the Docker image are still called `joinmarket-ng` and `jam-xbt`.

Full step-by-step guide (Spanish): **[kilombino.com/jam](https://kilombino.com/jam/)**

### What changes compared to JoinMarket

| What | In this fork | Why |
|---|---|---|
| Network on the wire | announces and requires `"xbt"`; rejects `"mainnet"` directories and peers | otherwise a BLAKE2b wallet would join the SHA-256 market (and vice versa) |
| Signatures | every signature uses the unified sighash `0x21`, and only `0x21` is accepted from others | a `0x21` signature is only valid on BLAKE2b, so your transactions can't be replayed on the SHA-256 chain |
| Node check | requires `difficulty_blake2b` and v2 headers before the first call | pointed at a SHA-256 node, it doesn't start (fails closed) |
| Directory | one BLAKE2b meeting point (below); none built into the code | the built-in ones belong to the SHA-256 market |
| Fees | only your node's `estimatesmartfee` | external sources look at the SHA-256 mempool and leak data |
| Makers | takers only mix with makers that hold a **fidelity bond**, at least 4 | a sybil attack costs more in a young market |
| Backend | `descriptor_wallet` only (no Neutrino) | Neutrino can't tell which chain it is on |

The directory is `f3tfzgk5ilwfapx427yx5ckeh7ptuvskfxnfnicfo747jyq5mgzdtvad.onion:5222`, with verified nick authentication (`require_verified`) so nobody can impersonate a maker. It comes preconfigured in StartOS, Umbrel and Docker. Addresses are still `bc1…` and paths `m/84'/0'/…`. Technical detail: [XBT.md](https://github.com/Kilombino/joinblaket/blob/xbt/XBT.md).

What this Jam adds on top of upstream Jam `v2.0.0-beta.4` (7 commits): the "Bitcoin BLAKE2b" label, transaction links to [mempool.kilombino.com](https://mempool.kilombino.com), Spanish translation, a warning in Earn that offers without a fidelity bond are never taken, the app icon, and **View in Kilowallet** (read-only QR export of the wallet).

### Install

You need a synced **Bitcoin Knots BLAKE2b** node (29.4.3 or later).

- **StartOS:** add the registry `https://registry.kilombino.com` and install *JoinBlaket*.
- **Umbrel** (umbrelOS 1.3+): add the community stores `https://github.com/paulscode/umbrel-store` (node) and `https://github.com/Kilombino/umbrel-store` (Jam).
- **Docker:** `ghcr.io/kilombino/jam-xbt:0.43.0-xbt1`, index digest `sha256:4b08cd111b37c2181d193ef8a2e6ec764da059a81b81fb40ab247e942bd760ef`. Guide: [TUTORIAL-LINUX-ES.md](https://github.com/Kilombino/joinblaket/blob/xbt/TUTORIAL-LINUX-ES.md).
- **Native, Minibolt style** (venv + hardened systemd + Jam built by you): in testing, see [kilombino.com/jam](https://kilombino.com/jam/).

JoinBlaket `0.43.0-xbt1` is based on upstream JoinMarket-NG 0.43.0 (denial-of-service and wallet daemon fixes). Use **small amounts** while the market is young.

### Verify what you run

| | |
|---|---|
| JoinBlaket tag | `v0.43.0-xbt1` → `9861e61e5baf99279040fbb31505144faffc222e` |
| Jam tag | `v2.0.0-beta.4-xbt3` → `a843bb1ed57b3bf4bf94c4ebdfb4d3c08577c978` |
| Jam build | Node `v26.7.0`, `npm ci --ignore-scripts && npm run build`, then `tar --sort=name --mtime='@0' --owner=0 --group=0 --numeric-owner --mode=go-w -C dist -cf - . \| sha256sum` → `21bb92c2c897d7d658519da065af4d59280214c51575b77b803cb5c6ebf4f345` |

The Docker image is reproducible: building it from these two tags (`xbt-docker/build.sh` in JoinBlaket) gives the published image bit for bit. Every signature in a JoinBlaket transaction ends in `21`; check it on mempool.kilombino.com or with `scripts/xbt/verify_coinjoin_tx.py`.

### Security, in short

- Always a Knots BLAKE2b node: the fork refuses to start with anything else.
- Use a **new seed** created in Jam. Never import a wallet you used on the SHA-256 chain.
- Keep Jam on `127.0.0.1`. Don't open port 28183 to the Internet or use `--network host`.
- Fidelity bonds lock your coins until the date you pick; they are created from the Jam wallet and signed with `0x21`. Bonds from hardware or cold wallets aren't supported yet.
- Problems: [Kilombino/joinblaket issues](https://github.com/Kilombino/joinblaket/issues).

---

<div align="center">
  <img src="docs/assets/readme-header-light.svg#gh-light-mode-only" alt="Jam: Your sats. Your privacy. Your profit.">
  <img src="docs/assets/readme-header-dark.svg#gh-dark-mode-only" alt="Jam: Your sats. Your privacy. Your profit.">
</div>

<p align="center">
  <strong>⚠️ Jam is beta software. Use with caution. ⚠️</strong>
</p>

<h3 align="center">
  <a href="#-installation">Installation</a>
  <span> · </span>
  <a href="#-features">Features</a>
  <span> · </span>
  <a href="#-contribute">Contribute</a>
  <span> · </span>
  <a href="#%EF%B8%8F-development">Development</a>
</h3>

---

Jam is a web interface for [JoinMarket NG](https://github.com/joinmarket-ng/joinmarket-ng) focusing on user-friendliness and ease-of-use.
It aims to provide sensible defaults and be easy to use for beginners while still having the features advanced users expect.

- 💬 Join our [Matrix room](https://matrix.to/#/%23jam:bitcoin.kyoto) to get help and [contribute](https://joinmarket-webui.github.io/jamdocs/contribute/)!
- 📚 Check out the [documentation](https://joinmarket-webui.github.io/jamdocs/) and the [wiki](https://github.com/joinmarket-webui/jam/wiki) for resources such as meeting notes, call recordings, ideas, and discussions.

## 📸

<div align="center">
  <img src="docs/assets/screenshot-light.png#gh-light-mode-only" width="80%" alt="Jam Screenshot">
  <img src="docs/assets/screenshot-dark.png#gh-dark-mode-only" width="80%" alt="Jam Screenshot">
</div>

## 📦 Installation

We're aiming to make Jam available for different node systems to make installation as painless as possible.
If your node system of choice is missing, feel free to integrate it and let us know so we can add it here.

<table>
<thead>
<tr>
<th style="text-align:center"><img src="docs/assets/raspiblitz-dark.svg#gh-light-mode-only" height="50px" alt="RaspiBlitz Logo" /><img src="docs/assets/raspiblitz-light.svg#gh-dark-mode-only" width="45px" alt="RaspiBlitz Logo" /></th>
<th style="text-align:center"><img src="docs/assets/umbrel.svg" width="45px" alt="Umbrel Logo" /></th>
<th style="text-align:center"><img src="docs/assets/citadel.png" width="45px" alt="Citadel Logo" /></th>
<th style="text-align:center"><img src="docs/assets/mynode.png" width="45px" alt="MyNode Logo" /></th>
<th style="text-align:center"><img src="docs/assets/start9.png" width="45px" alt="Start9 Logo" /></th>
<th style="text-align:center"><img src="docs/assets/raspibolt.png" width="45px" alt="RaspiBolt Logo" /></th>
</tr>
</thead>
<tbody>
<tr>
<td style="text-align:center"><a href="https://github.com/rootzoll/raspiblitz">RaspiBlitz</a>: v1.7.2*</td>
<td style="text-align:center"><a href="https://getumbrel.com">Umbrel</a>: v0.4.15</td>
<td style="text-align:center"><a href="https://runcitadel.space">Citadel</a>: v0.0.1</td>
<td style="text-align:center"><a href="https://mynodebtc.com">MyNode</a>: v0.3.05</td>
<td style="text-align:center"><a href="https://start9.com">Start9</a>: v0.3.3</td>
<td style="text-align:center"><a href="https://raspibolt.org">RaspiBolt</a>: v3</td>
</tr>
</tbody>
</table>

Refer to [the installation docs](https://joinmarket-webui.github.io/jamdocs/software/installation/) for more information on integrations as well as manual installation instructions.

## 🍊 Features

- [x] Spending from the wallet
- [x] Spending from the wallet via collaborative transactions
- [x] Running the yield generator
- [x] Scheduled transactions
- [x] Viewing the orderbook
- [x] Support for fidelity bonds
- [ ] PayJoin support

Refer to the [milestones](https://github.com/joinmarket-webui/jam/milestones) for a rough roadmap. Feature requests are [tracked as issues](https://github.com/joinmarket-webui/jam/issues).

## 🧑‍💻 Contribute

This is a [free and open-source](https://joinmarket-webui.github.io/jamdocs/philosophy/01-free-software/) software project and we love receiving pull-requests, bug reports, ideas, and feedback from everyone.

There are many ways you can contribute: testing, sharing ideas, writing documentation, creating tutorials, and—of course—writing code. Refer to the [general contribution guidelines](https://joinmarket-webui.github.io/jamdocs/contribute/) to get started.

## 🛠️ Development

Want to get your hands dirty with code? Great! [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/developing.md](docs/developing.md) are where it's at.

## 🏛️ History

This project builds upon the [jm-web-client](https://github.com/JoinMarket-Org/jm-web-client) which was developed by [Shobhitaa](https://github.com/shobhitaa), [Abhishek](https://github.com/abhishek0405), and [waxwing](https://github.com/AdamISZ) himself. Many people contributed over time, some of which are [listed here](https://github.com/joinmarket-webui/jam/graphs/contributors).

Jam and JoinMarket NG are separate projects. For more information on JoinMarket NG, see the [JoinMarket NG GitHub Page](https://github.com/joinmarket-ng/joinmarket-ng).
