const BRIGHT = '\x1b[1m';
const RESET = '\x1b[0m';

class Logger {
	static get time() {
		const date = new Date();

		return `${this.pad(date.getHours())}:${this.pad(date.getMinutes())}:${this.pad(date.getSeconds())}`;
	}

	static pad(number) {
		return String(number).padStart(2, '0');
	}

	static log(string, color = '') {
		console.log(`${BRIGHT}[${this.time}]${RESET} | ${color}${string}${RESET}`);
	}

	static info(string) {
		this.log(string, '\x1b[37m');
	}

	static warn(string) {
		this.log(string, '\x1b[33m');
	}

	static error(string) {
		this.log(string, '\x1b[31m');
	}
}

module.exports = Logger;