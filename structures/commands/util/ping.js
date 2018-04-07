const Command = require('../../Command');

class PingCommand extends Command {
	constructor() {
		super('Checks the time for the Discord API to respond.');
	}

	run(message, args) {
		const mentions = this.find(message, args, 'members', true);
		console.log(mentions, args);
		const now = Date.now();

		return message.channel.send('Pinging...')
			.then(msg => msg.edit(`Pong! It took me \`${(Date.now() - now).toLocaleString()}ms\` to get a response!`));
	}
}

module.exports = PingCommand;