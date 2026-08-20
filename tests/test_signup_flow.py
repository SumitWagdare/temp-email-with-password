"""
Selenium automation to test signup / admission-inquiry flow using
NoTrace temp-email API for disposable email verification.

SETUP:
    pip install selenium requests

USAGE:
    1. Update CONFIG section with your actual site URL + form field selectors.
    2. Update NOTR_BASE to point to your deployed NoTrace instance.
    3. Run:  python test_signup_flow.py

NOTE: This script automates a form on a site you own, for QA purposes.
"""

import re
import time
import requests
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


# ─────────────────────────────────────────────────────────────
# CONFIG — replace with your real site details
# ─────────────────────────────────────────────────────────────

SITE_URL = "https://gfgcdn.com/tu/110t/"  # TODO: replace with your site URL

FIELD_SELECTORS = {
    "name":          (By.ID, "name"),
    "mobile":        (By.ID, "mobile"),
    "passing_year":  (By.ID, "passingYear"),
    "course":        (By.ID, "course"),
    "email":         (By.ID, "email"),
    "password":      (By.ID, "password"),
    "confirm_pw":    (By.ID, "confirmPassword"),       # optional — set to None if not present
    "submit_button": (By.CSS_SELECTOR, "button[type='submit']"),
}

TEST_STUDENT = {
    "name": "Test Student",
    "mobile": "9999999999",
    "passing_year": "2026",
    "course": "MongoDB",
}


# ─────────────────────────────────────────────────────────────
# NOTRACE API — your deployed temp-email-with-password instance
# ─────────────────────────────────────────────────────────────

NOTRACE_BASE = "https://temp-password.vercel.app"  # TODO: update if different


def get_temp_email_and_password() -> dict:
    """
    POST /api/generate  →  creates a fresh disposable email + password.

    Returns dict with keys:
      email, password, token, accountId, provider, domain, createdAt
    """
    resp = requests.post(
        f"{NOTRACE_BASE}/api/generate",
        json={},  # optional: {"username": "custom_prefix"}
        headers={"Content-Type": "application/json"},
        timeout=20,
    )
    resp.raise_for_status()
    data = resp.json()

    if "error" in data:
        raise RuntimeError(f"NoTrace API error: {data}")

    print(f"    Email   : {data['email']}")
    print(f"    Password: {data['password']}")
    print(f"    Provider: {data['provider']} ({data['domain']})")
    return data


