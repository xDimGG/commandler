const Sequelize = require('sequelize');

class Settings {
	constructor(sequelize) {
		this.db = sequelize.define('settings', {
			id: { primaryKey: true, type: Sequelize.STRING },
			key: { primaryKey: true, type: Sequelize.STRING },
			value: { type: Sequelize.TEXT },
		});
		this.init();
	}

	async init() {
		this.data = {};
		await this.db.sync();
		const rows = await this.db.findAll({ attributes: ['id', 'key', 'value'] });
		for (const { id, key, value } of rows) this.setLocal(id, key, value);
	}

	set(id, key, value) {
		this.setLocal(id, key, value);

		return this.db.upsert({ id, key, value });
	}

	get(id, key, fallback) {
		const value = id in this.data ? this.data[id][key] : undefined;

		return value === undefined ? fallback : value;
	}

	delete(id, key) {
		if (key) {
			if (id in this.data) delete this.data[id][key];

			return this.db.destroy({ where: { id, key } });
		}

		delete this.data[id];

		return this.db.destory({ where: { id } });
	}

	setLocal(id, key, value) {
		if (id in this.data) this.data[id][key] = value;
		else this.data[id] = { [key]: value };
	}
}

module.exports = Settings;