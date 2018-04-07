const Command = require('../../Command');
const { inspect } = require('util');

class EvalCommand extends Command {
	constructor() {
		super({
			description: 'Evaluated arbitrary JavaScript.',
			ownerOnly: true,
		});
	}

	async run(message, args) {
		const arg = args.join(' ');
		let errored = false;
		let evaled;
		const now = process.hrtime();

		try {
			evaled = await eval(arg);
		} catch (error) {
			evaled = error;
			errored = true;
		}

		const end = process.hrtime(now)[1] / 1e6;
		const type = evaled === undefined || evaled === null ? 'null' : evaled.constructor.name;
		const ins = inspect(evaled, { depth: 1 });
		const len = ins.length >= 1600 ? 1600 : ins.length;

		return message.channel.send([
			'📥 Input',
			this.code(this.clean(arg, 1900 - len), 'js'),
			`📤 \`${type}\` ${errored ? 'Error' : 'Output'} ${end}ms`,
			this.code(this.clean(ins.split(this.client.token).join('[TOKEN]'), len), 'js'),
		]);
	}
}

module.exports = EvalCommand;