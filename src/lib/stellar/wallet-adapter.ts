import * as freighterApi from '@stellar/freighter-api';

export type WalletType = 'freighter' | 'lobstr';

export interface StellarWallet {
  readonly type: WalletType;
  readonly publicKey: string;
  readonly isConnected: boolean;

}

// Mainnet passphrase — never changes.
const MAINNET_PASSPHRASE = "Public Global Stellar Network ; September 2015";

/**
 * Normalises a FreighterApiError or plain Error into a user-friendly message,
 * without leaking internal stack traces or API internals.
 */
function friendlyError(raw: unknown, fallback: string): Error {
  if (!raw) return new Error(fallback);
  if (typeof raw === "object" && "message" in raw) {
    const msg = (raw as { message: string }).message ?? "";
    // Map known Freighter error messages to user-friendly copy.
    if (/user declined/i.test(msg) || /rejected/i.test(msg))
      return new Error("Connection request was declined. Please approve it in Freighter and try again.");
    if (/not connected/i.test(msg) || /not installed/i.test(msg))
      return new Error("Freighter extension is not installed. Visit https://freighter.app to install it.");
    if (/timeout/i.test(msg))
      return new Error("Freighter did not respond in time. Please try again.");
    if (msg) return new Error(msg);
  }
  return new Error(fallback);

}

const MAINNET_PASSPHRASE = "Public Global Stellar Network ; September 2015";

// ── Error helpers ──────────────────────────────────────────────────────────────

/**
 * Normalises any thrown value or API error object into a user-friendly Error
 * without leaking internal stack traces or raw API messages.
 */
function friendlyError(raw: unknown, fallback: string): Error {
  if (!raw) return new Error(fallback);
  if (typeof raw === "object" && "message" in raw) {
    const msg = String((raw as { message: unknown }).message ?? "");
    if (/user declined|rejected|denied/i.test(msg))
      return new Error(
        "Connection request was declined. Please approve it in your wallet and try again."
      );
    if (/not connected|not installed/i.test(msg))
      return new Error(
        "Wallet extension is not installed or unavailable. Please install it and try again."
      );
    if (/timeout/i.test(msg))
      return new Error("The wallet did not respond in time. Please try again.");
    if (msg) return new Error(msg);
  }
  return new Error(fallback);
}

// ── Lobstr provider interface ──────────────────────────────────────────────────

/**
 * Minimal interface that both window.lobstr and window.stellar (when isLobstr)
 * must satisfy. Validated before any call is made.
 */
interface LobstrProvider {
  connect(): Promise<{ publicKey: string }>;
  signTransaction(
    xdr: string,
    opts: { networkPassphrase: string }
  ): Promise<{ signedXdr: string }>;
}

/**
 * Resolves the Lobstr provider from the window object and validates that it
 * exposes the required interface. Returns null if unavailable or malformed.
 */
function resolveLobstrProvider(): LobstrProvider | null {
  if (typeof window === "undefined") return null;
  const w = window as any;

  const candidate: unknown = w.lobstr ?? (w.stellar?.isLobstr ? w.stellar : null);
  if (!candidate || typeof candidate !== "object") return null;

  // Validate the provider exposes the methods we need before calling them.
  if (
    typeof (candidate as any).connect !== "function" ||
    typeof (candidate as any).signTransaction !== "function"
  ) {
    return null;
  }

  return candidate as LobstrProvider;
}

// ── Adapter ────────────────────────────────────────────────────────────────────

export class StellarWalletAdapter {
  private _walletType: WalletType | null = null;
  private _publicKey: string | null = null;


  // Serialises concurrent connectFreighter() / connectLobstr() calls.
  private _connectingPromise: Promise<StellarWallet> | null = null;

  // ── Availability ─────────────────────────────────────────────────────────────

  // Serialises concurrent connectFreighter() calls so only one permission
  // prompt is ever in-flight at a time.
  private _connectingPromise: Promise<StellarWallet> | null = null;


  // ── Availability checks ────────────────────────────────────────────────────

  /**
   * Returns true when the Freighter browser extension is present.
   * Checks both the API response and the window.freighter sentinel that
   * Freighter injects before the async bridge is ready.
   */
  async isFreighterAvailable(): Promise<boolean> {
    try {
      if (typeof window !== "undefined" && (window as any).freighter) return true;
      const result = await freighterApi.isConnected();

      return !result.error && result.isConnected !== undefined;

      return result.isConnected || (typeof window !== 'undefined' && !!(window as any).freighter);

    } catch {
      return false;
    }
  }

