const t = new Set(['true', 't', 'yes', 'y', 'ok', 'yeah', 'yah', 'sure', 'enable', 'enabled', '+', '1']);
const f = new Set(['false', 'f', 'no', 'n', 'nah', 'negative', 'disable', 'disabled', '-', '0']);
const p = new Set([...t, ...f]);
const { MessageEmbed, Util } = require('discord.js');

class Command {
	constructor(options, client) {
		if (typeof options === 'string') options = { description: options };

		Object.assign(this, {
			aliases: [],
			description: null,
			usage: '',
			rate: null,
			nsfw: false,
			disabled: false,
			guildOnly: false,
			ownerOnly: false,
			clientPerms: null,
			memberPerms: null,
			client,
			...options,
		});

		if (this.clientPerms || this.memberPerms) this.guildOnly = true;
	}

	validate() {
		if (typeof this.name !== 'string') throw new TypeError('"name" must be a string');
		if (typeof this.group !== 'string') throw new TypeError('"group" must be a string');

		if (typeof this.nsfw !== 'boolean') throw new TypeError('"nsfw" must be a boolean');
		if (typeof this.disabled !== 'boolean') throw new TypeError('"disabled" must be a boolean');
		if (typeof this.guildOnly !== 'boolean') throw new TypeError('"guildOnly" must be a boolean');
		if (typeof this.ownerOnly !== 'boolean') throw new TypeError('"ownerOnly" must be a boolean');

		if (!Array.isArray(this.aliases) || this.aliases.some(alias => typeof alias !== 'string')) throw new TypeError('"aliases" must be an array of strings');
		if (typeof this.run !== 'function') throw new TypeError('No "run" function was specified');
	}

	find(message, args, type = 'members', multiple = false) {
		const matches = args.join(' ').match(/\d{16,19}/g);
		if (!matches) return;

		const get = id => message.mentions[type].get(id) || message.guild[type].get(id);

		const results = matches[multiple ? 'map' : 'find'](get);

		if (!results || !results.length) return;

		if (!multiple && results)
			args.splice(args.findIndex(arg => arg.includes(results)));
		else
			for (const arg of Object.entries(args))
				if (results.some(result => arg.includes(result.id)))
					args.splice(args.indexOf(arg), 1);

		return multiple ? [...new Set(results.filter(Boolean))] : get(results);
	}

	findBoolean(args) {
		const arg = args.findIndex(a => p.has(a.toLowerCase()));
		if (!arg) return;
		args.splice(arg, 1);

		return args[arg];
	}

	findNumber(args) {
		const arg = args.findIndex(a => /^\d+$/.test(a));
		if (!arg) return false;
		args.splice(arg, 1);

		return Number(args[arg]);
	}

	code(string, language = '') {
		return `\`\`\`${language}\n${string}\n\`\`\``;
	}

	trim(string, length) {
		return string.length - 1 > length ? `${string.slice(0, length)}${length >= string.length ? '' : '…'}` : string;
	}

	clean(string, length) {
		return this.trim(string.replace(/```/g, '``\u200b`'), length);
	}

	title(word) {
		return `${word[0].toUpperCase()}${word.slice(1)}`;
	}

	escape(text) {
		return Util.escapeMarkdown(text);
	}

	get embed() {
		return new MessageEmbed().setColor(this.client.options.color);
	}
}

module.exports = Command;