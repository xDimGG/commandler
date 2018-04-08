const { Client: _Client, Collection } = require('discord.js');
const Sequelize = require('sequelize');

const Statistics = require('./Statistics');
const Settings = require('./Settings');

const CommandClass = require('./Command');
const EventClass = require('./Event');
const Logger = require('./Logger');

const { join } = require('path');
const fs = require('fs');

class Client extends _Client {
	constructor(options = {}) {
		const owners = options.owner || options.owners || [];
		const prefixes = options.prefix || options.prefixes || [];

		super({
			color: 0x48D1CC,
			config: options.config,
			owners: Array.isArray(owners) ? owners : [owners],
			logger: Logger,
			prefixes: (Array.isArray(prefixes) ? prefixes : [prefixes]).map(prefix => String(prefix).toLowerCase()),
			disableEveryone: true,
			disabledEvents: ['START_TYPING'],
			...options,

			messages: {
				error: 'An error occurred while trying to execute this command.',
				nsfw: 'This command only works within NSFW channels or DMs.',
				disabled: 'This command is currently disabled.',
				guildOnly: 'This command only works in servers.',
				ownerOnly: 'This command can only be used by my owner.',
				clientPerms: 'I don\'t have permissions to execute this command.',
				memberPerms: 'You aren\'t authorized to execute this command.',
				rateLimit: 'You can\'t use this command for another {time} second{s}.',
				invalidUsage: 'Invalid usage! Please do `{usage}`.',
				...options.messages,
			},
		});

		this.commands = new Collection();
		this.groups = new Collection();
		this.rates = new Collection();

		if (options.db) {
			if (typeof options.db === 'string') options.db = { storage: options.db };
			const dbOptions = Array.isArray(options.db) ? options.db : [options.db];
			const finalOption = {
				dialect: 'sqlite',
				logging: false,
				operatorsAliases: false,
				...dbOptions.pop(),
			};

			this.sequelize = new Sequelize(...dbOptions, finalOption);
			this.settings = new Settings(this.sequelize);
			this.statistics = new Statistics(this.sequelize);
		}

		this.on('message', this.onMessage);
	}

	get logger() {
		return this.options.logger;
	}

	isOwner(user) {
		return this.options.owners.includes(this.users.resolveID(user));
	}

	async onMessage(message) {
		if (message.author.bot) return;
		if (message.channel.type === 'text' && !message.channel.permissionsFor(message.guild.me).has('SEND_MESSAGES')) return;

		const prefix = this.getPrefix(message);
		if (prefix === false) return;

		const args = message.content.slice(prefix.length).trim().split(' ');
		const name = args.shift().toLowerCase();
		const command = this.findCommand(name);
		if (!command) return this.emit('unknownCommand', message, name, args);

		if (message.channel.type === 'text' && !message.member)
			message.member = await message.guild.members.fetch(message.author.id);

		const owner = this.isOwner(message);
		if (command.nsfw && (message.channel.type === 'text' && !message.channel.nsfw)) return message.reply(this.options.messages.nsfw);
		if (command.disabled && !owner) return message.reply(this.options.messages.disabled);
		if (command.guildOnly && message.channel.type !== 'text') return message.reply(this.options.messages.guildOnly);
		if (command.ownerOnly && !owner) return message.reply(this.options.messages.ownerOnly);
		if (command.clientPerms && !owner && !message.guild.me.hasPermission(command.clientPerms)) return message.reply(this.options.messages.clientPerms);
		if (command.memberPerms && !owner && !message.member.hasPermission(command.memberPerms)) return message.reply(this.options.messages.memberPerms);

		if (command.rate && !owner) {
			const key = `${message.author.id}|${command.name}`;
			const now = Date.now();
			const rate = this.rates.get(key);
			if (rate && rate[1] >= now) {
				const seconds = Math.round((rate[1] - now) / 1000);
				if (rate[0] === 0) return message.reply(this.options.messages.rateLimit.replace('{time}', seconds).replace('{s}', seconds === 1 ? '' : 's'));
				rate[0]--;
			} else
				this.rates.set(key, [command.rate.count - 1, now + (command.rate.seconds * 1000)]);
		}

		if (this.statistics) this.statistics.add(command.name, message.author.id);

		if (message.mentions.users.size > 1)
			message.mentions.users.delete(this.client.user.id);
		if (message.mentions.members.size > 1)
			message.mentions.members.delete(this.client.user.id);

		const invalidUsage = () => message.channel.send(this.options.messages.invalidUsage.replace('{usage}', `${prefix}${command.name} ${command.usage}`));

		if (!args.length && command.usage.includes('<'))
			return invalidUsage();

		try {
			message.prefix = prefix;
			const successful = await command.run(message, args);

			if (successful === false)
				return invalidUsage();
		} catch (error) {
			this.logger.error(`${command.name}\n${error.stack || error}`);

			message.channel.send(this.options.messages.error);
		}
	}

	addCommand(Command, name, group) {
		if (!Command || !(Command.prototype instanceof CommandClass))
			throw new TypeError('Either no command class was provide or the provided command class doesn\'t extend the base command class');

		const command = new Command({ name, group }, this);
		command.name = command.name || name;
		command.group = command.group || group;
		command.client = command.client || this;
		command.validate();

		this.commands.set(command.name, command);

		return this;
	}

	addCommands(path) {
		for (const folder of fs.readdirSync(path)) {
			const folderPath = join(path, folder);
			for (const file of fs.readdirSync(folderPath))
				this.addCommand(require(join(folderPath, file)), file.split('.')[0], folder); // eslint-disable-line global-require
		}

		return this;
	}

	addDefaults() {
		this.addCommands(join(__dirname, 'commands'));
		this.addGroups({ util: 'Utility', owner: 'Owner' });

		return this;
	}

	addEvent(Event, name) {
		if (!Event || !(Event.prototype instanceof EventClass))
			throw new TypeError('Either no command class was provide or the provided command class doesn\'t extend the base command class');

		const event = new Event(name, this);
		event.name = event.name || name;
		event.client = event.client || this;

		this.on(event.name, event.run.bind(event));

		return this;
	}

	addEvents(path) {
		for (const file of fs.readdirSync(path))
			this.addEvent(require(join(path, file)), file.split('.')[0]); // eslint-disable-line global-require

		return this;
	}

	addGroup(name, displayName) {
		this.groups.set(name, displayName);

		return this;
	}

	addGroups(names) {
		for (const [name, displayName] of Object.entries(names))
			this.addGroup(name, displayName);

		return this;
	}

	findCommand(name) {
		return this.commands.get(name) || this.commands.find(command => command.aliases.includes(name));
	}

	getPrefix(message) {
		const mentionPrefix = String(message.channel.type === 'text' ? message.guild.me : this.user);
		if (message.content.startsWith(mentionPrefix)) return mentionPrefix;

		const customPrefix = message.channel.type === 'text' && this.settings && this.settings.get(message.guild.id, 'prefix');
		const content = message.content.toLowerCase();
		if (customPrefix === 'none') return false;
		if (customPrefix)
			return content.startsWith(customPrefix) ? customPrefix : false;

		for (const prefix of this.options.prefixes)
			if (content.startsWith(prefix))
				return prefix;

		return message.channel.type === 'text' ? false : '';
	}
}

module.exports = Client;