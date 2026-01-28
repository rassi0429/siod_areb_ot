const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
});

const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// ロールが作成されたとき
client.on('roleCreate', async (role) => {
  const channel = client.channels.cache.get(LOG_CHANNEL_ID);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setTitle('🆕 ロールが作成されました')
    .setColor(role.color || 0x00ff00)
    .addFields(
      { name: 'ロール名', value: role.name, inline: true },
      { name: 'ロールID', value: role.id, inline: true },
    )
    .setTimestamp();

  await channel.send({ embeds: [embed] });
});

// ロールが削除されたとき
client.on('roleDelete', async (role) => {
  const channel = client.channels.cache.get(LOG_CHANNEL_ID);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setTitle('🗑️ ロールが削除されました')
    .setColor(0xff0000)
    .addFields(
      { name: 'ロール名', value: role.name, inline: true },
      { name: 'ロールID', value: role.id, inline: true },
    )
    .setTimestamp();

  await channel.send({ embeds: [embed] });
});

// ロールが更新されたとき
client.on('roleUpdate', async (oldRole, newRole) => {
  const channel = client.channels.cache.get(LOG_CHANNEL_ID);
  if (!channel) return;

  // ロール名が変更された場合
  if (oldRole.name !== newRole.name) {
    const embed = new EmbedBuilder()
      .setTitle('✏️ ロール名が変更されました')
      .setColor(newRole.color || 0xffff00)
      .addFields(
        { name: '変更前', value: oldRole.name, inline: true },
        { name: '変更後', value: newRole.name, inline: true },
        { name: 'ロールID', value: newRole.id, inline: false },
      )
      .setTimestamp();

    await channel.send({ embeds: [embed] });
  }
});

// メンバーのロールが変更されたとき
client.on('guildMemberUpdate', async (oldMember, newMember) => {
  const channel = client.channels.cache.get(LOG_CHANNEL_ID);
  if (!channel) return;

  const oldRoles = oldMember.roles.cache;
  const newRoles = newMember.roles.cache;

  // 追加されたロール
  const addedRoles = newRoles.filter((role) => !oldRoles.has(role.id));
  // 削除されたロール
  const removedRoles = oldRoles.filter((role) => !newRoles.has(role.id));

  for (const [, role] of addedRoles) {
    const embed = new EmbedBuilder()
      .setTitle('✅ ロールが付与されました')
      .setColor(role.color || 0x00ff00)
      .addFields(
        { name: 'ユーザー', value: `${newMember.user.tag}`, inline: true },
        { name: 'ロール', value: role.name, inline: true },
      )
      .setTimestamp();

    await channel.send({ embeds: [embed] });
  }

  for (const [, role] of removedRoles) {
    const embed = new EmbedBuilder()
      .setTitle('❌ ロールが剥奪されました')
      .setColor(0xff0000)
      .addFields(
        { name: 'ユーザー', value: `${newMember.user.tag}`, inline: true },
        { name: 'ロール', value: role.name, inline: true },
      )
      .setTimestamp();

    await channel.send({ embeds: [embed] });
  }
});

client.login(process.env.DISCORD_TOKEN);
