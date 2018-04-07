class Event {
	constructor(name, client) {
		this.name = name;
		this.client = client;

		if (typeof this.run !== 'function') throw new TypeError('No "run" function was specified');
	}
}

module.exports = Event;