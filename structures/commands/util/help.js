const Command = require('../../Command');

class HelpCommand extends Command {
	constructor() {
		super({
			description: 'Lists and gets info for my commands.',
			usage: '[command]',
		});
	}

	async run(message, args) {
		if (args[0]) {
			const command = this.client.findCommand(args[0]);
			if (!command) return message.channel.send(`No command with the name ${args[0]} was found.`);

			const embed = this.embed.setAuthor(`${this.title(command.name)} Command`, this.client.user.displayAvatarURL());

			embed.addField('Usage', `${message.prefix}${command.name}${command.usage ? ` ${command.usage}` : ''}`, true);

			if (this.client.statistics) {
				const [count, last, lastAuthor] = await Promise.all([
					this.client.statistics.count(command.name),
					this.client.statistics.find(command.name),
					this.client.statistics.find(command.name, message.author.id),
				]);

				if (last)
					embed.addField('Last Used At', last.createdAt.toUTCString(), true);

				if (lastAuthor)
					embed.addField('Last Used By You At', lastAuthor.createdAt.toUTCString(), true);

				embed.addField('Uses', count.toLocaleString(), true);
			}

			embed.addField('Description', command.description || 'None');

			return message.channel.send(embed);
		}

		const groups = [...new Set(this.client.commands.map(command => command.group))];
		if (!this.client.isOwner(message)) groups.splice(groups.indexOf('owner'), 1);

		const embed = this.embed
			.setAuthor(`${this.client.user.username}'s Commands`, this.client.user.displayAvatarURL())
			.setDescription([
				'[] = optional',
				'<> = required',
			])
			.setFooter(`Do ${message.prefix}help [command] to get info on a specific command.`);
		for (const group of groups)
			embed.addField(
				this.client.groups.get(group) || this.title(group),
				this.client.commands
					.filter(command => command.group === group)
					.map(command => `${message.prefix}${command.name}${command.usage ? ` ${command.usage}` : ''}`)
			);

		return message.channel.send(embed);
	}
}

module.exports = HelpCommand;