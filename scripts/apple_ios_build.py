#!/usr/bin/env python3
"""
Apple iOS Certificate & Provisioning Profile Generator
Uses App Store Connect API to generate Distribution Certificate and Provisioning Profile
"""

import jwt
import time
import requests
import subprocess
import base64
import json
import os
import sys

# Apple API Configuration
KEY_ID = "SY73BJWM2N"
ISSUER_ID = "e90a7e24-7c92-4142-940e-d87ca023bd76"
P8_KEY_PATH = "/app/frontend/AuthKey_SY73BJWM2N.p8"
TEAM_ID = "H4BK37FNXQ"
BUNDLE_ID = "com.ask.syr"

# Output paths
PRIVATE_KEY_PATH = "/tmp/ios_dist_key.pem"
CSR_PATH = "/tmp/ios_dist.csr"
CERT_DER_PATH = "/tmp/ios_dist_cert.cer"
CERT_PEM_PATH = "/tmp/ios_dist_cert.pem"
P12_PATH = "/tmp/dist_cert.p12"
PROVISION_PATH = "/tmp/app_store.mobileprovision"
APPLE_WWDR_PEM = "/tmp/AppleWWDRCAG3.pem"
P12_PASSWORD = "askkitchen2026"

APPLE_API_BASE = "https://api.appstoreconnect.apple.com/v1"


def generate_jwt_token():
    """Generate JWT token for Apple API authentication"""
    with open(P8_KEY_PATH, "r") as f:
        private_key = f.read()
    
    now = int(time.time())
    payload = {
        "iss": ISSUER_ID,
        "iat": now,
        "exp": now + 1200,  # 20 minutes
        "aud": "appstoreconnect-v1"
    }
    
    headers = {
        "alg": "ES256",
        "kid": KEY_ID,
        "typ": "JWT"
    }
    
    token = jwt.encode(payload, private_key, algorithm="ES256", headers=headers)
    return token


def apple_api_request(method, endpoint, data=None, token=None):
    """Make authenticated request to Apple API"""
    if token is None:
        token = generate_jwt_token()
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    url = f"{APPLE_API_BASE}{endpoint}"
    
    if method == "GET":
        resp = requests.get(url, headers=headers)
    elif method == "POST":
        resp = requests.post(url, headers=headers, json=data)
    elif method == "DELETE":
        resp = requests.delete(url, headers=headers)
    else:
        raise ValueError(f"Unknown method: {method}")
    
    return resp