def poll_inbox(token: str, timeout: int = 90, interval: int = 5) -> list:
    """
    GET /api/inbox?token=<jwt>  →  polls until at least one message arrives.

    Returns list of message dicts.
    """
    deadline = time.time() + timeout
    attempt = 0
    while time.time() < deadline:
        attempt += 1
        resp = requests.get(
            f"{NOTRACE_BASE}/api/inbox",
            params={"token": token},
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        messages = data.get("messages", [])

        if messages:
            print(f"    Inbox has {len(messages)} message(s) after {attempt} poll(s)")
            return messages

        print(f"    Poll #{attempt}: inbox empty, waiting {interval}s...")
        time.sleep(interval)

    raise TimeoutError(f"No emails received within {timeout}s")


def get_message_detail(token: str, message_id: str) -> dict:
    """
    GET /api/message?token=<jwt>&id=<message_id>  →  full message with extracted links.

    Returns dict with keys:
      id, from, subject, text, html, links, createdAt
    """
    resp = requests.get(
        f"{NOTRACE_BASE}/api/message",
        params={"token": token, "id": message_id},
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json()


def find_verification_link(token: str, messages: list, keywords: list = None) -> str:
    """
    Searches through messages for a verification/confirmation link.
    Checks message subjects for keywords, then extracts links from the body.

    Args:
        token:    JWT auth token
        messages: list of inbox messages
        keywords: subject keywords to match (default: verify, confirm, activate, welcome)

    Returns the first matching URL.
    """
    if keywords is None:
        keywords = ["verify", "confirm", "activate", "welcome", "registration"]

    for msg in messages:
        subject_lower = msg.get("subject", "").lower()

        # Check if subject matches any keyword
        if not any(kw in subject_lower for kw in keywords):
            continue

        print(f"    Found matching email: \"{msg['subject']}\"")

        # Fetch full message to get links
        detail = get_message_detail(token, msg["id"])
        links = detail.get("links", [])

        if links:
            # Filter for likely verification links
            for link in links:
                link_lower = link.lower()
                if any(kw in link_lower for kw in ["verify", "confirm", "activate", "token", "callback"]):
                    print(f"    Verification link: {link}")
                    return link

            # Fallback: return the first non-asset link
            for link in links:
                if not re.search(r'\.(png|jpg|gif|css|js|ico|svg|woff)(\?|$)', link, re.I):
                    print(f"    Best candidate link: {link}")
                    return link

        # Fallback: scan plain text for URLs
        text_body = detail.get("text", "")
        url_matches = re.findall(r'https?://[^\s"\'<>]+', text_body)
        if url_matches:
            print(f"    Link from text body: {url_matches[0]}")
            return url_matches[0]

    raise ValueError("No verification link found in any matching email")


# ─────────────────────────────────────────────────────────────
# MAIN SELENIUM FLOW
# ─────────────────────────────────────────────────────────────

def run_signup_test():
    print("\n" + "=" * 60)
    print("  NoTrace Signup Flow Test")
    print("=" * 60)

    # Step 1: Generate temp email + password
    print("\n[1] Generating temp email and password...")
    account = get_temp_email_and_password()
    email = account["email"]
    password = account["password"]
    token = account["token"]

    # Step 2: Launch browser and fill form
    print(f"\n[2] Opening {SITE_URL}...")
    driver = webdriver.Chrome()
    wait = WebDriverWait(driver, 15)

    try:
        driver.get(SITE_URL)
        driver.maximize_window()
        time.sleep(2)  # Let JS framework hydrate

        print("[3] Filling signup form...")

        wait.until(EC.presence_of_element_located(FIELD_SELECTORS["name"])).send_keys(
            TEST_STUDENT["name"]
        )
        driver.find_element(*FIELD_SELECTORS["mobile"]).send_keys(
            TEST_STUDENT["mobile"]
        )
        driver.find_element(*FIELD_SELECTORS["passing_year"]).send_keys(
            TEST_STUDENT["passing_year"]
        )
        driver.find_element(*FIELD_SELECTORS["course"]).send_keys(
            TEST_STUDENT["course"]
        )
        driver.find_element(*FIELD_SELECTORS["email"]).send_keys(email)
        driver.find_element(*FIELD_SELECTORS["password"]).send_keys(password)

        # Fill confirm password if the field exists
        if FIELD_SELECTORS.get("confirm_pw"):
            try:
                driver.find_element(*FIELD_SELECTORS["confirm_pw"]).send_keys(password)
            except Exception:
                print("    (confirm_pw field not found, skipping)")

        # Submit form
        print("[4] Submitting form...")
        submit_btn = driver.find_element(*FIELD_SELECTORS["submit_button"])
        driver.execute_script("arguments[0].scrollIntoView(true);", submit_btn)
        time.sleep(0.5)
        submit_btn.click()
        print("    Form submitted!")

        # Step 3: Poll inbox for verification email
        print("\n[5] Polling inbox for verification email...")
        messages = poll_inbox(token, timeout=90, interval=5)

        # Step 4: Find and open verification link
        print("\n[6] Extracting verification link...")
        verify_link = find_verification_link(token, messages)

        print(f"\n[7] Opening verification link: {verify_link}")
        driver.get(verify_link)
        time.sleep(3)

        # Step 5: Verify success (customize this check for your site)
        # Examples of checks you can use:
        #   wait.until(EC.url_contains("verified"))
        #   wait.until(EC.url_contains("dashboard"))
        #   wait.until(EC.presence_of_element_located((By.CLASS_NAME, "success-message")))

        current_url = driver.current_url
        page_text = driver.find_element(By.TAG_NAME, "body").text.lower()

        if any(kw in current_url.lower() for kw in ["verified", "success", "dashboard", "welcome"]):
            print("\n[✓] SUCCESS: Signup + email verification flow passed!")
        elif any(kw in page_text for kw in ["verified", "success", "welcome", "thank you"]):
            print("\n[✓] SUCCESS: Verification confirmed on page!")
        else:
            print(f"\n[?] Verification page loaded: {current_url}")
            print("    Please check manually if verification succeeded.")

        # Take a screenshot for evidence
        screenshot_path = "signup_test_result.png"
        driver.save_screenshot(screenshot_path)
        print(f"    Screenshot saved: {screenshot_path}")

    except Exception as e:
        print(f"\n[✗] TEST FAILED: {e}")
        driver.save_screenshot("signup_test_error.png")
        print("    Error screenshot saved: signup_test_error.png")
        raise

    finally:
        time.sleep(2)
        driver.quit()
        print("\n" + "=" * 60)
        print("  Test complete. Browser closed.")
        print("=" * 60 + "\n")


if __name__ == "__main__":
    run_signup_test()
