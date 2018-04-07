const Sequelize = require('sequelize');

class Statistics {
	constructor(sequelize) {
		this.db = sequelize.define('statistics', { name: Sequelize.STRING, user: Sequelize.STRING });
		this.db.sync();
	}

	add(name, user) {
		return this.db.create({ name, user });
	}

	find(name, user) {
		return this.db.findOne({ attributes: ['createdAt'], where: { name, user }, order: [['createdAt', 'DESC']] });
	}

	count(name, user) {
		return this.db.count({ where: { name, user } });
	}
}

module.exports = Statistics;