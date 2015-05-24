
var crypto = require('crypto'),
	saltLength = 9;

function md5(string) {
	return crypto.createHash('md5').update(string).digest('hex');
}

function generateSalt() {
	var set = '0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ',
		setLen = set.length,
		salt = '';
	for (var i = 0; i < saltLength; i++) {
		var p = Math.floor(Math.random() * setLen);
		salt += set[p];
	}
	return salt;
}

function createHash(password) {
	var salt = generateSalt(),
		hash = md5(password + salt);
	return salt+hash;
}

function validateHash(hash, password) {
	var salt = hash.substr(0, saltLength),
		computedHash = salt + md5(password + salt);
	return hash === computedHash;
}

module.exports = {
	hash: createHash,
	validate: validateHash,
	salt: generateSalt
};
