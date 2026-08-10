import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearGoogleContactsOAuthUrlParams,
  readGoogleContactsOAuthCodeFromUrl,
  relayGoogleContactsOAuthPopup,
  shouldOpenContactsSyncSetup,
  stashGoogleContactsOAuthCode,
  takeGoogleContactsOAuthCode,
} from "@/lib/contacts/googleContactsOAuth";

const STATE = encodeURIComponent(JSON.stringify({ source: "google_contacts" }));

function setUrl(search: string): void {
  window.history.replaceState({}, "", `${window.location.pathname}${search}`);
}

describe("readGoogleContactsOAuthCodeFromUrl", () => {
  beforeEach(() => {
    setUrl("");
  });

  it("returns the code when state is a valid google_contacts payload", () => {
    setUrl(`?code=abc123&state=${STATE}`);
    expect(readGoogleContactsOAuthCodeFromUrl()).toBe("abc123");
  });

  it("returns null when the code is missing", () => {
    setUrl(`?state=${STATE}`);
    expect(readGoogleContactsOAuthCodeFromUrl()).toBeNull();
  });

  it("returns null for missing or foreign state", () => {
    setUrl("?code=abc123");
    expect(readGoogleContactsOAuthCodeFromUrl()).toBeNull();
    setUrl(`?code=abc123&state=${encodeURIComponent(JSON.stringify({ source: "other" }))}`);
    expect(readGoogleContactsOAuthCodeFromUrl()).toBeNull();
  });
});

describe("clearGoogleContactsOAuthUrlParams", () => {
  beforeEach(() => {
    setUrl("");
  });

  it("strips the OAuth params via history.replaceState", () => {
    setUrl("?code=abc&state=xyz&scope=email&authuser=0&prompt=consent&keep=1");
    const replaceSpy = vi.spyOn(window.history, "replaceState");
    clearGoogleContactsOAuthUrlParams();
    expect(replaceSpy).toHaveBeenCalled();
    expect(window.location.search).toBe("?keep=1");
    replaceSpy.mockRestore();
  });

  it("is a no-op when no OAuth params are present", () => {
    setUrl("?keep=1");
    const replaceSpy = vi.spyOn(window.history, "replaceState");
    clearGoogleContactsOAuthUrlParams();
    expect(replaceSpy).not.toHaveBeenCalled();
    replaceSpy.mockRestore();
  });
});

describe("stash/take/shouldOpen", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("stashes the code and flags the setup panel", () => {
    stashGoogleContactsOAuthCode("code-42");
    expect(takeGoogleContactsOAuthCode()).toBe("code-42");
    expect(takeGoogleContactsOAuthCode()).toBeNull();
    expect(shouldOpenContactsSyncSetup()).toBe(true);
    expect(shouldOpenContactsSyncSetup()).toBe(false);
  });
});

describe("relayGoogleContactsOAuthPopup", () => {
  it("relays the code to the opener and closes the window", () => {
    const postMessage = vi.fn();
    const close = vi.fn();
    const opener = { closed: false, postMessage } as unknown as Window;
    window.opener = opener;
    vi.spyOn(window, "close").mockImplementation(close);

    expect(relayGoogleContactsOAuthPopup("code-7")).toBe(true);
    expect(postMessage).toHaveBeenCalledWith(
      { type: "mms-google-contacts-oauth", code: "code-7" },
      window.location.origin,
    );
    expect(close).toHaveBeenCalled();
  });

  it("returns false when the opener is closed", () => {
    window.opener = { closed: true, postMessage: vi.fn() } as unknown as Window;
    expect(relayGoogleContactsOAuthPopup("code-7")).toBe(false);
  });
});
