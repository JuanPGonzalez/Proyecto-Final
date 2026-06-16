const { SupportTicket, sequelize } = require('./models');
async function test() {
  const data = await SupportTicket.findAll({
    attributes: [
      [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'cerrado' THEN 1 ELSE 0 END")), 'resolvedCount']
    ],
    group: [sequelize.fn('DATE', sequelize.col('created_at'))],
    order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
    raw: true
  });
  console.log(data);
}
test();
