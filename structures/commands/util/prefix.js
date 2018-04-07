const Command = require('../../Command');

class PrefixCommand extends Command {
	constructor() {
		super({
			description: 'Sets the prefix of this server.',
			usage: '[prefix]',
			guildOnly: true,
		});
	}

	run(message, args) {
		const prefix = this.client.settings.get(message.guild.id, 'prefix');
		const arg = args.join(' ').toLowerCase();

		if (!arg) return message.channel.send(
			prefix === 'none'
				? 'This server doesn\'t have a prefix set.'
				: `The ${this.client.options.prefixes.length === 1 ? 'prefix is' : 'prefixes are'} currently \`\`${this.escape(prefix || this.client.options.prefixes.join(', ') || this.client.user.tag)}\`\`.`
		);
		if (!message.member.hasPermission('MANAGE_MESSAGES')) return message.channel.send('The `Manage Messages` permission is required to change the prefix.');

		if (arg.length > 10) return message.channel.send('The prefix can\'t be longer than 10 characters.');
		if (arg === prefix) return message.channel.send(`The prefixy is already \`\`${this.escape(prefix)}\`\`.`);

		return this.client.settings.set(message.guild.id, 'prefix', arg)
			.then(() => message.channel.send(arg === 'none' ? 'The server prefix has been removed.' : `The server prefix is now \`\`${this.escape(prefix)}\`\`.`));
	}
}

module.exports = PrefixCommand;