  /**
   * Returns true when a valid Lobstr provider is present on the window object.
   * Checks both window.lobstr and window.stellar?.isLobstr, and validates the
   * provider interface before returning true.
   */
  isLobstrAvailable(): boolean {

    return resolveLobstrProvider() !== null;

    return (

      typeof window !== "undefined" &&

      typeof window !== 'undefined' &&

      (!!(window as any).lobstr || !!(window as any).stellar?.isLobstr)
    );

  }


  // ── Freighter connection ──────────────────────────────────────────────────────

  async connectFreighter(): Promise<StellarWallet> {
    if (this._walletType === "freighter" && this._publicKey) {
      return { type: "freighter", publicKey: this._publicKey, isConnected: true };
    }

    if (this._connectingPromise) return this._connectingPromise;

    this._connectingPromise = this._doConnectFreighter().finally(() => {
      this._connectingPromise = null;
    });

  // ── Freighter connection ───────────────────────────────────────────────────

  /**
   * Full deterministic Freighter connection flow:
   *
   * 1. Verify the extension is present.
   * 2. Call isConnected() — if the extension reports it is already connected
   *    to this origin, try getAddress() first (no permission prompt needed).
   * 3. If getAddress() returns an empty address (site not yet allowed), or if
   *    isConnected() returned false, call requestAccess() to prompt the user.
   * 4. After requestAccess(), retry getAddress() as the canonical source of
   *    truth for the active public key.
   * 5. Store walletType + publicKey immutably on the instance.
   *
   * Concurrent calls are collapsed into a single in-flight promise so the
   * user is never shown two permission dialogs simultaneously.
   */
  connectFreighter(): Promise<StellarWallet> {
    // Return the in-flight promise if one already exists (idempotent).
    if (this._connectingPromise) return this._connectingPromise;

    // If already connected, return immediately without any API calls.
    if (this._walletType === "freighter" && this._publicKey) {
      return Promise.resolve({
        type: "freighter",
        publicKey: this._publicKey,
        isConnected: true,
      });
    }

    this._connectingPromise = this._doConnectFreighter().finally(() => {
      this._connectingPromise = null;
    });


    return this._connectingPromise;
  }

  private async _doConnectFreighter(): Promise<StellarWallet> {

    // Step 1 — extension presence check.

    const available = await this.isFreighterAvailable();
    if (!available) {
      throw new Error(
        "Freighter extension is not installed. Visit https://freighter.app to install it."
      );
    }


    const connectedResult = await freighterApi.isConnected();
    if (connectedResult.error) {
      throw friendlyError(
        connectedResult.error,
        "Could not reach Freighter. Please try again."
      );
    }

    if (connectedResult.isConnected) {
      const addressResult = await freighterApi.getAddress();
      if (!addressResult.error && addressResult.address) {
        return this._store("freighter", addressResult.address);
      }
    }

    const accessResult = await freighterApi.requestAccess();
    if (accessResult.error) {
      throw friendlyError(
        accessResult.error,
        "Freighter access was denied. Please approve the connection request and try again."
      );
    }
    if (accessResult.address) {
      return this._store("freighter", accessResult.address);
    }

    const retryResult = await freighterApi.getAddress();
    if (retryResult.error) {
      throw friendlyError(
        retryResult.error,
        "Connected to Freighter but could not retrieve your public key. Please try again."
      );
    }
    if (!retryResult.address) {
      throw new Error(
        "Connected to Freighter but no public key was returned. " +
          "Ensure your wallet is unlocked and try again."
      );
    }
    return this._store("freighter", retryResult.address);
  }

  // ── Lobstr connection ─────────────────────────────────────────────────────────


  /**
   * Deterministic Lobstr connection flow:
   *
   * 1. Resolve and validate the provider (window.lobstr or window.stellar when
   *    isLobstr is truthy). Fail immediately if neither is present or if the
   *    provider does not expose the required interface.
   * 2. Return immediately (no provider call) if already connected on this instance.
   * 3. Collapse concurrent calls into a single in-flight promise so connect()
   *    is never called twice simultaneously.
   * 4. Call provider.connect() and validate the returned object contains a
   *    non-empty publicKey string.
   * 5. Store walletType + publicKey on the instance.
   */
  connectLobstr(): Promise<StellarWallet> {
    // Idempotent: already connected.
    if (this._walletType === "lobstr" && this._publicKey) {
      return Promise.resolve({
        type: "lobstr",
        publicKey: this._publicKey,
        isConnected: true,
      });
    }

    // Race-condition guard: collapse concurrent calls.
    if (this._connectingPromise) return this._connectingPromise;

    this._connectingPromise = this._doConnectLobstr().finally(() => {
      this._connectingPromise = null;
    });
    return this._connectingPromise;
  }

  private async _doConnectLobstr(): Promise<StellarWallet> {
    // Step 1 — resolve and validate provider.
    const provider = resolveLobstrProvider();
    if (!provider) {
      throw new Error(
        "Lobstr wallet is not installed or unavailable. " +
          "Visit https://lobstr.co to install it."
      );
    }

    // Step 2 — call connect() and handle all failure modes.
    let result: { publicKey: string };
    try {
      result = await provider.connect();
    } catch (err: unknown) {
      throw friendlyError(
        err,
        "Failed to connect to Lobstr. Please try again."
      );
    }

    // Step 3 — validate the response shape.
    if (!result || typeof result !== "object") {
      throw new Error(
        "Lobstr returned an unexpected response. Please try again."
      );
    }

    const publicKey = (result as any).publicKey;
    if (typeof publicKey !== "string" || publicKey.trim() === "") {
      throw new Error(
        "Lobstr did not return a valid public key. " +
          "Ensure your wallet is unlocked and try again."
      );
    }

    // Step 4 — store and return.
    return this._store("lobstr", publicKey.trim());

    // Step 2 — check whether this origin is already connected/allowed.
    const connectedResult = await freighterApi.isConnected();
    if (connectedResult.error) {
      throw friendlyError(connectedResult.error, "Could not reach Freighter. Please try again.");
    }

    const alreadyConnected = connectedResult.isConnected === true;

    // Step 3 — if already connected, attempt a silent address fetch first.
    if (alreadyConnected) {
      const addressResult = await freighterApi.getAddress();
      if (!addressResult.error && addressResult.address) {
        // Happy path: extension is connected and address is available.
        return this._store("freighter", addressResult.address);
      }
      // Address came back empty even though isConnected=true — fall through
      // to requestAccess() below (handles locked-wallet edge case).
    }

    // Step 4 — request permission / unlock prompt.
    const accessResult = await freighterApi.requestAccess();
    if (accessResult.error) {
      throw friendlyError(
        accessResult.error,
        "Freighter access was denied. Please approve the connection request and try again."
      );
    }

    // Step 5 — prefer the address returned by requestAccess directly.
    if (accessResult.address) {
      return this._store("freighter", accessResult.address);
    }


    // Step 6 — final fallback: re-fetch address after access was granted.
    const retryResult = await freighterApi.getAddress();
    if (retryResult.error) {
      throw friendlyError(
        retryResult.error,
        "Connected to Freighter but could not retrieve your public key. Please try again."
      );
    }
    if (!retryResult.address) {
      throw new Error(
        "Connected to Freighter but no public key was returned. " +
          "Ensure your wallet is unlocked and try again."
      );
    }

    return this._store("freighter", retryResult.address);


    if (!publicKey) {
      const access = await freighterApi.requestAccess();
      if (access.error || !access.address)
        throw new Error(access.error?.message || 'No address returned');
      publicKey = access.address;
    }

    this.walletType = 'freighter';
    this.publicKey = publicKey;
    return { type: 'freighter', publicKey, isConnected: true };

  }

  // ── Lobstr connection ──────────────────────────────────────────────────────

  async connectLobstr(): Promise<StellarWallet> {
    if (!this.isLobstrAvailable()) {
      throw new Error(
        "Lobstr wallet is not installed. Visit https://lobstr.co to install it."
      );
    }
    const w = window as any;
    const src = w.lobstr ?? (w.stellar?.isLobstr ? w.stellar : null);

    try {
      const result = await src.connect();
      if (!result?.publicKey) throw new Error("Lobstr did not return a public key.");
      return this._store("lobstr", result.publicKey);
    } catch (err: unknown) {
      throw friendlyError(err, "Failed to connect Lobstr. Please try again.");
    }

    if (!src) throw new Error('Lobstr wallet not found');
    const result = await src.connect();
    this.walletType = 'lobstr';
    this.publicKey = result.publicKey;
    return { type: 'lobstr', publicKey: result.publicKey, isConnected: true };

  }



  async connectAuto(): Promise<StellarWallet> {
    if (await this.isFreighterAvailable()) return this.connectFreighter();
    if (this.isLobstrAvailable()) return this.connectLobstr();

    throw new Error(

      "No Stellar wallet found. Please install Freighter (https://freighter.app) " +
        "or Lobstr (https://lobstr.co)."

      "No Stellar wallet found. Please install Freighter (https://freighter.app) or Lobstr (https://lobstr.co)."

    );

    throw new Error('No Stellar wallet found. Please install Freighter or Lobstr.');

  }



  async signTransaction(xdr: string): Promise<string> {

    if (!this._walletType || !this._publicKey) {
      throw new Error("No wallet connected. Please connect your wallet first.");
    }

    if (this._walletType === "freighter") {
      const result = await freighterApi.signTransaction(xdr, {
        networkPassphrase: MAINNET_PASSPHRASE,
      });
      if (result.error) {
        throw friendlyError(result.error, "Transaction signing failed. Please try again.");
      }
      if (!result.signedTxXdr) {

        throw new Error(
          "Freighter returned an empty signed transaction. Please try again."
        );
      }
      return result.signedTxXdr;
    }

    // Lobstr signing
    const provider = resolveLobstrProvider();
    if (!provider) {
      throw new Error(
        "Lobstr is no longer available. Please reconnect your wallet."
      );
    }

    let signResult: { signedXdr: string };
    try {
      signResult = await provider.signTransaction(xdr, {
        networkPassphrase: MAINNET_PASSPHRASE,
      });
    } catch (err: unknown) {
      throw friendlyError(err, "Transaction signing failed. Please try again.");
    }

    if (!signResult?.signedXdr) {
      throw new Error(
        "Lobstr returned an empty signed transaction. Please try again."
      );
    }
    return signResult.signedXdr;

        throw new Error("Freighter returned an empty signed transaction. Please try again.");
      }
      return result.signedTxXdr;


    if (!this.walletType || !this.publicKey) throw new Error('No wallet connected');

    if (this.walletType === 'freighter') {
      const { signedTxXdr, error } = await freighterApi.signTransaction(xdr, {
        networkPassphrase: 'Public Global Stellar Network ; September 2015',
      });
      if (error || !signedTxXdr) throw new Error(error?.message || 'Signing failed');
      return signedTxXdr;

    }

    // Lobstr
    const w = window as any;
    const src = w.lobstr ?? (w.stellar?.isLobstr ? w.stellar : null);

    if (!src) throw new Error("Lobstr is no longer available. Please reconnect.");
    try {
      const result = await src.signTransaction(xdr, { networkPassphrase: MAINNET_PASSPHRASE });
      if (!result?.signedXdr) throw new Error("Lobstr returned an empty signed transaction.");
      return result.signedXdr;
    } catch (err: unknown) {
      throw friendlyError(err, "Transaction signing failed. Please try again.");
    }

    if (!src) throw new Error('Lobstr not available');
    const result = await src.signTransaction(xdr, {
      networkPassphrase: 'Public Global Stellar Network ; September 2015',
    });
    return result.signedXdr;

  }



  getWallet(): StellarWallet | null {
    if (!this._walletType || !this._publicKey) return null;
    return { type: this._walletType, publicKey: this._publicKey, isConnected: true };
  }

  disconnect(): void {
    this._walletType = null;
    this._publicKey = null;
    this._connectingPromise = null;
  }


  private _store(type: WalletType, publicKey: string): StellarWallet {
    this._walletType = type;
    this._publicKey = publicKey;
    return { type, publicKey, isConnected: true };
  }
}


let _adapter: StellarWalletAdapter | null = null;

export function getStellarWalletAdapter(): StellarWalletAdapter {
  if (!_adapter) _adapter = new StellarWalletAdapter();
  return _adapter;
}


export function _resetAdapterSingleton(): void {
  _adapter = null;
}
