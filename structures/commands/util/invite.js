const Command = require('../../Command');
const base = 'https://discordapp.com/oauth2/authorize';

class InviteCommand extends Command {
	constructor() {
		super('Gets an invite link for me.');
	}

	run(message) {
		return message.channel.send([
			'__Invite me to your server__',
			`<${base}?client_id=${this.client.user.id}${this.client.options.permissions ? `&permissions=${this.client.options.permissions}` : ''}>`,
			this.client.options.invite ? `__Join my server__\n${this.client.options.invite}` : '',
		]);
	}
}

module.exports = InviteCommand;