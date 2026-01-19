// utils/webCrypto.js
const secret = "xzy12qwe98mno45vbnmlqwer12345678"; // 32 characters

const getKey = async () => {
  let keyData = new TextEncoder().encode(secret);

  // Ensure key is 16 or 32 bytes
  if (keyData.length < 16) {
    const pad = new Uint8Array(16);
    pad.set(keyData);
    keyData = pad;
  } else if (keyData.length > 32) {
    keyData = keyData.slice(0, 32);
  } else if (keyData.length > 16 && keyData.length < 32) {
    keyData = keyData.slice(0, 16); // fallback to AES-128
  }

  return await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
};


export const encrypt = async (data) => {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(data));
  const encryptedBuffer = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);

  // Convert everything to Base64 strings to safely store
  return JSON.stringify({
    iv: btoa(String.fromCharCode(...iv)),
    data: btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)))
  });
};

export const decrypt = async (stored) => {
  const { iv, data } = JSON.parse(stored);
  const key = await getKey();

  const ivBytes = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
  const dataBytes = Uint8Array.from(atob(data), c => c.charCodeAt(0));

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes },
    key,
    dataBytes
  );

  return JSON.parse(new TextDecoder().decode(decrypted));
};