def step1_generate_private_key_and_csr():
    """Generate RSA private key and CSR"""
    print("=" * 60)
    print("STEP 1: Generating RSA Private Key and CSR...")
    print("=" * 60)
    
    # Generate RSA 2048-bit private key
    result = subprocess.run(
        ["openssl", "genrsa", "-out", PRIVATE_KEY_PATH, "2048"],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        print(f"ERROR generating private key: {result.stderr}")
        return False
    print(f"  ✓ Private key generated: {PRIVATE_KEY_PATH}")
    
    # Generate CSR
    result = subprocess.run(
        ["openssl", "req", "-new", "-key", PRIVATE_KEY_PATH, "-out", CSR_PATH,
         "-subj", "/CN=ASK Kitchen Distribution/O=ASK/C=SE"],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        print(f"ERROR generating CSR: {result.stderr}")
        return False
    print(f"  ✓ CSR generated: {CSR_PATH}")
    
    return True


def step2_cleanup_old_certificates():
    """List and optionally revoke old distribution certificates"""
    print("\n" + "=" * 60)
    print("STEP 2: Checking existing certificates...")
    print("=" * 60)
    
    token = generate_jwt_token()
    resp = apple_api_request("GET", "/certificates?filter[certificateType]=DISTRIBUTION", token=token)
    
    if resp.status_code != 200:
        print(f"  Warning: Could not list certificates: {resp.status_code}")
        print(f"  Response: {resp.text[:500]}")
        return True
    
    certs = resp.json().get("data", [])
    print(f"  Found {len(certs)} existing distribution certificate(s)")
    
    # Revoke old certificates to avoid hitting the 3-cert limit
    for cert in certs:
        cert_id = cert["id"]
        cert_name = cert.get("attributes", {}).get("name", "Unknown")
        print(f"  Revoking old certificate: {cert_name} (ID: {cert_id})")
        del_resp = apple_api_request("DELETE", f"/certificates/{cert_id}", token=token)
        if del_resp.status_code in [200, 204]:
            print(f"    ✓ Revoked successfully")
        else:
            print(f"    Warning: Could not revoke: {del_resp.status_code} - {del_resp.text[:200]}")
    
    return True


def step3_create_certificate():
    """Submit CSR to Apple and get Distribution Certificate"""
    print("\n" + "=" * 60)
    print("STEP 3: Creating Distribution Certificate via Apple API...")
    print("=" * 60)
    
    # Read CSR content
    with open(CSR_PATH, "r") as f:
        csr_content = f.read()
    
    data = {
        "data": {
            "type": "certificates",
            "attributes": {
                "csrContent": csr_content,
                "certificateType": "DISTRIBUTION"
            }
        }
    }
    
    token = generate_jwt_token()
    resp = apple_api_request("POST", "/certificates", data=data, token=token)
    
    if resp.status_code not in [200, 201]:
        print(f"  ERROR: {resp.status_code}")
        print(f"  Response: {resp.text[:1000]}")
        return None
    
    cert_data = resp.json()["data"]
    cert_id = cert_data["id"]
    cert_content = cert_data["attributes"]["certificateContent"]
    
    # Save certificate as DER
    cert_bytes = base64.b64decode(cert_content)
    with open(CERT_DER_PATH, "wb") as f:
        f.write(cert_bytes)
    print(f"  ✓ Certificate created (ID: {cert_id})")
    print(f"  ✓ Saved DER certificate: {CERT_DER_PATH}")
    
    # Convert DER to PEM
    result = subprocess.run(
        ["openssl", "x509", "-inform", "DER", "-in", CERT_DER_PATH, 
         "-out", CERT_PEM_PATH, "-outform", "PEM"],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        print(f"  ERROR converting to PEM: {result.stderr}")
        return None
    print(f"  ✓ Converted to PEM: {CERT_PEM_PATH}")
    
    # Verify the certificate
    result = subprocess.run(
        ["openssl", "x509", "-in", CERT_PEM_PATH, "-noout", "-subject", "-fingerprint"],
        capture_output=True, text=True
    )
    print(f"  Certificate info: {result.stdout.strip()}")
    
    return cert_id


def step4_download_apple_wwdr_ca():
    """Download Apple WWDR Intermediate Certificate if not present"""
    print("\n" + "=" * 60)
    print("STEP 4: Ensuring Apple WWDR CA certificate...")
    print("=" * 60)
    
    if os.path.exists(APPLE_WWDR_PEM):
        print(f"  ✓ Already exists: {APPLE_WWDR_PEM}")
        return True
    
    # Download Apple WWDR G3 certificate
    wwdr_url = "https://www.apple.com/certificateauthority/AppleWWDRCAG3.cer"
    resp = requests.get(wwdr_url)
    if resp.status_code != 200:
        print(f"  ERROR downloading WWDR CA: {resp.status_code}")
        return False
    
    wwdr_der = "/tmp/AppleWWDRCAG3.cer"
    with open(wwdr_der, "wb") as f:
        f.write(resp.content)
    
    # Convert to PEM
    result = subprocess.run(
        ["openssl", "x509", "-inform", "DER", "-in", wwdr_der, 
         "-out", APPLE_WWDR_PEM, "-outform", "PEM"],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        print(f"  ERROR converting WWDR to PEM: {result.stderr}")
        return False
    
    print(f"  ✓ Apple WWDR CA ready: {APPLE_WWDR_PEM}")
    return True


def step5_create_p12():
    """Convert certificate + private key to P12 format"""
    print("\n" + "=" * 60)
    print("STEP 5: Creating P12 bundle...")
    print("=" * 60)
    
    # Verify private key matches certificate
    print("  Verifying key-certificate match...")
    
    key_modulus = subprocess.run(
        ["openssl", "rsa", "-in", PRIVATE_KEY_PATH, "-noout", "-modulus"],
        capture_output=True, text=True
    )
    cert_modulus = subprocess.run(
        ["openssl", "x509", "-in", CERT_PEM_PATH, "-noout", "-modulus"],
        capture_output=True, text=True
    )
    
    if key_modulus.stdout.strip() == cert_modulus.stdout.strip():
        print("  ✓ Private key matches certificate!")
    else:
        print("  ERROR: Private key does NOT match certificate!")
        print(f"  Key modulus:  {key_modulus.stdout[:50]}...")
        print(f"  Cert modulus: {cert_modulus.stdout[:50]}...")
        return False
    
    # Create P12 with LEGACY encryption for macOS compatibility
    # OpenSSL 3.x defaults to AES-256-CBC which macOS keychain can't import
    # Must use legacy 3DES encryption that macOS security framework understands
    result = subprocess.run(
        ["openssl", "pkcs12", "-export",
         "-out", P12_PATH,
         "-inkey", PRIVATE_KEY_PATH,
         "-in", CERT_PEM_PATH,
         "-certfile", APPLE_WWDR_PEM,
         "-password", f"pass:{P12_PASSWORD}",
         "-legacy"],
        capture_output=True, text=True
    )
    
    if result.returncode != 0:
        print(f"  ERROR creating P12: {result.stderr}")
        return False
    
    # Verify P12 (also needs -legacy flag to read legacy-encrypted P12)
    verify = subprocess.run(
        ["openssl", "pkcs12", "-in", P12_PATH, "-noout",
         "-password", f"pass:{P12_PASSWORD}", "-legacy"],
        capture_output=True, text=True
    )
    
    if verify.returncode != 0:
        print(f"  ERROR: P12 verification failed: {verify.stderr}")
        return False
    
    p12_size = os.path.getsize(P12_PATH)
    print(f"  ✓ P12 created: {P12_PATH} ({p12_size} bytes)")
    
    # Get fingerprint for reference
    fingerprint = subprocess.run(
        ["openssl", "x509", "-in", CERT_PEM_PATH, "-noout", "-fingerprint", "-sha1"],
        capture_output=True, text=True
    )
    print(f"  Certificate fingerprint: {fingerprint.stdout.strip()}")
    
    return True


def step6_get_or_create_bundle_id():
    """Get or register the bundle ID"""
    print("\n" + "=" * 60)
    print("STEP 6: Getting Bundle ID...")
    print("=" * 60)
    
    token = generate_jwt_token()
    resp = apple_api_request("GET", f"/bundleIds?filter[identifier]={BUNDLE_ID}", token=token)
    
    if resp.status_code != 200:
        print(f"  ERROR listing bundle IDs: {resp.status_code}")
        print(f"  Response: {resp.text[:500]}")
        return None
    
    bundle_ids = resp.json().get("data", [])
    
    if bundle_ids:
        bundle_id_resource = bundle_ids[0]["id"]
        print(f"  ✓ Found existing bundle ID: {BUNDLE_ID} (Resource ID: {bundle_id_resource})")
        return bundle_id_resource
    
    # Register new bundle ID
    print(f"  Registering new bundle ID: {BUNDLE_ID}")
    data = {
        "data": {
            "type": "bundleIds",
            "attributes": {
                "identifier": BUNDLE_ID,
                "name": "ASK Aleppo Syrian Kitchen",
                "platform": "IOS"
            }
        }
    }
    
    resp = apple_api_request("POST", "/bundleIds", data=data, token=token)
    if resp.status_code not in [200, 201]:
        print(f"  ERROR registering bundle ID: {resp.status_code}")
        print(f"  Response: {resp.text[:500]}")
        return None
    
    bundle_id_resource = resp.json()["data"]["id"]
    print(f"  ✓ Bundle ID registered (Resource ID: {bundle_id_resource})")
    return bundle_id_resource


def step7_create_provisioning_profile(cert_id, bundle_id_resource):
    """Create App Store provisioning profile"""
    print("\n" + "=" * 60)
    print("STEP 7: Creating Provisioning Profile...")
    print("=" * 60)
    
    token = generate_jwt_token()
    
    # First, delete any existing profiles for this bundle ID
    resp = apple_api_request("GET", f"/profiles?filter[profileType]=IOS_APP_STORE", token=token)
    if resp.status_code == 200:
        profiles = resp.json().get("data", [])
        for profile in profiles:
            profile_name = profile.get("attributes", {}).get("name", "")
            if BUNDLE_ID in profile_name or "ASK" in profile_name:
                print(f"  Deleting old profile: {profile_name}")
                apple_api_request("DELETE", f"/profiles/{profile['id']}", token=token)
    
    # Create new provisioning profile
    data = {
        "data": {
            "type": "profiles",
            "attributes": {
                "name": f"ASK Kitchen App Store Profile",
                "profileType": "IOS_APP_STORE"
            },
            "relationships": {
                "bundleId": {
                    "data": {
                        "type": "bundleIds",
                        "id": bundle_id_resource
                    }
                },
                "certificates": {
                    "data": [
                        {
                            "type": "certificates",
                            "id": cert_id
                        }
                    ]
                }
            }
        }
    }
    
    resp = apple_api_request("POST", "/profiles", data=data, token=token)
    
    if resp.status_code not in [200, 201]:
        print(f"  ERROR: {resp.status_code}")
        print(f"  Response: {resp.text[:1000]}")
        return False
    
    profile_data = resp.json()["data"]
    profile_content = profile_data["attributes"]["profileContent"]
    
    # Save provisioning profile
    profile_bytes = base64.b64decode(profile_content)
    with open(PROVISION_PATH, "wb") as f:
        f.write(profile_bytes)
    
    profile_size = os.path.getsize(PROVISION_PATH)
    print(f"  ✓ Provisioning profile created: {PROVISION_PATH} ({profile_size} bytes)")
    
    return True


def step8_update_credentials_json():
    """Update EAS credentials.json"""
    print("\n" + "=" * 60)
    print("STEP 8: Updating credentials.json...")
    print("=" * 60)
    
    credentials = {
        "ios": {
            "provisioningProfilePath": PROVISION_PATH,
            "distributionCertificate": {
                "path": P12_PATH,
                "password": P12_PASSWORD
            }
        }
    }
    
    creds_path = "/app/frontend/credentials.json"
    with open(creds_path, "w") as f:
        json.dump(credentials, f, indent=2)
    
    print(f"  ✓ Updated: {creds_path}")
    print(f"  P12 path: {P12_PATH}")
    print(f"  Provisioning profile: {PROVISION_PATH}")
    
    return True


def main():
    print("🍽️  ASK Kitchen - iOS Build Certificate Generator")
    print("=" * 60)
    print(f"  Key ID:    {KEY_ID}")
    print(f"  Issuer ID: {ISSUER_ID}")
    print(f"  Team ID:   {TEAM_ID}")
    print(f"  Bundle ID: {BUNDLE_ID}")
    print("=" * 60)
    
    # Test API connectivity first
    print("\nTesting Apple API connectivity...")
    token = generate_jwt_token()
    test_resp = apple_api_request("GET", "/certificates?limit=1", token=token)
    if test_resp.status_code != 200:
        print(f"ERROR: Apple API returned {test_resp.status_code}")
        print(f"Response: {test_resp.text[:500]}")
        print("\nPlease verify your Issuer ID and Key ID are correct.")
        sys.exit(1)
    print("  ✓ Apple API connection successful!\n")
    
    # Step 1: Generate private key and CSR
    if not step1_generate_private_key_and_csr():
        sys.exit(1)
    
    # Step 2: Clean up old certificates
    step2_cleanup_old_certificates()
    
    # Step 3: Create new certificate
    cert_id = step3_create_certificate()
    if not cert_id:
        sys.exit(1)
    
    # Step 4: Get Apple WWDR CA
    if not step4_download_apple_wwdr_ca():
        sys.exit(1)
    
    # Step 5: Create P12
    if not step5_create_p12():
        sys.exit(1)
    
    # Step 6: Get bundle ID
    bundle_id_resource = step6_get_or_create_bundle_id()
    if not bundle_id_resource:
        sys.exit(1)
    
    # Step 7: Create provisioning profile
    if not step7_create_provisioning_profile(cert_id, bundle_id_resource):
        sys.exit(1)
    
    # Step 8: Update credentials.json
    if not step8_update_credentials_json():
        sys.exit(1)
    
    print("\n" + "=" * 60)
    print("🎉 ALL STEPS COMPLETED SUCCESSFULLY!")
    print("=" * 60)
    print("\nReady to run: eas build --platform ios --profile production")
    print("=" * 60)


if __name__ == "__main__":
    main()
