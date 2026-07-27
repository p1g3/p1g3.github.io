export interface ProtectedPayload {
	version: 1;
	context: string;
	kdf: {
		name: 'PBKDF2';
		hash: 'SHA-256';
		iterations: number;
		salt: string;
	};
	cipher: {
		name: 'AES-GCM';
		iv: string;
		tagLength: 128;
	};
	ciphertext: string;
}

export const isProtectedPayload = (value: unknown): value is ProtectedPayload => {
	if (!value || typeof value !== 'object') {
		return false;
	}

	const payload = value as Partial<ProtectedPayload>;

	return (
		payload.version === 1 &&
		typeof payload.context === 'string' &&
		payload.kdf?.name === 'PBKDF2' &&
		payload.kdf.hash === 'SHA-256' &&
		typeof payload.kdf.iterations === 'number' &&
		typeof payload.kdf.salt === 'string' &&
		payload.cipher?.name === 'AES-GCM' &&
		typeof payload.cipher.iv === 'string' &&
		payload.cipher.tagLength === 128 &&
		typeof payload.ciphertext === 'string'
	);
};
